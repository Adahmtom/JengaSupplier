import { internalAction, internalMutation, internalQuery } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { Id } from './_generated/dataModel'

export const findAdmin = internalQuery({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('users').withIndex('by_role', (q) => q.eq('role', 'super_admin')).first()
  },
})

export const diagnoseProd = internalAction({
  args: {},
  handler: async (ctx): Promise<Record<string, unknown>> => {
    const users: Array<{ _id: string }> = await ctx.runQuery(internal.users.listAllForSync)
    const subs: Array<{ status: string }> = await ctx.runQuery(internal.seedNewSuppliers.listAllSubs)
    const drops: Array<{ isPublished: boolean }> = await ctx.runQuery(internal.seedNewSuppliers.listAllDrops)
    const posts: Array<{ _id: string }> = await ctx.runQuery(internal.seedNewSuppliers.listAllPosts)

    const subByStatus: Record<string, number> = {}
    for (const s of subs) {
      subByStatus[s.status] = (subByStatus[s.status] ?? 0) + 1
    }

    return {
      totalUsers: users.length,
      totalSubs: subs.length,
      subsByStatus: subByStatus,
      usersWithActiveSub: subs.filter((s) => s.status === 'active' || s.status === 'trialing').length,
      totalDrops: drops.length,
      publishedDrops: drops.filter((d) => d.isPublished).length,
      totalCommunityPosts: posts.length,
    }
  },
})

export const listAllSubs = internalQuery({
  args: {},
  handler: async (ctx): Promise<Array<{ status: string }>> =>
    ctx.db.query('subscriptions').collect(),
})

export const listAllDrops = internalQuery({
  args: {},
  handler: async (ctx): Promise<Array<{ isPublished: boolean }>> =>
    ctx.db.query('drops').collect(),
})

export const listAllPosts = internalQuery({
  args: {},
  handler: async (ctx): Promise<Array<{ _id: string }>> =>
    ctx.db.query('communityPosts').collect(),
})

export const ensurePortal = internalMutation({
  args: { slug: v.string(), name: v.string(), emoji: v.string(), order: v.number() },
  handler: async (ctx, { slug, name, emoji, order }) => {
    const existing = await ctx.db.query('portals').filter((q) => q.eq(q.field('slug'), slug)).first()
    if (existing) return existing._id
    return ctx.db.insert('portals', { slug, name, emoji, order, isActive: true })
  },
})

export const insertDrop = internalMutation({
  args: {
    portalId: v.id('portals'),
    authorId: v.id('users'),
    title: v.string(),
    body: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, { portalId, authorId, title, body, phone }) => {
    const existing = await ctx.db
      .query('drops')
      .withIndex('by_published_portal', (q) => q.eq('isPublished', true).eq('portalId', portalId))
      .filter((q) => q.eq(q.field('title'), title))
      .first()
    if (existing) return existing._id
    return ctx.db.insert('drops', {
      portalId, authorId, title, body, phone,
      isPinned: false, isAlert: false, isVerified: true, isPublished: true,
    })
  },
})

