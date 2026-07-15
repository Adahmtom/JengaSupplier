import { internalAction, internalMutation, internalQuery } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'

export const findPortalBySlug = internalQuery({
  args: {},
  handler: async (ctx) => {
    const portals = await ctx.db.query('portals').collect()
    const map: Record<string, string> = {}
    for (const p of portals) map[p.slug] = p._id
    return map
  },
})

export const findOrCreateSystemUser = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('users').first()
    if (existing) return existing._id
    return ctx.db.insert('users', {
      clerkId: 'system',
      email: 'system@jengasuppliers.com',
      name: 'System',
      role: 'super_admin',
    })
  },
})

export const insertVendor = internalMutation({
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
      .withIndex('by_portal', (q) => q.eq('portalId', portalId))
      .filter((q) => q.eq(q.field('title'), title))
      .first()
    if (existing) return existing._id
    return ctx.db.insert('drops', {
      portalId,
      authorId,
      title,
      body,
      phone,
      isPinned: false,
      isAlert: false,
      isVerified: true,
      isPublished: true,
    })
  },
})

export const run = internalAction({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.portals.seedPortalsInternal)
    const portals = await ctx.runQuery(internal.seedBelleVendors.findPortalBySlug)
    const authorId = await ctx.runMutation(internal.seedBelleVendors.findOrCreateSystemUser)

    const vendors: { slug: string; title: string; body: string; phone?: string }[] = [
      // ── Perruques & Extensions ─────────────────────────────────────────
      { slug: 'perruques', title: 'Mei Qi Hair',                  body: 'Perruques & extensions — Chine.',                                    phone: '+86 135 6997 8661' },
      { slug: 'perruques', title: 'Crown Hair',                    body: 'Perruques & extensions — Chine.',                                    phone: '+86 138 7791 0295' },
      { slug: 'perruques', title: 'Amy Hair',                      body: 'Perruques & extensions — Chine.',                                    phone: '+86 158 9008 6664' },
      { slug: 'perruques', title: 'A+ Hair Company (Alice Hair)',  body: 'Perruques & extensions — Chine.',                                    phone: '+86 134 2883 5100' },
      { slug: 'perruques', title: 'Jen Hair Vietnam',              body: 'Fournisseur de perruques — Vietnam.',                                phone: '+84 9629 41066'    },
      { slug: 'perruques', title: 'Sri Kumaran Hairs',             body: 'Fournisseur de perruques — Inde.',                                   phone: '+91 86109 03015'   },
      { slug: 'perruques', title: 'K Hair Vietnam',                body: 'Fournisseur de perruques — Vietnam. Site : khairvn.com',             phone: '+84 92 633 2545'   },
      { slug: 'perruques', title: 'Indian Original Hair',          body: 'Fournisseur de perruques cheveux naturels — Inde.'                                              },
      { slug: 'perruques', title: 'Flowy Wig Factory',             body: 'Usine de perruques.'                                                                            },
      { slug: 'perruques', title: 'Okhiria',                       body: 'Fournisseur de perruques — Nigeria.',                                phone: '+234 906 691 1448' },
      // ── Tenues de Sport ────────────────────────────────────────────────
      { slug: 'tenues-sport', title: 'JSQP Yoga Clothes',         body: 'Vêtements de sport et yoga — Chine.',                               phone: '+86 180 5421 5953' },
      // ── Vêtements ─────────────────────────────────────────────────────
      { slug: 'vetements-femme', title: 'Shangku Clothing',        body: 'Fournisseur de vêtements — Chine.',                                  phone: '+86 173 0769 1539' },
      { slug: 'vetements-femme', title: 'HS Fashion',              body: 'Fournisseur de vêtements — Chine. Site : hsfashion.cn'                                         },
      { slug: 'vetements-femme', title: 'Lucy Paris Label',        body: 'Vêtements grossiste — Paris. Site : lucyparis.com/pages/wholesale'                             },
      // ── Accessoires Téléphone ──────────────────────────────────────────
      { slug: 'telephone',      title: 'JieSenTe Phone Case Factory', body: 'Usine de coques téléphone — Chine.',                             phone: '+86 183 9056 3783' },
      // ── Emballages ─────────────────────────────────────────────────────
      { slug: 'emballages',     title: 'Keyuan Plastic Bottle Supplier', body: "Emballages cosmétiques (flacons plastique) — Chine.",          phone: '+86 181 2798 9966' },
      // ── Général (Santé) ────────────────────────────────────────────────
      { slug: 'general',        title: 'Qianyi Health',            body: 'Santé & médecine traditionnelle — Chine.',                           phone: '+86 193 5697 8475' },
      // ── Cosmétiques ────────────────────────────────────────────────────
      { slug: 'cosmetiques',    title: 'Auraline Beauty',          body: 'Fournisseur de cosmétiques. Site : auralinebeauty.com'                                         },
      // ── Parfums ────────────────────────────────────────────────────────
      { slug: 'parfums',        title: 'Shenzhen Lanke Chanson Tech', body: 'Fournisseur de parfums — Chine. Alibaba : lancoperfume.en.alibaba.com'                      },
    ]

    let created = 0
    for (const v of vendors) {
      const portalId = portals[v.slug]
      if (!portalId) { console.warn(`No portal for slug: ${v.slug}`); continue }
      await ctx.runMutation(internal.seedBelleVendors.insertVendor, {
        portalId: portalId as any,
        authorId: authorId as any,
        title: v.title,
        body: v.body,
        phone: v.phone,
      })
      created++
    }

    return `Created ${created} vendors`
  },
})
