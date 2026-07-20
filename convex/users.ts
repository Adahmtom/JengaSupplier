import { internalAction, internalMutation, internalQuery, mutation, query } from './_generated/server'
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

// Called client-side on every portal page load — ensures the user record exists
// even if the Clerk webhook failed to fire (race conditions, misconfiguration, etc.)
export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (existing) return existing._id

    // Check if a placeholder record exists for this email (subscriber who paid before signing up)
    const email = identity.email ?? ''
    if (email) {
      const placeholder = await ctx.db
        .query('users')
        .withIndex('by_clerkId', (q) => q.eq('clerkId', `placeholder:${email}`))
        .unique()
      if (placeholder) {
        // Claim the placeholder — swap in the real Clerk ID so queries work immediately
        await ctx.db.patch(placeholder._id, {
          clerkId: identity.subject,
          name: identity.name ?? placeholder.name,
          imageUrl: identity.pictureUrl ?? placeholder.imageUrl,
        })
        return placeholder._id
      }
    }

    return ctx.db.insert('users', {
      clerkId: identity.subject,
      email,
      name: identity.name ?? undefined,
      imageUrl: identity.pictureUrl ?? undefined,
      role: 'member',
    })
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

    const knownUserIds = new Set(users.map((u) => u._id))

    // Subscriptions that exist in Convex but have no matching user record
    // (paid via Stripe but never completed Clerk sign-up)
    const orphanedSubs = subs.filter((s) => !knownUserIds.has(s.userId))

    const knownMembers = users.map((u) => ({
      ...u,
      subscription: subByUserId.get(u._id) ?? null,
      isOrphaned: false,
    }))

    // Surface orphaned subscriptions as placeholder rows so admins can see them
    const orphanedRows = orphanedSubs.map((s) => ({
      _id: s.userId,
      _creationTime: s._creationTime,
      clerkId: '',
      email: `stripe:${s.stripeCustomerId}`,
      name: undefined as string | undefined,
      imageUrl: undefined as string | undefined,
      role: 'member' as const,
      subscription: s,
      isOrphaned: true,
    }))

    return [...knownMembers, ...orphanedRows]
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

// One-time backfill: pages through all Clerk users and upserts them into Convex.
// Run from the Convex dashboard: Functions → users → syncAllClerkUsers → Run
export const syncAllClerkUsers = internalAction({
  args: {},
  handler: async (ctx) => {
    const secretKey = process.env.CLERK_SECRET_KEY
    if (!secretKey) throw new Error('CLERK_SECRET_KEY not set in Convex environment')

    let offset = 0
    const limit = 100
    let total = 0

    while (true) {
      const res = await fetch(
        `https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}`,
        { headers: { Authorization: `Bearer ${secretKey}` } },
      )
      if (!res.ok) throw new Error(`Clerk API error: ${res.status} ${await res.text()}`)

      const users = (await res.json()) as Array<{
        id: string
        email_addresses: Array<{ email_address: string; id: string }>
        primary_email_address_id: string | null
        first_name: string | null
        last_name: string | null
        image_url: string | null
      }>

      if (users.length === 0) break

      for (const u of users) {
        const primary = u.email_addresses.find((e) => e.id === u.primary_email_address_id)
        await ctx.runMutation(internal.users.upsertUser, {
          clerkId: u.id,
          email: primary?.email_address ?? '',
          name: [u.first_name, u.last_name].filter(Boolean).join(' ') || undefined,
          imageUrl: u.image_url ?? undefined,
        })
        total++
      }

      if (users.length < limit) break
      offset += limit
    }

    return { synced: total }
  },
})

// One-time backfill: pull all Stripe subscriptions and upsert them into Convex.
// Matches Stripe customers to Convex users by email.
// Run from the Convex dashboard: Functions → users → syncAllStripeSubscriptions → Run
export const syncAllStripeSubscriptions = internalAction({
  args: {},
  handler: async (ctx) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not set in Convex environment')

    // Fetch all Convex users to build email → _id map
    const convexUsers: Array<{ _id: string; email: string }> = await ctx.runQuery(
      internal.users.listAllForSync,
    )
    const byEmail = new Map(convexUsers.map((u) => [u.email.toLowerCase(), u._id]))

    let synced = 0
    let skipped = 0
    let startingAfter: string | undefined

    while (true) {
      const params = new URLSearchParams({ limit: '100', 'expand[]': 'data.customer' })
      if (startingAfter) params.set('starting_after', startingAfter)

      const res = await fetch(`https://api.stripe.com/v1/subscriptions?${params}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
      })
      if (!res.ok) throw new Error(`Stripe API error: ${res.status} ${await res.text()}`)

      const data = (await res.json()) as {
        data: Array<{
          id: string
          status: string
          customer: string | { id: string; email: string | null }
          items: { data: Array<{ price: { id: string } }> }
          current_period_end: number
          cancel_at_period_end: boolean
        }>
        has_more: boolean
      }

      for (const sub of data.data) {
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
        const customerEmail = typeof sub.customer === 'object' ? sub.customer.email : null

        // Try to find Convex user by email first, then fall back to fetching customer from Stripe
        let convexUserId = customerEmail ? byEmail.get(customerEmail.toLowerCase()) : undefined

        if (!convexUserId && typeof sub.customer === 'string') {
          const custRes = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
            headers: { Authorization: `Bearer ${stripeKey}` },
          })
          if (custRes.ok) {
            const cust = (await custRes.json()) as { email: string | null }
            if (cust.email) convexUserId = byEmail.get(cust.email.toLowerCase())
          }
        }

        if (!convexUserId) { skipped++; continue }

        const priceId = sub.items.data[0]?.price?.id ?? ''
        const status = sub.status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'paused'

        await ctx.runMutation(internal.subscriptions.upsertSubscription, {
          userId: convexUserId as any,
          stripeCustomerId: customerId,
          stripeSubscriptionId: sub.id,
          stripePriceId: priceId,
          status,
          currentPeriodEnd: sub.current_period_end * 1000,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        })
        synced++
      }

      if (!data.has_more) break
      startingAfter = data.data[data.data.length - 1]?.id
    }

    return { synced, skipped }
  },
})

export const listAllForSync = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query('users').collect(),
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