export const run = internalAction({
  args: {},
  handler: async (ctx) => {
    const admin = await ctx.runQuery(internal.seedNewSuppliers.findAdmin)
    if (!admin) throw new Error('No super_admin found')
    const authorId = admin._id

    // Ensure machines portal exists
    const machinesPortalId: Id<'portals'> = await ctx.runMutation(internal.seedNewSuppliers.ensurePortal, {
      slug: 'machines',
      name: 'Machines & Équipements',
      emoji: '⚙️',
      order: 24,
    })

    // Fetch existing portals by slug
    const getPortal = async (slug: string): Promise<Id<'portals'>> => {
      const p = await ctx.runQuery(internal.seedBelleVendors.findPortalBySlug, {})
      const id = p[slug]
      if (!id) throw new Error(`Portal not found: ${slug}`)
      return id as Id<'portals'>
    }

    const slugMap = await ctx.runQuery(internal.seedBelleVendors.findPortalBySlug, {})
    const portal = (slug: string): Id<'portals'> => {
      if (slug === 'machines') return machinesPortalId
      const id = slugMap[slug]
      if (!id) throw new Error(`Portal not found: ${slug}`)
      return id as Id<'portals'>
    }

    const insert = async (portalSlug: string, title: string, body: string, phone?: string) => {
      await ctx.runMutation(internal.seedNewSuppliers.insertDrop, {
        portalId: portal(portalSlug),
        authorId,
        title,
        body,
        phone,
      })
    }

    // 🧊 Ice Machine Suppliers
    await insert('machines', 'KHAKKA Ice Machine', '🧊 Machines à glaçons', '+86 189 2505 1085')
    await insert('machines', 'Linda Khakka', '🧊 Machines à glaçons industrielles', '+86 137 6337 9291')
    await insert('machines', 'DOOHELP Ice Machine', '🧊 Machines à glaçons commerciales', '+86 134 0404 2704')
    await insert('machines', 'Soonk Packaging Machine', '📦 Machines d\'emballage pour glaçons', '+86 189 0241 3611')

    // 🔥 Charcoal Machine Suppliers
    await insert('machines', 'QH Charcoal Machine', '🔥 Machines à charbon', '+86 185 3827 1647')
    await insert('machines', 'Ling Heng Machinery', '🔥 Machines à charbon', '+86 156 3716 9509')
    await insert('machines', 'Jinxing Machinery', '🔥 Machines à charbon', '+86 187 0380 3569')

    // 🧱 Brick Machine Suppliers
    await insert('machines', 'MYBlockMachine Lucy', '🧱 Machines à briques', '+86 195 6089 0525')
    await insert('machines', 'SuperBrickMachine', '🧱 Machines à briques', '+86 186 5390 6118')

    // 🧻 Toilet Paper Machine Suppliers
    await insert('machines', 'WanDi Paper Machinery', '🧻 Machines à papier hygiénique', '+86 188 3809 7887')
    await insert('machines', 'ToiletPaperMachine', '🧻 Machines à papier hygiénique', '+86 185 0374 2792')
    await insert('machines', 'Guangdong Zhongchuang Mechanical Technology', '🧻 Machines d\'emballage pour papier hygiénique', '+86 180 2959 0215')

    // 💄 Cosmetics Suppliers
    await insert('cosmetiques', 'Fournisseur Cosmétiques 1', '💄 Fournisseur cosmétiques', '+86 159 1585 7815')
    await insert('cosmetiques', 'Fournisseur Cosmétiques 2', '💄 Fournisseur cosmétiques', '+86 136 0004 6138')
    await insert('cosmetiques', 'Fournisseur Cosmétiques 3', '💄 Fournisseur cosmétiques', '+86 134 1531 4287')
    await insert('cosmetiques', 'Fournisseur Cosmétiques 4', '💄 Fournisseur cosmétiques', '+86 186 2048 3140')
    await insert('cosmetiques', 'Fournisseur Cosmétiques 5', '💄 Fournisseur cosmétiques', '+86 133 1881 9949')

    // 📦 Packaging Suppliers
    await insert('packaging', 'Beauty Packaging Expert', '📦 Packaging cosmétique et parfums', '+86 132 5029 6105')
    await insert('packaging', 'YouLi Packaging Factory', '📦 Packaging personnalisé et impression', '+86 134 1615 8550')

    // 💄 Perfume Suppliers
    await insert('parfums', 'Dubai Perfume Supplier', '🌸 Fournisseur de parfums', '+971 58 103 1864')
    await insert('parfums', 'Linea De Bella', '🌸 Parfums et Private Label', '+971 54 575 8925')
    await insert('parfums', 'Abdul Ghani Perfume', '🌸 Grossiste en parfums', '+971 55 772 7731')

    // 📦 Liquidation Pallets
    await insert('logistique', 'Wholesale Pallets Liquidation', '📦 Palettes de liquidation', '+1 (980) 875-7672')

    // 🏠 Linen Supplier
    await insert('maison', 'Royal Linen Outlet', '🏠 Linge de maison en gros', '551-866-7555')

    // 🏭 Multi-product Supplier
    await insert('emballages', 'AAAAA Factory', '🏭 Produits divers en gros', '+86 185 5959 3963')

    return 'Done — all new suppliers added'
  },
})

