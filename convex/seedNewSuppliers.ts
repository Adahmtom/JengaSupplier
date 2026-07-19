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
