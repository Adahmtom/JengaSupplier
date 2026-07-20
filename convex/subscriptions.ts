import { internalMutation, internalQuery, mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { requireAuth } from './_helpers'

export const getSubscriptionQuery = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const subs = await ctx.db
      .query('subscriptions')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect()
    return subs.find((s) => s.status === 'active' || s.status === 'trialing') ?? subs[0] ?? null
  },
})

export const getMySubscription = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) return null

    const subs = await ctx.db
      .query('subscriptions')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()
    return subs.find((s) => s.status === 'active' || s.status === 'trialing') ?? subs[0] ?? null
  },
})

export const upsertSubscription = internalMutation({
  args: {
    userId: v.id('users'),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    status: v.union(
      v.literal('active'),
      v.literal('trialing'),
      v.literal('past_due'),
      v.literal('canceled'),
      v.literal('incomplete'),
      v.literal('incomplete_expired'),
      v.literal('unpaid'),
      v.literal('paused'),
    ),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query('subscriptions')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .collect()
    const existing = subs.find((s) => s.stripeSubscriptionId === args.stripeSubscriptionId) ?? subs[0]

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripePriceId: args.stripePriceId,
        stripeCustomerId: args.stripeCustomerId,
      })
      return existing._id
    }

    return ctx.db.insert('subscriptions', args)
  },
})

export const getUserByStripeCustomerId = internalQuery({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, { stripeCustomerId }) => {
    const sub = await ctx.db
      .query('subscriptions')
      .withIndex('by_stripeCustomerId', (q) => q.eq('stripeCustomerId', stripeCustomerId))
      .unique()
    if (!sub) return null
    return ctx.db.get(sub.userId)
  },
})
