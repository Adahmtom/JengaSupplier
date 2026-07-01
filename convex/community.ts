import { mutation, query, MutationCtx, QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import { getUserByClerkId, getActiveSubscription } from './_helpers'
import { ADMIN_ROLES } from './lib/permissions'

// Blocks phone numbers in any common format
const PHONE_RE = /(\+?[\d][\s\-\.\(\)]?){7,}/

function containsPhone(text: string): boolean {
  // Strip obvious non-phone chars then test
  return PHONE_RE.test(text.replace(/[^\d\s\+\-\.\(\)]/g, ' '))
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function requireMember(ctx: MutationCtx | QueryCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Not authenticated')
  const user = await getUserByClerkId(ctx, identity.subject)
  if (!user) throw new Error('User not found')
  return user
}

// ── Queries ───────────────────────────────────────────────────────────────────

export const listPosts = query({
  args: {
    portalId: v.optional(v.id('portals')),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { portalId, limit = 40 }) => {
    const safeLimit = Math.min(limit, 100)
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    const user = await getUserByClerkId(ctx, identity.subject)
    if (!user) return null

    const isAdmin = ADMIN_ROLES.has(user.role)

    const posts = portalId
      ? await ctx.db
          .query('communityPosts')
          .withIndex('by_portal', (q) => q.eq('portalId', portalId))
          .order('desc')
          .take(safeLimit)
      : await ctx.db
          .query('communityPosts')
          .order('desc')
          .take(safeLimit)

    const visible = isAdmin ? posts : posts.filter((p) => !p.isHidden)

    return Promise.all(
      visible.map(async (post) => {
        const [author, reactions, imageUrl, userReport] = await Promise.all([
          ctx.db.get(post.authorId),
          ctx.db.query('communityReactions').withIndex('by_post', (q) => q.eq('postId', post._id)).collect(),
          post.imageStorageId ? ctx.storage.getUrl(post.imageStorageId) : null,
          ctx.db.query('communityReports').withIndex('by_post', (q) => q.eq('postId', post._id))
            .filter((q) => q.eq(q.field('reportedBy'), user._id)).first(),
        ])

        // Group reactions as array to avoid emoji field name issue with Convex serialization
        const reactionTotals = new Map<string, { count: number; hasReacted: boolean }>()
        for (const r of reactions) {
          const existing = reactionTotals.get(r.emoji) ?? { count: 0, hasReacted: false }
          reactionTotals.set(r.emoji, {
            count: existing.count + 1,
            hasReacted: existing.hasReacted || r.userId === user._id,
          })
        }
        const reactionList = Array.from(reactionTotals.entries()).map(([emoji, data]) => ({
          emoji,
          count: data.count,
          hasReacted: data.hasReacted,
        }))

        return {
          ...post,
          author: { name: author?.name, email: author?.email, imageUrl: author?.imageUrl, role: author?.role },
          reactions: reactionList,
          imageUrl,
          hasReported: !!userReport,
          isOwn: post.authorId === user._id,
          viewerIsAdmin: isAdmin,
        }
      }),
    )
  },
})

export const listReportedPosts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    const user = await getUserByClerkId(ctx, identity.subject)
    if (!user || !ADMIN_ROLES.has(user.role)) return null

    const reports = await ctx.db.query('communityReports').collect()
    const postIds = [...new Set(reports.map((r) => r.postId))]

    const posts = await Promise.all(postIds.map((id) => ctx.db.get(id)))
    return posts
      .filter(Boolean)
      .map((post) => ({
        ...post,
        reportCount: reports.filter((r) => r.postId === post!._id).length,
      }))
  },
})

// ── Mutations ─────────────────────────────────────────────────────────────────

export const sendPost = mutation({
  args: {
    portalId: v.optional(v.id('portals')),
    body: v.string(),
    imageStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, { portalId, body, imageStorageId }) => {
    const user = await requireMember(ctx)

    const trimmed = body.trim()
    if (!trimmed && !imageStorageId) throw new Error('Post cannot be empty')
    if (trimmed.length > 2000) throw new Error('Post trop long (max 2000 caractères)')

    if (containsPhone(trimmed)) {
      throw new Error("Les numéros de téléphone ne sont pas autorisés dans la communauté. Utilisez la messagerie privée hors plateforme à vos risques.")
    }

    return ctx.db.insert('communityPosts', {
      portalId,
      authorId: user._id,
      body: trimmed,
      imageStorageId,
      isHidden: false,
    })
  },
})

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireMember(ctx)
    return ctx.storage.generateUploadUrl()
  },
})

export const toggleReaction = mutation({
  args: {
    postId: v.id('communityPosts'),
    emoji: v.string(),
  },
  // emoji validated to allowlist in handler
  handler: async (ctx, { postId, emoji }) => {
    const ALLOWED_EMOJI = new Set(['🔥', '❤️', '👏', '💯', '😂'])
    if (!ALLOWED_EMOJI.has(emoji)) throw new Error('Invalid emoji')

    const user = await requireMember(ctx)

    const existing = await ctx.db
      .query('communityReactions')
      .withIndex('by_post_user_emoji', (q) =>
        q.eq('postId', postId).eq('userId', user._id).eq('emoji', emoji),
      )
      .unique()

    if (existing) {
      await ctx.db.delete(existing._id)
    } else {
      await ctx.db.insert('communityReactions', { postId, userId: user._id, emoji })
    }
  },
})

export const reportPost = mutation({
  args: {
    postId: v.id('communityPosts'),
    reason: v.string(),
  },
  handler: async (ctx, { postId, reason }) => {
    if (reason.length > 500) throw new Error('Reason too long (max 500 characters)')

    const user = await requireMember(ctx)

    const already = await ctx.db
      .query('communityReports')
      .withIndex('by_post', (q) => q.eq('postId', postId))
      .filter((q) => q.eq(q.field('reportedBy'), user._id))
      .first()

    if (already) return already._id
    return ctx.db.insert('communityReports', { postId, reportedBy: user._id, reason })
  },
})

export const hidePost = mutation({
  args: { postId: v.id('communityPosts'), reason: v.optional(v.string()) },
  handler: async (ctx, { postId, reason }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    const user = await getUserByClerkId(ctx, identity.subject)
    if (!user || !ADMIN_ROLES.has(user.role)) throw new Error('Admin only')
    await ctx.db.patch(postId, { isHidden: true, hiddenReason: reason ?? 'Removed by admin' })
    await ctx.runMutation(internal.audit.write, {
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'community.hide',
      resource: 'communityPosts',
      targetId: postId,
      targetLabel: reason ?? 'hidden',
      outcome: 'success',
      severity: 'warning',
    })
  },
})

export const deletePost = mutation({
  args: { postId: v.id('communityPosts') },
  handler: async (ctx, { postId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    const user = await getUserByClerkId(ctx, identity.subject)

    const post = await ctx.db.get(postId)
    if (!post) throw new Error('Post not found')

    const isOwner = post.authorId === user?._id
    const isAdmin = user && ADMIN_ROLES.has(user.role)
    if (!isOwner && !isAdmin) throw new Error('Not allowed')

    await ctx.db.delete(postId)
  },
})
