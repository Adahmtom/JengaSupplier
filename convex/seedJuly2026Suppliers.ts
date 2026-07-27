import { internalAction, internalMutation } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { Id } from './_generated/dataModel'

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

    const slugMap = await ctx.runQuery(internal.seedBelleVendors.findPortalBySlug, {})
    const portal = (slug: string): Id<'portals'> => {
      const id = slugMap[slug]
      if (!id) throw new Error(`Portal not found: ${slug}`)
      return id as Id<'portals'>
    }

    const insert = async (portalSlug: string, title: string, body: string, phone?: string) => {
      await ctx.runMutation(internal.seedJuly2026Suppliers.insertDrop, {
        portalId: portal(portalSlug),
        authorId,
        title,
        body,
        phone,
      })
    }

    // ── Alibaba Sportswear Suppliers ─────────────────────────────────────────
    await insert(
      'tenues-sport',
      'Chengdu Lori-Source Technology Co., Ltd.',
      '🏋️ Vêtements de sport, yoga, fitness — leggings, brassières et ensembles personnalisables.\n' +
      '🔗 Alibaba : https://www.alibaba.com/source-wear-suppliers.html',
    )

    await insert(
      'tenues-sport',
      'Guangzhou Xinghuida Sportswear Co., Ltd.',
      '🏋️ Vêtements de sport, fitness, yoga — leggings, brassières et combinaisons.\n' +
      '🔗 Alibaba : https://xinghuida.m.en.alibaba.com/company_profile.html',
    )

    await insert(
      'tenues-sport',
      'Chengdu Uwell Co., Ltd.',
      '🏋️ Vêtements de sport, gym, yoga — shorts, leggings et ensembles personnalisables.\n' +
      '🌐 Site : https://www.cduwell.com',
    )

    // ── Parfums ───────────────────────────────────────────────────────────────
    await insert(
      'parfums',
      'Little Whale',
      '🐳 Parfums et accessoires.\n' +
      '📸 Catalogue Yupoo : 00123luxury.x.yupoo.com',
    )

    // ── Vêtements & Accessoires (Yupoo) ───────────────────────────────────────
    await insert(
      'vetements-femme',
      'Mook Official',
      '👗 Vêtements et accessoires.\n' +
      '📸 Catalogue Yupoo : mook-official.x.yupoo.com\n' +
      '📱 WhatsApp : +1 424 413 4858\n' +
      '💬 WeChat : Mook-official',
      '+1 424 413 4858',
    )

    await insert(
      'vetements-femme',
      'Chromie',
      '👗 Vêtements et accessoires.\n' +
      '📸 Catalogue Yupoo : chromie.x.yupoo.com',
    )

    await insert(
      'vetements-femme',
      'DragonRep',
      '👗 Vêtements et accessoires.\n' +
      '📸 Catalogue Yupoo : noghost.x.yupoo.com',
    )

    await insert(
      'vetements-femme',
      'TigerRep',
      '👗 Vêtements et accessoires.\n' +
      '📸 Catalogue Yupoo : tiger-official.x.yupoo.com',
    )

    // ── Chaussures ───────────────────────────────────────────────────────────
    await insert(
      'chaussures',
      'YOLO66',
      '👟 Chaussures et accessoires.\n' +
      '📸 Catalogue Yupoo : yolo66.x.yupoo.com\n' +
      '📱 WhatsApp : +86 150 7840 0456',
      '+86 150 7840 0456',
    )

    return 'Done — 9 new suppliers added (July 2026)'
  },
})
