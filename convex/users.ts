import { internalMutation, internalQuery, mutation, query } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { requirePermission, requireSuperAdmin, softPermission } from './_helpers'
import { roleValidator } from './schema'

export const upsertUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', args.clerkId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
      })
      return existing._id
    }

    return ctx.db.insert('users', { ...args, role: 'member' })
  },
})

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    return ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()
  },
})

export const getUserByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
      .unique()
  },
})

export const listMembers = query({
  args: {},
  handler: async (ctx) => {
    const user = await softPermission(ctx, 'members', 'read')
    if (!user) return null

    const users = await ctx.db.query('users').collect()
    const subs = await ctx.db.query('subscriptions').collect()
    const subByUserId = new Map(subs.map((s) => [s.userId, s]))

    return users.map((u) => ({
      ...u,
      subscription: subByUserId.get(u._id) ?? null,
    }))
  },
})

// Role changes are critical security events — only super_admin can do this
// and every change is logged with critical severity
export const setUserRole = mutation({
  args: {
    targetUserId: v.id('users'),
    role: roleValidator,
  },
  handler: async (ctx, { targetUserId, role }) => {
    const actor = await requireSuperAdmin(ctx)

    const target = await ctx.db.get(targetUserId)
    if (!target) throw new Error('User not found')

    const previousRole = target.role
    await ctx.db.patch(targetUserId, { role })

    await ctx.runMutation(internal.audit.write, {
      actorId: actor._id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'members.role_change',
      resource: 'members',
      targetId: targetUserId,
      targetLabel: target.email,
      outcome: 'success',
      severity: 'critical',
      metadata: { previousRole, newRole: role },
    })
  },
})

// Internal-only: set super_admin by email, no auth required (used by HTTP bootstrap endpoint)
export const bootstrapAdmin = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('email'), email))
      .unique()
    if (!user) throw new Error(`No user found with email: ${email}. Sign in to the app first.`)
    await ctx.db.patch(user._id, { role: 'super_admin' })
  },
})