export const upsertUserByEmail = internalMutation({
  args: { email: v.string(), name: v.optional(v.string()) },
  handler: async (ctx, { email, name }): Promise<string> => {
    const existing = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('email'), email))
      .first()
    if (existing) return existing._id
    return ctx.db.insert('users', {
      clerkId: `placeholder:${email}`,
      email,
      name: name ?? email.split('@')[0],
      role: 'member',
    })
  },
})

export const patchPostAuthor = internalMutation({
  args: { postId: v.id('communityPosts'), authorId: v.id('users') },
  handler: async (ctx, { postId, authorId }) => {
    await ctx.db.patch(postId, { authorId })
  },
})

export const listPostsForAdmin = internalQuery({
  args: {},
  handler: async (ctx): Promise<Array<{ _id: string; authorId: string; body: string }>> =>
    ctx.db.query('communityPosts').collect(),
})

// Re-assigns community posts from system account to their real authors.
// For dev users not yet in prod, creates a placeholder Convex user with real name/email.
export const fixPostAuthors = internalAction({
  args: {
    devPosts: v.array(v.object({
      body: v.string(),
      authorEmail: v.string(),
      authorName: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { devPosts }): Promise<Record<string, unknown>> => {
    // Get current prod Convex users
    const prodUsers: Array<{ _id: string; email: string }> = await ctx.runQuery(internal.users.listAllForSync)
    const prodUserByEmail = new Map(prodUsers.map((u) => [u.email.toLowerCase(), u._id]))

    // Get all community posts
    const allPosts: Array<{ _id: string; authorId: string; body: string }> =
      await ctx.runQuery(internal.seedNewSuppliers.listPostsForAdmin)

    // Build a map of post body → postId for quick lookup
    // (use body as key since that's all we have from dev export)
    const postsByBody = new Map<string, string>()
    for (const p of allPosts) postsByBody.set(p.body, p._id)

    let fixed = 0
    let created = 0
    let notFound = 0

    for (const devPost of devPosts) {
      const postId = postsByBody.get(devPost.body)
      if (!postId) { notFound++; continue }

      let prodUserId = prodUserByEmail.get(devPost.authorEmail.toLowerCase())

      if (!prodUserId) {
        // Create placeholder user with real name & email so post shows correct author
        const newId: string = await ctx.runMutation(internal.seedNewSuppliers.upsertUserByEmail, {
          email: devPost.authorEmail,
          name: devPost.authorName,
        })
        prodUserId = newId
        prodUserByEmail.set(devPost.authorEmail.toLowerCase(), newId)
        created++
      }

      await ctx.runMutation(internal.seedNewSuppliers.patchPostAuthor, {
        postId: postId as Id<'communityPosts'>,
        authorId: prodUserId as Id<'users'>,
      })
      fixed++
    }

    return { fixed, created, notFound }
  },
})

// Bulk-import community posts. Called from importCommunityPosts action.
export const bulkImportCommunityPosts = internalAction({
  args: {
    posts: v.array(v.object({
      body: v.string(),
      authorEmail: v.string(),
    })),
  },
  handler: async (ctx, { posts }): Promise<Record<string, unknown>> => {
    const prodUsers: Array<{ _id: string; email: string }> = await ctx.runQuery(internal.users.listAllForSync)
    const prodUserByEmail = new Map(prodUsers.map((u) => [u.email.toLowerCase(), u._id]))

    const admin = await ctx.runQuery(internal.seedNewSuppliers.findAdmin)
    if (!admin) throw new Error('No super_admin found in prod')

    let imported = 0
    let noUser = 0

    for (const post of posts) {
      const prodAuthorId = prodUserByEmail.get(post.authorEmail.toLowerCase()) ?? admin._id
      if (!prodUserByEmail.has(post.authorEmail.toLowerCase())) noUser++

      await ctx.runMutation(internal.community.importPost, {
        authorId: prodAuthorId as Id<'users'>,
        body: post.body,
        creationTime: Date.now(),
      })
      imported++
    }

    return { imported, noUser }
  },
})

// ── Export queries (for dev → prod migration) ─────────────────────────────────

export const listAllReplies = internalQuery({
  args: {},
  handler: async (ctx): Promise<Array<{ _id: string; postId: string; authorId: string; body: string }>> =>
    ctx.db.query('communityReplies').collect(),
})

export const listAllReactions = internalQuery({
  args: {},
  handler: async (ctx): Promise<Array<{ _id: string; postId: string; userId: string; emoji: string }>> =>
    ctx.db.query('communityReactions').collect(),
})

export const listAllComments = internalQuery({
  args: {},
  handler: async (ctx): Promise<Array<{ _id: string; dropId: string; userId: string; body: string }>> =>
    ctx.db.query('comments').collect(),
})

export const listAllLikes = internalQuery({
  args: {},
  handler: async (ctx): Promise<Array<{ _id: string; dropId: string; userId: string }>> =>
    ctx.db.query('likes').collect(),
})

export const listAllWaitlist = internalQuery({
  args: {},
  handler: async (ctx): Promise<Array<{ name: string; email: string; phone: string; service: string }>> =>
    ctx.db.query('waitlist').collect(),
})

export const listAllDropsFull = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query('drops').collect(),
})

// ── Import mutations ──────────────────────────────────────────────────────────

export const importReply = internalMutation({
  args: { postId: v.id('communityPosts'), authorId: v.id('users'), body: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('communityReplies')
      .withIndex('by_post', (q) => q.eq('postId', args.postId))
      .filter((q) => q.and(q.eq(q.field('authorId'), args.authorId), q.eq(q.field('body'), args.body)))
      .first()
    if (existing) return existing._id
    return ctx.db.insert('communityReplies', args)
  },
})

export const importReaction = internalMutation({
  args: { postId: v.id('communityPosts'), userId: v.id('users'), emoji: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('communityReactions')
      .withIndex('by_post_user_emoji', (q) =>
        q.eq('postId', args.postId).eq('userId', args.userId).eq('emoji', args.emoji))
      .first()
    if (existing) return existing._id
    return ctx.db.insert('communityReactions', args)
  },
})

export const importComment = internalMutation({
  args: { dropId: v.id('drops'), userId: v.id('users'), body: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('comments')
      .withIndex('by_drop', (q) => q.eq('dropId', args.dropId))
      .filter((q) => q.and(q.eq(q.field('userId'), args.userId), q.eq(q.field('body'), args.body)))
      .first()
    if (existing) return existing._id
    return ctx.db.insert('comments', args)
  },
})

export const importWaitlistEntry = internalMutation({
  args: { name: v.string(), email: v.string(), phone: v.string(), service: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('waitlist')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first()
    if (existing) return existing._id
    return ctx.db.insert('waitlist', args)
  },
})

export const importDrop = internalMutation({
  args: {
    portalSlug: v.string(),
    authorId: v.id('users'),
    title: v.string(),
    body: v.string(),
    phone: v.union(v.string(), v.null()),
    isAlert: v.boolean(),
    isPinned: v.boolean(),
    isVerified: v.boolean(),
    isPublished: v.boolean(),
  },
  handler: async (ctx, { portalSlug, authorId, title, body, phone, isAlert, isPinned, isVerified, isPublished }) => {
    const portal = await ctx.db.query('portals').filter((q) => q.eq(q.field('slug'), portalSlug)).first()
    if (!portal) throw new Error(`Portal not found: ${portalSlug}`)
    const existing = await ctx.db
      .query('drops')
      .withIndex('by_published_portal', (q) => q.eq('isPublished', isPublished).eq('portalId', portal._id))
      .filter((q) => q.eq(q.field('title'), title))
      .first()
    if (existing) return existing._id
    return ctx.db.insert('drops', { portalId: portal._id, authorId, title, body, phone: phone ?? undefined, isAlert, isPinned, isVerified, isPublished })
  },
})

export const importVideoDropWithStorageId = internalMutation({
  args: {
    portalId: v.id('portals'),
    authorId: v.id('users'),
    title: v.string(),
    body: v.string(),
    videoStorageId: v.id('_storage'),
    isAlert: v.boolean(),
    isPinned: v.boolean(),
    isVerified: v.boolean(),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('drops')
      .filter((q) => q.eq(q.field('title'), args.title))
      .first()
    if (existing) return existing._id
    const { portalId, authorId, title, body, videoStorageId, isAlert, isPinned, isVerified, isPublished } = args
    return ctx.db.insert('drops', { portalId, authorId, title, body, videoStorageId, isAlert, isPinned, isVerified, isPublished })
  },
})

export const getFirstPortal = internalQuery({
  args: {},
  handler: async (ctx): Promise<{ _id: string } | null> =>
    ctx.db.query('portals').withIndex('by_order').first(),
})

export const getVideoUrl = internalQuery({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, { storageId }): Promise<string | null> => ctx.storage.getUrl(storageId),
})

