import { mutation, query } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { requirePermission, requireSubscription, softPermission, getUserByClerkId, getActiveSubscription } from './_helpers'
import { ADMIN_ROLES } from './lib/permissions'

export const listDrops = query({
  args: {
    portalId: v.optional(v.id('portals')),
    alertsOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, { portalId, alertsOnly }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await getUserByClerkId(ctx, identity.subject)
    if (!user) return null

    if (!ADMIN_ROLES.has(user.role)) {
      const sub = await getActiveSubscription(ctx, user._id)
      if (!sub) return null
    }

    // Use compound indexes to avoid full table scans
    let filtered
    if (alertsOnly) {
      filtered = await ctx.db
        .query('drops')
        .withIndex('by_published_alert', (q) => q.eq('isPublished', true).eq('isAlert', true))
        .collect()
    } else if (portalId) {
      filtered = await ctx.db
        .query('drops')
        .withIndex('by_published_portal', (q) => q.eq('isPublished', true).eq('portalId', portalId))
        .collect()
    } else {
      filtered = await ctx.db
        .query('drops')
        .withIndex('by_published', (q) => q.eq('isPublished', true))
        .collect()
    }

    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return b._creationTime - a._creationTime
    })

    if (filtered.length === 0) return []

    // Fetch likes and comments per drop using indexes — no full table scans
    const dropIds = new Set(filtered.map((d) => d._id))

    const [allLikes, allComments, imageUrls, videoUrls] = await Promise.all([
      Promise.all(
        filtered.map((d) =>
          ctx.db.query('likes').withIndex('by_drop', (q) => q.eq('dropId', d._id)).collect()
        )
      ).then((groups) => groups.flat()),
      Promise.all(
        filtered.map((d) =>
          ctx.db.query('comments').withIndex('by_drop', (q) => q.eq('dropId', d._id)).collect()
        )
      ).then((groups) => groups.flat()),
      Promise.all(
        filtered.map((d) => d.imageStorageId ? ctx.storage.getUrl(d.imageStorageId) : Promise.resolve(null))
      ),
      Promise.all(
        filtered.map((d) => d.videoStorageId ? ctx.storage.getUrl(d.videoStorageId) : Promise.resolve(null))
      ),
    ])

    const likesByDrop = new Map<string, number>()
    const likedByUser = new Set<string>()
    for (const like of allLikes) {
      likesByDrop.set(like.dropId, (likesByDrop.get(like.dropId) ?? 0) + 1)
      if (like.userId === user._id) likedByUser.add(like.dropId)
    }

    const commentsByDrop = new Map<string, number>()
    for (const comment of allComments) {
      commentsByDrop.set(comment.dropId, (commentsByDrop.get(comment.dropId) ?? 0) + 1)
    }

    return filtered.map((drop, i) => ({
      ...drop,
      likeCount: likesByDrop.get(drop._id) ?? 0,
      isLiked: likedByUser.has(drop._id),
      commentCount: commentsByDrop.get(drop._id) ?? 0,
      imageUrl: imageUrls[i],
      videoUrl: videoUrls[i],
    }))
  },
})

export const listDropsPreview = query({
  args: {},
  handler: async (ctx) => {
    const drops = await ctx.db
      .query('drops')
      .filter((q) => q.eq(q.field('isPublished'), true))
      .order('desc')
      .take(3)
    return drops.map((d) => ({ _id: d._id, title: d.title, isAlert: d.isAlert }))
  },
})

export const getDrop = query({
  args: { dropId: v.id('drops') },
  handler: async (ctx, { dropId }) => {
    const { user } = await requireSubscription(ctx)
    const drop = await ctx.db.get(dropId)
    if (!drop || !drop.isPublished) return null

    const [likes, userLike, comments, imageUrl, videoUrl] = await Promise.all([
      ctx.db.query('likes').withIndex('by_drop', (q) => q.eq('dropId', dropId)).collect(),
      ctx.db.query('likes').withIndex('by_drop_user', (q) => q.eq('dropId', dropId).eq('userId', user._id)).unique(),
      ctx.db.query('comments').withIndex('by_drop', (q) => q.eq('dropId', dropId)).collect(),
      drop.imageStorageId ? ctx.storage.getUrl(drop.imageStorageId) : null,
      drop.videoStorageId ? ctx.storage.getUrl(drop.videoStorageId) : null,
    ])

    // Batch author lookups — deduplicate user IDs first
    const authorIds = [...new Set(comments.map((c) => c.userId))]
    const authors = await Promise.all(authorIds.map((id) => ctx.db.get(id)))
    const authorMap = new Map(authorIds.map((id, i) => [id, authors[i]]))

    const commentsWithUsers = comments.map((c) => {
      const author = authorMap.get(c.userId)
      return { ...c, author: { name: author?.name, imageUrl: author?.imageUrl } }
    })

    return { ...drop, likeCount: likes.length, isLiked: !!userLike, comments: commentsWithUsers, imageUrl, videoUrl }
  },
})

