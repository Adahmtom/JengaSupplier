import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { softPermission } from './_helpers'

export const joinWaitlist = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    service: v.string(),
  },
  handler: async (ctx, args) => {
    // Prevent duplicate entries per email+service
    const existing = await ctx.db
      .query('waitlist')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .collect()
    const dupe = existing.find((e) => e.service === args.service)
    if (dupe) return dupe._id

    return ctx.db.insert('waitlist', args)
  },
})

export const listWaitlist = query({
  args: { service: v.optional(v.string()) },
  handler: async (ctx, { service }) => {
    const user = await softPermission(ctx, 'drops', 'read')
    if (!user) return null

    const all = service
      ? await ctx.db.query('waitlist').withIndex('by_service', (q) => q.eq('service', service)).collect()
      : await ctx.db.query('waitlist').collect()

    return all.sort((a, b) => b._creationTime - a._creationTime)
  },
})