export const generateMigrationUploadUrl = internalMutation({
  args: {},
  handler: async (ctx): Promise<string> => ctx.storage.generateUploadUrl(),
})

export const setUserRole = internalMutation({
  args: { userId: v.id('users'), role: v.union(v.literal('super_admin'), v.literal('admin'), v.literal('moderator'), v.literal('member')) },
  handler: async (ctx, { userId, role }) => ctx.db.patch(userId, { role }),
})

export const moveVideoDropsToPortal = internalMutation({
  args: { portalSlug: v.string() },
  handler: async (ctx, { portalSlug }): Promise<Record<string, unknown>> => {
    // Find or create the portal
    let portal = await ctx.db.query('portals').filter(q => q.eq(q.field('slug'), portalSlug)).first()
    if (!portal) {
      const id = await ctx.db.insert('portals', {
        name: 'Vidéos Entrepôt · Warehouse Videos',
        slug: portalSlug,
        emoji: '🎥',
        order: 99,
        isActive: true,
      })
      portal = await ctx.db.get(id)
    }
    // Move all video drops to this portal
    const allDrops = await ctx.db.query('drops').collect()
    const videoDrops = allDrops.filter(d => d.videoStorageId)
    for (const drop of videoDrops) {
      await ctx.db.patch(drop._id, { portalId: portal!._id })
    }
    return { portalId: portal!._id, moved: videoDrops.length }
  },
})

