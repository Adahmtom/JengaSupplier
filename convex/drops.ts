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

    const all = await ctx.db
      .query('drops')
      .filter((q) => q.eq(q.field('isPublished'), true))
      .collect()

    let filtered = all
    if (portalId) filtered = filtered.filter((d) => d.portalId === portalId)
    if (alertsOnly) filtered = filtered.filter((d) => d.isAlert)

    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return b._creationTime - a._creationTime
    })

    return Promise.all(
      filtered.map(async (drop) => {
        const [likeCount, userLike, commentCount, imageUrl] = await Promise.all([
          ctx.db.query('likes').withIndex('by_drop', (q) => q.eq('dropId', drop._id)).collect().then((l) => l.length),
          ctx.db.query('likes').withIndex('by_drop_user', (q) => q.eq('dropId', drop._id).eq('userId', user._id)).unique(),
          ctx.db.query('comments').withIndex('by_drop', (q) => q.eq('dropId', drop._id)).collect().then((c) => c.length),
          drop.imageStorageId ? ctx.storage.getUrl(drop.imageStorageId) : null,
        ])
        return { ...drop, likeCount, isLiked: !!userLike, commentCount, imageUrl }
      }),
    )
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

    const [likes, userLike, comments, imageUrl] = await Promise.all([
      ctx.db.query('likes').withIndex('by_drop', (q) => q.eq('dropId', dropId)).collect(),
      ctx.db.query('likes').withIndex('by_drop_user', (q) => q.eq('dropId', dropId).eq('userId', user._id)).unique(),
      ctx.db.query('comments').withIndex('by_drop', (q) => q.eq('dropId', dropId)).collect(),
      drop.imageStorageId ? ctx.storage.getUrl(drop.imageStorageId) : null,
    ])

    const commentsWithUsers = await Promise.all(
      comments.map(async (c) => {
        const author = await ctx.db.get(c.userId)
        return { ...c, author: { name: author?.name, imageUrl: author?.imageUrl } }
      }),
    )

    return { ...drop, likeCount: likes.length, isLiked: !!userLike, comments: commentsWithUsers, imageUrl }
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
    return Promise.all(
      drops.map(async (drop) => {
        const [likeCount, commentCount, imageUrl] = await Promise.all([
          ctx.db.query('likes').withIndex('by_drop', (q) => q.eq('dropId', drop._id)).collect().then((l) => l.length),
          ctx.db.query('comments').withIndex('by_drop', (q) => q.eq('dropId', drop._id)).collect().then((c) => c.length),
          drop.imageStorageId ? ctx.storage.getUrl(drop.imageStorageId) : null,
        ])
        return { ...drop, likeCount, commentCount, imageUrl }
      }),
    )
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
