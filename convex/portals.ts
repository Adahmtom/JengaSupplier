import { internalQuery, mutation, query } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { requireAuth, requirePermission, softPermission } from './_helpers'

export const listAllInternal = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query('portals').collect(),
})

export const listPortals = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    return ctx.db
      .query('portals')
      .withIndex('by_order')
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect()
  },
})

export const getPortalBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    return ctx.db
      .query('portals')
      .filter((q) => q.eq(q.field('slug'), slug))
      .first()
  },
})

export const listPortalsAdmin = query({
  args: {},
  handler: async (ctx) => {
    const user = await softPermission(ctx, 'portals', 'read')
    if (!user) return null
    return ctx.db.query('portals').withIndex('by_order').collect()
  },
})

export const createPortal = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    emoji: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, 'portals', 'create')
    const id = await ctx.db.insert('portals', { ...args, isActive: true })

    await ctx.runMutation(internal.audit.write, {
      actorId: actor._id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'portals.create',
      resource: 'portals',
      targetId: id,
      targetLabel: args.name,
      outcome: 'success',
      severity: 'info',
    })

    return id
  },
})

export const updatePortal = mutation({
  args: {
    portalId: v.id('portals'),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { portalId, ...updates }) => {
    const actor = await requirePermission(ctx, 'portals', 'update')
    await ctx.db.patch(portalId, updates)

    await ctx.runMutation(internal.audit.write, {
      actorId: actor._id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'portals.update',
      resource: 'portals',
      targetId: portalId,
      outcome: 'success',
      severity: 'info',
      metadata: updates,
    })
  },
})

export const deletePortal = mutation({
  args: { portalId: v.id('portals') },
  handler: async (ctx, { portalId }) => {
    const actor = await requirePermission(ctx, 'portals', 'delete')
    const portal = await ctx.db.get(portalId)
    await ctx.db.delete(portalId)

    await ctx.runMutation(internal.audit.write, {
      actorId: actor._id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'portals.delete',
      resource: 'portals',
      targetId: portalId,
      targetLabel: portal?.name,
      outcome: 'success',
      severity: 'critical',
    })
  },
})

const CATEGORY_LIST = [
  { name: 'Perruques · Wigs',                       slug: 'perruques',        emoji: '💇', order: 1  },
  { name: 'Produits Capillaires · Hair Products',   slug: 'capillaires',      emoji: '🧴', order: 2  },
  { name: 'Vêtements Femme · Women Clothing',       slug: 'vetements-femme',  emoji: '👗', order: 3  },
  { name: 'Vêtements Homme · Men Clothing',         slug: 'vetements-homme',  emoji: '👔', order: 4  },
  { name: 'Vêtements Enfant · Kids Clothing',       slug: 'vetements-enfant', emoji: '🧒', order: 5  },
  { name: 'Chaussures · Shoes',                     slug: 'chaussures',       emoji: '👠', order: 6  },
  { name: 'Sacs à main · Handbags',                 slug: 'sacs',             emoji: '👜', order: 7  },
  { name: 'Bijoux · Jewellery',                     slug: 'bijoux',           emoji: '💎', order: 8  },
  { name: 'Mini Parfums · Mini Perfumes',            slug: 'parfums',          emoji: '🌸', order: 9  },
  { name: 'Ongles et Machine · Nails & Machine',    slug: 'ongles-machine',   emoji: '💅', order: 10 },
  { name: 'Cosmétiques · Cosmetics',                slug: 'cosmetiques',      emoji: '💄', order: 11 },
  { name: 'Emballages · Packaging',                 slug: 'emballages',       emoji: '📦', order: 12 },
  { name: 'Accessoires Maison · Home Accessories',  slug: 'maison',           emoji: '🏠', order: 13 },
  { name: 'Accessoires Cuisine · Kitchen',          slug: 'cuisine',          emoji: '🍳', order: 14 },
  { name: 'Accessoires Bébé · Baby',                slug: 'bebe',             emoji: '🍼', order: 15 },
  { name: 'Accessoires Téléphone · Phone Accessories', slug: 'telephone',     emoji: '📱', order: 16 },
  { name: 'Sport & Fitness',                        slug: 'sport-fitness',    emoji: '🏋️', order: 17 },
  { name: 'Produits Animaux · Pet Products',        slug: 'animaux',          emoji: '🐾', order: 18 },
  { name: 'Tenues de Sport · Sportswear',           slug: 'tenues-sport',     emoji: '👟', order: 19 },
  { name: 'Électronique · Electronics',             slug: 'electronique',     emoji: '🔌', order: 20 },
  { name: 'Décoration · Home Decor',                slug: 'decoration',       emoji: '🪴', order: 21 },
  { name: 'Lingerie',                               slug: 'lingerie',         emoji: '🩱', order: 22 },
  { name: 'Transitaires & Logistique · Freight',    slug: 'logistique',       emoji: '🚢', order: 23 },
  { name: 'Packaging · Emballage',                  slug: 'packaging',        emoji: '🎁', order: 24 },
  { name: 'Général · General',                      slug: 'general',          emoji: '🗂️', order: 25 },
]

export const seedPortals = mutation({
  args: {},
  handler: async (ctx) => {
    const actor = await requirePermission(ctx, 'portals', 'manage')

    const existing = await ctx.db.query('portals').collect()
    if (existing.length > 0) return 'already seeded'

    for (const portal of CATEGORY_LIST) {
      await ctx.db.insert('portals', { ...portal, isActive: true })
    }

    await ctx.runMutation(internal.audit.write, {
      actorId: actor._id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'portals.seed',
      resource: 'portals',
      outcome: 'success',
      severity: 'info',
      metadata: { count: CATEGORY_LIST.length },
    })

    return `seeded ${CATEGORY_LIST.length} categories`
  },
})

export const reseedPortals = mutation({
  args: {},
  handler: async (ctx) => {
    const actor = await requirePermission(ctx, 'portals', 'manage')

    const existing = await ctx.db.query('portals').collect()
    for (const p of existing) await ctx.db.delete(p._id)

    for (const portal of CATEGORY_LIST) {
      await ctx.db.insert('portals', { ...portal, isActive: true })
    }

    await ctx.runMutation(internal.audit.write, {
      actorId: actor._id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'portals.reseed',
      resource: 'portals',
      outcome: 'success',
      severity: 'warning',
      metadata: { count: CATEGORY_LIST.length },
    })

    return `reseeded ${CATEGORY_LIST.length} categories`
  },
})
