import { internalAction, internalMutation } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { Id } from './_generated/dataModel'

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
    const authorId = admin._id as Id<'users'>

    // Ensure the smartphones portal exists
    const portalId: Id<'portals'> = await ctx.runMutation(internal.seedAug2026Phones.ensurePortal, {
      slug: 'smartphones',
      name: 'Smartphones & iPhone en gros · Wholesale Phones',
      emoji: '📲',
      order: 26,
    })

    const insert = async (title: string, body: string, phone?: string) => {
      await ctx.runMutation(internal.seedAug2026Phones.insertDrop, {
        portalId,
        authorId,
        title,
        body,
        phone,
      })
    }

    await insert(
      'YA-Phones',
      '📲 iPhone et téléphones en gros — Chine.\n' +
      '💬 WhatsApp : +86 183 2085 6767\n' +
      '💬 WeChat : Leia7413\n' +
      '🏷️ Type : Grossiste / fournisseur de téléphones',
      '+86 183 2085 6767',
    )

    await insert(
      'Willian — Wholesale Phones',
      '📲 iPhone et smartphones en gros — Chine.\n' +
      '💬 WhatsApp : +86 137 6071 5658\n' +
      '💬 WeChat : SCCKKC\n' +
      '📦 MOQ : 30 pièces\n' +
      '🏷️ Vente en gros uniquement',
      '+86 137 6071 5658',
    )

    await insert(
      'CK Mobile Shop China',
      '📲 iPhone, Samsung et smartphones en gros.\n' +
      '📍 Guangzhou, Chine\n' +
      '💬 WhatsApp : +86 150 9998 8960\n' +
      '🏅 Plus de 15 ans d\'expérience\n' +
      '🏷️ Type : Grossiste en téléphones',
      '+86 150 9998 8960',
    )

    return 'Done — 3 phone suppliers added to smartphones portal (Aug 2026)'
  },
})