export const createDrop = mutation({
  args: {
    portalId: v.id('portals'),
    title: v.string(),
    body: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    imageStorageId: v.optional(v.id('_storage')),
    videoStorageId: v.optional(v.id('_storage')),
    isPinned: v.optional(v.boolean()),
    isAlert: v.optional(v.boolean()),
    isVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, 'drops', 'create')

    const dropId = await ctx.db.insert('drops', {
      ...args,
      authorId: actor._id,
      isPinned: args.isPinned ?? false,
      isAlert: args.isAlert ?? false,
      isVerified: args.isVerified ?? false,
      isPublished: true,
    })

    await ctx.runMutation(internal.audit.write, {
      actorId: actor._id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'drops.create',
      resource: 'drops',
      targetId: dropId,
      targetLabel: args.title,
      outcome: 'success',
      severity: 'info',
    })

    return dropId
  },
})

export const bulkCreateDrops = mutation({
  args: {
    portalId: v.id('portals'),
    rows: v.array(v.object({
      title: v.string(),
      body: v.string(),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      isVerified: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, { portalId, rows }) => {
    const actor = await requirePermission(ctx, 'drops', 'create')
    const ids: string[] = []
    for (const row of rows) {
      const id = await ctx.db.insert('drops', {
        portalId,
        title: row.title,
        body: row.body,
        phone: row.phone,
        email: row.email,
        authorId: actor._id,
        isPinned: false,
        isAlert: false,
        isVerified: row.isVerified ?? false,
        isPublished: true,
      })
      ids.push(id)
    }
    await ctx.runMutation(internal.audit.write, {
      actorId: actor._id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'drops.bulk_create',
      resource: 'drops',
      targetId: ids[0] ?? '',
      targetLabel: `Bulk import: ${ids.length} vendors`,
      outcome: 'success',
      severity: 'info',
    })
    return ids
  },
})

export const updateDrop = mutation({
  args: {
    dropId: v.id('drops'),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    isPinned: v.optional(v.boolean()),
    isAlert: v.optional(v.boolean()),
    isPublished: v.optional(v.boolean()),
    isVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, { dropId, ...updates }) => {
    const actor = await requirePermission(ctx, 'drops', 'update')
    await ctx.db.patch(dropId, updates)

    await ctx.runMutation(internal.audit.write, {
      actorId: actor._id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'drops.update',
      resource: 'drops',
      targetId: dropId,
      outcome: 'success',
      severity: 'info',
      metadata: updates,
    })
  },
})

export const deleteDrop = mutation({
  args: { dropId: v.id('drops') },
  handler: async (ctx, { dropId }) => {
    const actor = await requirePermission(ctx, 'drops', 'delete')
    const drop = await ctx.db.get(dropId)
    await ctx.db.delete(dropId)

    await ctx.runMutation(internal.audit.write, {
      actorId: actor._id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'drops.delete',
      resource: 'drops',
      targetId: dropId,
      targetLabel: drop?.title,
      outcome: 'success',
      severity: 'warning',
    })
  },
})

export const listAllDropsAdmin = query({
  args: {},
  handler: async (ctx) => {
    const user = await softPermission(ctx, 'drops', 'read')
    if (!user) return null

    const drops = await ctx.db.query('drops').order('desc').collect()

    // Batch all likes and comments in 2 queries total, not N*2
    const [allLikes, allComments] = await Promise.all([
      ctx.db.query('likes').collect(),
      ctx.db.query('comments').collect(),
    ])

    const likesByDrop = new Map<string, number>()
    for (const l of allLikes) likesByDrop.set(l.dropId, (likesByDrop.get(l.dropId) ?? 0) + 1)

    const commentsByDrop = new Map<string, number>()
    for (const c of allComments) commentsByDrop.set(c.dropId, (commentsByDrop.get(c.dropId) ?? 0) + 1)

    const imageUrls = await Promise.all(
      drops.map((d) => d.imageStorageId ? ctx.storage.getUrl(d.imageStorageId) : Promise.resolve(null))
    )

    return drops.map((drop, i) => ({
      ...drop,
      likeCount: likesByDrop.get(drop._id) ?? 0,
      commentCount: commentsByDrop.get(drop._id) ?? 0,
      imageUrl: imageUrls[i],
    }))
  },
})

export const toggleLike = mutation({
  args: { dropId: v.id('drops') },
  handler: async (ctx, { dropId }) => {
    const { user } = await requireSubscription(ctx)

    const existing = await ctx.db
      .query('likes')
      .withIndex('by_drop_user', (q) => q.eq('dropId', dropId).eq('userId', user._id))
      .unique()

    if (existing) {
      await ctx.db.delete(existing._id)
    } else {
      await ctx.db.insert('likes', { dropId, userId: user._id })
    }
  },
})

export const addComment = mutation({
  args: { dropId: v.id('drops'), body: v.string() },
  handler: async (ctx, { dropId, body }) => {
    const { user } = await requireSubscription(ctx)
    if (!body.trim()) throw new Error('Comment cannot be empty')
    return ctx.db.insert('comments', { dropId, userId: user._id, body: body.trim() })
  },
})

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, 'drops', 'create')
    return ctx.storage.generateUploadUrl()
  },
})
