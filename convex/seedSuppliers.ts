import { internalAction, internalMutation, internalQuery } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { Id } from './_generated/dataModel'

export const findAdmin = internalQuery({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query('users')
      .withIndex('by_role', (q) => q.eq('role', 'super_admin'))
      .first()
  },
})

// Internal helper — insert a drop if one with the same title+portalId doesn't exist yet
export const insertDrop = internalMutation({
  args: {
    portalId: v.id('portals'),
    authorId: v.id('users'),
    title: v.string(),
    body: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, { portalId, authorId, title, body, phone, email }) => {
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
      email,
      isPinned: false,
      isAlert: false,
      isVerified: true,
      isPublished: true,
    })
  },
})

// Run from Convex dashboard: Functions → seedSuppliers → seedVerifiedSuppliers → Run (no args needed)
export const seedVerifiedSuppliers = internalAction({
  args: {},
  handler: async (ctx) => {
    // Use the first super_admin as author
    const admin = await ctx.runQuery(internal.seedSuppliers.findAdmin)
    if (!admin) throw new Error('No super_admin found — make sure your role is set to super_admin first')
    const authorId = admin._id

    // Fetch all portals and build a slug → id map
    const portals: Array<{ _id: Id<'portals'>; slug: string }> = await ctx.runQuery(
      internal.portals.listAllInternal,
    )
    const bySlug = new Map(portals.map((p) => [p.slug, p._id]))

    const get = (slug: string): Id<'portals'> => {
      const id = bySlug.get(slug)
      if (!id) throw new Error(`Portal slug not found: ${slug}`)
      return id
    }

    type DropSeed = {
      portalId: Id<'portals'>
      title: string
      body: string
      phone?: string
      email?: string
    }

    const drops: DropSeed[] = [
      // ── Mini Parfums ──────────────────────────────────────────────────────────
      {
        portalId: get('parfums'),
        title: 'Fournisseur Mini Perfum',
        body: '🏷️ Mini parfums, coffrets cadeaux, parfums inspirés de grandes marques (gros & détail).\n🌐 Catalogue : https://miniperfume.click/',
        phone: '+86 178 1983 1732',
      },
      {
        portalId: get('parfums'),
        title: 'Perfume Wholesale',
        body: '🏷️ Mini parfums, parfums de marques, vente en gros, expédition internationale.\n🌐 Catalogue : https://linktr.ee/luxedison',
        phone: '+86 133 9266 4928',
      },
      {
        portalId: get('parfums'),
        title: 'Unique Aroma',
        body: '🏷️ Huiles de parfum, matières premières, OEM / Private Label, fabrication de parfums.',
        phone: '+86 138 2440 9121',
      },
      {
        portalId: get('parfums'),
        title: 'Joy in Guangzhou – Mini Parfums',
        body: '🏷️ Mini parfums.',
        phone: '+86 166 2000 9267',
      },

      // ── Perruques ─────────────────────────────────────────────────────────────
      {
        portalId: get('perruques'),
        title: 'Vietnam Hair Factory',
        body: '🏷️ Perruques, cheveux naturels, extensions, fabrication en usine.\n☎️ Téléphone : +86 173 1682 6172',
        phone: '+86 135 2770 6982',
      },
      {
        portalId: get('perruques'),
        title: 'Mei Fa Ru Zhen',
        body: '🏷️ Perruques, cheveux humains, usine de fabrication.',
        phone: '+86 132 0253 6728',
      },
      {
        portalId: get('perruques'),
        title: 'Hair Factory (Tony)',
        body: '🏷️ Perruques, extensions, cheveux humains, vente en gros.\n☎️ Téléphone : +86 181 0274 2737',
        phone: '+86 135 6040 4890',
      },
      {
        portalId: get('perruques'),
        title: 'Berry Hair',
        body: '🏷️ Perruques, cheveux vierges, extensions.',
        phone: '+86 138 3749 3099',
      },
      {
        portalId: get('perruques'),
        title: 'Lucia Hair',
        body: '🏷️ Cheveux 100 % Virgin Hair, Remy Hair, perruques et extensions.',
        phone: '+86 159 9367 3886',
      },
      {
        portalId: get('perruques'),
        title: 'Xuchang Tian Cheng Hair',
        body: '🏷️ Fabricant de perruques, cheveux humains, extensions.',
        phone: '+86 185 2924 2942',
      },
      {
        portalId: get('perruques'),
        title: 'Bo Rui Hair',
        body: '🏷️ Perruques, lace wigs, cheveux humains.',
        phone: '+86 158 3657 2692',
      },
      {
        portalId: get('perruques'),
        title: 'Iris Hair',
        body: '🏷️ Perruques, extensions, accessoires capillaires.',
        phone: '+86 191 2007 8378',
      },
      {
        portalId: get('perruques'),
        title: 'A+ Hair',
        body: '🏷️ Perruques, cheveux humains, vente en gros.\n📱 WhatsApp 2 : +86 152 9099 8339',
        phone: '+86 134 2883 5100',
      },
      {
        portalId: get('perruques'),
        title: 'Zehur – King of Dreadlocks',
        body: '🏷️ Dreadlocks, faux locks, extensions, cheveux synthétiques et naturels.',
        phone: '+86 151 9594 8626',
        email: '191247331@qq.com',
      },

      // ── Bijoux ────────────────────────────────────────────────────────────────
      {
        portalId: get('bijoux'),
        title: 'Lady H',
        body: '🏷️ Bijoux fantaisie, accessoires de mode, vente en gros.',
        phone: '+86 159 1403 0982',
      },
      {
        portalId: get('bijoux'),
        title: 'Cindy – Guoda Leather City',
        body: '🏷️ Bijoux, sacs à main, maroquinerie et accessoires de mode.\n☎️ Téléphone : +86 136 2021 0698',
        phone: '+86 150 1516 5464',
      },
      {
        portalId: get('bijoux'),
        title: 'Fuqi Family',
        body: '🏷️ Bijoux fantaisie, accessoires de mode et maroquinerie.',
        phone: '+86 138 2225 3849',
      },
      {
        portalId: get('bijoux'),
        title: 'Kelly Fashion – Bijoux',
        body: '🏷️ Bijoux fantaisie, vêtements femme, accessoires de mode.',
        phone: '+86 188 1437 1809',
      },
      {
        portalId: get('bijoux'),
        title: 'Recoco Fashion (Coco)',
        body: '🏷️ Bijoux fantaisie, accessoires de mode, vente en gros.\n📱 Mobile 2 : +86 137 1113 0858',
        phone: '+86 137 1161 2922',
      },
      {
        portalId: get('bijoux'),
        title: 'Joy in Guangzhou – Bijoux',
        body: '🏷️ Bijoux, mini parfums, vêtements et personal shopping.',
        phone: '+86 166 2000 9267',
      },
      {
        portalId: get('bijoux'),
        title: 'Yana Clothing – Bijoux',
        body: '🏷️ Bijoux fantaisie, vêtements pour femmes, accessoires.\n📱 WhatsApp 2 : +86 137 2510 5121',
        phone: '+86 137 2985 0401',
      },
      {
        portalId: get('bijoux'),
        title: 'CC Fashion (Amy)',
        body: '🏷️ Bijoux fantaisie, accessoires de mode et vêtements.',
        phone: '+86 134 1433 5616',
      },

      // ── Vêtements Enfant ──────────────────────────────────────────────────────
      {
        portalId: get('vetements-enfant'),
        title: 'OUSAIMA Baby',
        body: '🏷️ Vêtements pour bébés, vêtements pour enfants, ensembles, accessoires bébé.',
        phone: '+86 158 7651 1597',
      },
      {
        portalId: get('vetements-enfant'),
        title: 'Meng Ku Er Children\'s Clothing',
        body: '🏷️ Vêtements pour enfants, mode bébé, tenues garçons et filles.',
        phone: '+86 136 0270 0682',
      },

      // ── Vêtements Femme ───────────────────────────────────────────────────────
      {
        portalId: get('vetements-femme'),
        title: 'Kelly Fashion',
        body: '🏷️ Robes, ensembles, vêtements tendance pour femmes, boutique.',
        phone: '+86 188 1437 1809',
      },
      {
        portalId: get('vetements-femme'),
        title: 'Fashion Design',
        body: '🏷️ Fabricant de vêtements pour femmes, mode en gros.\n📱 Mama Lin : +86 135 2784 4898',
        phone: '+86 188 1437 1809',
      },
      {
        portalId: get('vetements-femme'),
        title: 'Xin Xin Clothing',
        body: '🏷️ Vêtements pour femmes, mode tendance, vente en gros.',
        phone: '+86 137 2483 7233',
      },
      {
        portalId: get('vetements-femme'),
        title: 'CC Fashion',
        body: '🏷️ Vêtements pour femmes, accessoires de mode.',
        phone: '+86 134 1433 5616',
      },
      {
        portalId: get('vetements-femme'),
        title: 'Yana Clothing',
        body: '🏷️ Vêtements pour femmes, robes africaines, ensembles.\n📱 WhatsApp 2 : +86 137 2510 5121',
        phone: '+86 137 2985 0401',
      },
      {
        portalId: get('vetements-femme'),
        title: 'YOYO Fashion',
        body: '🏷️ Mode femme, vêtements tendance, boutique.',
        phone: '+86 183 2072 7965',
      },
      {
        portalId: get('vetements-femme'),
        title: 'CL Dress',
        body: '🏷️ Robes, vêtements de soirée, mode femme.',
        phone: '+86 192 5845 5762',
      },
      {
        portalId: get('vetements-femme'),
        title: 'MOJIE',
        body: '🏷️ Vêtements pour femmes et hommes, mode en gros.\n📱 WhatsApp : +86 151 0209 7063',
        phone: '+86 138 2519 9952',
      },
      {
        portalId: get('vetements-femme'),
        title: 'Guangzhou Duoduo Apparel Supply Chain',
        body: '🏷️ Fabricant et fournisseur de vêtements pour femmes.\n📱 Mobile : +86 151 7998 9120',
        phone: '+86 198 6410 2373',
      },
      {
        portalId: get('vetements-femme'),
        title: 'Recoco Fashion',
        body: '🏷️ Mode femme, ensembles, robes, vêtements tendance.\n📱 Mobile 2 : +86 137 1113 0858',
        phone: '+86 137 1161 2922',
      },
      {
        portalId: get('vetements-femme'),
        title: 'Wen Si Man',
        body: '🏷️ Vêtements pour femmes, lingerie et mode féminine.\n📱 Mobile 2 : +86 135 6030 4242',
        phone: '+86 135 2776 5667',
      },
      {
        portalId: get('vetements-femme'),
        title: 'King Plus',
        body: '🏷️ Vêtements premium pour femmes, boutique et vente en gros.\n📱 Mobile : +86 159 1436 9329',
        phone: '+86 137 1110 6489',
      },

      // ── Lingerie ──────────────────────────────────────────────────────────────
      {
        portalId: get('lingerie'),
        title: 'Yi Ting Underpants',
        body: '🏷️ Lingerie, sous-vêtements, pyjamas.',
        phone: '+86 137 1924 4667',
      },
      {
        portalId: get('lingerie'),
        title: 'Duo Mi Underwear Factory',
        body: '🏷️ Lingerie, gaines, sous-vêtements, fabrication en usine.\n📱 Mobile : +86 159 1749 9219',
        phone: '+86 135 2776 5256',
      },
      {
        portalId: get('lingerie'),
        title: 'Ya Jia Body Beauty Underwear',
        body: '🏷️ Gaines, body sculptants, lingerie minceur.',
      },

      // ── Cosmétiques ───────────────────────────────────────────────────────────
      {
        portalId: get('cosmetiques'),
        title: 'Guangzhou Aifeier Cosmetic',
        body: '🏷️ Press-on nails, faux cils, cosmétiques, OEM.\n☎️ Téléphone : +86 135 3879 2563\n🌐 www.aierfeinails.com',
        phone: '+86 133 5886 0573',
        email: 'joannezhang@aierfeinails.com',
      },
      {
        portalId: get('cosmetiques'),
        title: 'OEM / ODM Nail Factory',
        body: '🏷️ Press-on nails, OEM, Private Label, faux cils.\n☎️ Téléphone : +86 137 2535 5525\n🌐 www.aierfeinails.com',
        phone: '+86 183 1996 1624',
        email: 'sylviasui@aierfeinails.com',
      },
      {
        portalId: get('cosmetiques'),
        title: 'LKER / Skywei Nail Factory',
        body: '🏷️ Gel polish, press-on nails, accessoires pour ongles.\n🌐 www.lkernail.com',
      },
      {
        portalId: get('cosmetiques'),
        title: 'HIMYKEY',
        body: '🏷️ Machines esthétiques, équipements spa, matériel de salon.\n🌐 www.himykey.com',
        phone: '+86 136 9428 9161',
      },
      {
        portalId: get('cosmetiques'),
        title: 'WEIQIANS',
        body: '🏷️ Machines esthétiques, appareils de beauté.',
        phone: '+86 134 2362 3553',
      },
      {
        portalId: get('cosmetiques'),
        title: 'CHUYOU',
        body: '🏷️ Équipements esthétiques, machines de beauté.\n📱 Mobile : +86 176 2002 7620',
        phone: '+86 137 9841 3562',
      },

      // ── Emballages ────────────────────────────────────────────────────────────
      {
        portalId: get('emballages'),
        title: 'Jinyuan Packaging',
        body: '🏷️ Boîtes, emballages personnalisés, sacs cadeaux, packaging avec logo.',
        phone: '+86 137 9801 3537',
      },

      // ── Montres (mapped to électronique as closest existing portal) ───────────
      {
        portalId: get('electronique'),
        title: 'Southern Clock Trading Center',
        body: '⌚ Montres homme, montres femme, vente en gros.',
        phone: '+86 153 2374 7861',
      },

      // ── Logistique ────────────────────────────────────────────────────────────
      {
        portalId: get('logistique'),
        title: 'Zehur Logistics',
        body: '🏷️ Transport maritime, aérien, expédition internationale.',
      },
      {
        portalId: get('logistique'),
        title: 'Guangzhou Sheng He Trade',
        body: '🏷️ Transport, logistique, exportation.\n📱 Mobile : +86 191 3858 5553',
        phone: '+86 183 1203 1187',
      },
      {
        portalId: get('logistique'),
        title: 'Guangzhou Duoduo Apparel Supply Chain – Logistique',
        body: '🏷️ Logistique, sourcing et expédition de marchandises.\n📱 Mobile : +86 151 7998 9120',
        phone: '+86 198 6410 2373',
      },
    ]

    let inserted = 0
    let skipped = 0
    for (const drop of drops) {
      const result = await ctx.runMutation(internal.seedSuppliers.insertDrop, {
        authorId,
        ...drop,
      })
      if (result) inserted++
      else skipped++
    }

    return { inserted, skipped, total: drops.length }
  },
})