// ── Full migration action — migrates replies, reactions, comments, waitlist, drops, videos ──

export const fullMigration = internalAction({
  args: {
    devDeploymentUrl: v.string(),
    // Serialised export data passed in from local script
    replies: v.array(v.object({ postBody: v.string(), authorEmail: v.string(), body: v.string() })),
    reactions: v.array(v.object({ postBody: v.string(), userEmail: v.string(), emoji: v.string() })),
    comments: v.array(v.object({ dropTitle: v.string(), userEmail: v.string(), body: v.string() })),
    waitlist: v.array(v.object({ name: v.string(), email: v.string(), phone: v.string(), service: v.string() })),
    drops: v.array(v.object({
      title: v.string(),
      body: v.string(),
      portalSlug: v.string(),
      authorEmail: v.string(),
      phone: v.union(v.string(), v.null()),
      isAlert: v.boolean(),
      isPinned: v.boolean(),
      isVerified: v.boolean(),
      isPublished: v.boolean(),
    })),
    videoDrops: v.array(v.object({
      title: v.string(),
      body: v.string(),
      authorEmail: v.string(),
      devStorageId: v.string(),
      isAlert: v.boolean(),
      isPinned: v.boolean(),
      isVerified: v.boolean(),
      isPublished: v.boolean(),
    })),
  },
  handler: async (ctx, args): Promise<Record<string, unknown>> => {
    // Build lookup maps
    const prodUsers: Array<{ _id: string; email: string }> = await ctx.runQuery(internal.users.listAllForSync)
    const byEmail = new Map(prodUsers.map((u) => [u.email.toLowerCase(), u._id]))

    const admin = await ctx.runQuery(internal.seedNewSuppliers.findAdmin)
    if (!admin) throw new Error('No super_admin')
    const adminId = admin._id as Id<'users'>

    const uid = (email: string): Id<'users'> =>
      (byEmail.get(email.toLowerCase()) ?? adminId) as Id<'users'>

    const allPosts: Array<{ _id: string; body: string }> = await ctx.runQuery(internal.seedNewSuppliers.listPostsForAdmin)
    const postByBody = new Map(allPosts.map((p) => [p.body, p._id as Id<'communityPosts'>]))

    const allDrops: Array<{ _id: string; title: string }> = await ctx.runQuery(internal.seedNewSuppliers.listAllDropsFull)
    const dropByTitle = new Map(allDrops.map((d) => [d.title, d._id as Id<'drops'>]))

    const results: Record<string, number> = {
      drops: 0, replies: 0, reactions: 0, comments: 0, waitlist: 0, videos: 0,
      dropsSkipped: 0, repliesSkipped: 0,
    }

    // 1. Drops (non-video)
    for (const d of args.drops) {
      if (dropByTitle.has(d.title)) { results.dropsSkipped++; continue }
      try {
        const newId: string = await ctx.runMutation(internal.seedNewSuppliers.importDrop, {
          portalSlug: d.portalSlug,
          authorId: uid(d.authorEmail),
          title: d.title,
          body: d.body,
          phone: d.phone,
          isAlert: d.isAlert,
          isPinned: d.isPinned,
          isVerified: d.isVerified,
          isPublished: d.isPublished,
        })
        dropByTitle.set(d.title, newId as Id<'drops'>)
        results.drops++
      } catch { results.dropsSkipped++ }
    }

    // 2. Video drops — download from dev, re-upload to prod
    const firstPortal: { _id: string } | null = await ctx.runQuery(internal.seedNewSuppliers.getFirstPortal)
    for (const v of args.videoDrops) {
      try {
        const srcUrl = `${args.devDeploymentUrl}/api/storage/${v.devStorageId}`
        const res = await fetch(srcUrl)
        if (!res.ok) continue
        const blob = await res.blob()
        const uploadUrl: string = await ctx.runMutation(internal.seedNewSuppliers.generateMigrationUploadUrl)
        const upRes = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob })
        const { storageId } = await upRes.json() as { storageId: string }
        await ctx.runMutation(internal.seedNewSuppliers.importVideoDropWithStorageId, {
          portalId: (firstPortal?._id ?? '') as Id<'portals'>,
          authorId: uid(v.authorEmail),
          title: v.title,
          body: v.body,
          videoStorageId: storageId as Id<'_storage'>,
          isAlert: v.isAlert,
          isPinned: v.isPinned ?? false,
          isVerified: v.isVerified,
          isPublished: v.isPublished,
        })
        results.videos++
      } catch { /* skip failed video */ }
    }

    // 3. Replies
    for (const r of args.replies) {
      const postId = postByBody.get(r.postBody)
      if (!postId) { results.repliesSkipped++; continue }
      await ctx.runMutation(internal.seedNewSuppliers.importReply, {
        postId, authorId: uid(r.authorEmail), body: r.body,
      })
      results.replies++
    }

    // 4. Reactions
    for (const r of args.reactions) {
      const postId = postByBody.get(r.postBody)
      if (!postId) continue
      await ctx.runMutation(internal.seedNewSuppliers.importReaction, {
        postId, userId: uid(r.userEmail), emoji: r.emoji,
      })
      results.reactions++
    }

    // 5. Drop comments
    for (const c of args.comments) {
      const dropId = dropByTitle.get(c.dropTitle)
      if (!dropId) continue
      await ctx.runMutation(internal.seedNewSuppliers.importComment, {
        dropId, userId: uid(c.userEmail), body: c.body,
      })
      results.comments++
    }

    // 6. Waitlist
    for (const w of args.waitlist) {
      await ctx.runMutation(internal.seedNewSuppliers.importWaitlistEntry, w)
      results.waitlist++
    }

    return results
  },
})
