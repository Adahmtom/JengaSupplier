import { internalAction } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'

// ─────────────────────────────────────────────────────────────────────────────
// reconcileStripeSubscriptions
//
// Run once from the Convex dashboard:
//   Functions → backfill → reconcileStripeSubscriptions → Run
//
// What it does:
//   1. Fetches all active/trialing Stripe subscriptions from live mode
//   2. For each, resolves the Convex user via:
//      a. clerkUserId in Stripe customer metadata  (most reliable)
//      b. email match against Convex users          (fallback)
//   3. Upserts the subscription record so the user gains immediate access
//   4. Returns a JSON report including any payments it could NOT match
// ─────────────────────────────────────────────────────────────────────────────
export const reconcileStripeSubscriptions = internalAction({
  args: {},
  handler: async (ctx): Promise<{
    matched: number
    skipped: number
    unmatched: Array<{ subscriptionId: string; customerId: string; email: string | null; reason: string }>
  }> => {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not set')

    // Build email → Convex _id map from all users
    const convexUsers: Array<{ _id: string; email: string; clerkId: string }> =
      await ctx.runQuery(internal.users.listAllForSync)
    const byEmail = new Map(convexUsers.map((u) => [u.email.toLowerCase().trim(), u._id]))
    const byClerkId = new Map(convexUsers.map((u) => [u.clerkId, u._id]))

    let matched = 0
    let skipped = 0
    const unmatched: Array<{ subscriptionId: string; customerId: string; email: string | null; reason: string }> = []

    let startingAfter: string | undefined
    while (true) {
      const params = new URLSearchParams({
        limit: '100',
        'expand[]': 'data.customer',
        'status': 'active',
      })
      if (startingAfter) params.set('starting_after', startingAfter)

      const res = await fetch(`https://api.stripe.com/v1/subscriptions?${params}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
      })
      if (!res.ok) throw new Error(`Stripe API error: ${res.status} ${await res.text()}`)

      const data = (await res.json()) as {
        data: Array<{
          id: string
          status: string
          customer: string | {
            id: string
            email: string | null
            metadata?: Record<string, string>
          }
          items: { data: Array<{ price: { id: string } }> }
          current_period_end: number
          cancel_at_period_end: boolean
        }>
        has_more: boolean
      }

      for (const sub of data.data) {
        const customer = sub.customer
        const customerId = typeof customer === 'string' ? customer : customer.id
        const customerEmail = typeof customer === 'object' ? customer.email : null
        const customerMeta = typeof customer === 'object' ? (customer.metadata ?? {}) : {}

        // Resolve Convex user — clerkUserId metadata first, then email
        let userId: string | undefined
        const clerkId = customerMeta['clerkUserId'] ?? customerMeta['userId']
        if (clerkId) userId = byClerkId.get(clerkId)
        if (!userId && customerEmail) userId = byEmail.get(customerEmail.toLowerCase().trim())

        if (!userId) {
          // Fetch customer directly in case expand didn't return full object
          if (typeof customer === 'string') {
            const custRes = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
              headers: { Authorization: `Bearer ${stripeKey}` },
            })
            if (custRes.ok) {
              const cust = (await custRes.json()) as {
                email: string | null
                metadata?: Record<string, string>
              }
              if (cust.metadata?.clerkUserId) userId = byClerkId.get(cust.metadata.clerkUserId)
              if (!userId && cust.email) userId = byEmail.get(cust.email.toLowerCase().trim())
            }
          }
        }

        if (!userId) {
          unmatched.push({
            subscriptionId: sub.id,
            customerId,
            email: customerEmail,
            reason: clerkId ? `clerkId ${clerkId} not in Convex` : 'no email or clerkId match',
          })
          skipped++
          continue
        }

        const priceId = sub.items.data[0]?.price?.id ?? ''
        await ctx.runMutation(internal.subscriptions.upsertSubscription, {
          userId: userId as any,
          stripeCustomerId: customerId,
          stripeSubscriptionId: sub.id,
          stripePriceId: priceId,
          status: sub.status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'paused',
          currentPeriodEnd: sub.current_period_end * 1000,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        })
        matched++
      }

      if (!data.has_more) break
      startingAfter = data.data[data.data.length - 1]?.id
    }

    console.log(`[backfill] reconcileStripeSubscriptions matched=${matched} skipped=${skipped} unmatched=${unmatched.length}`)
    if (unmatched.length) console.warn('[backfill] unmatched payments:', JSON.stringify(unmatched, null, 2))

    return { matched, skipped, unmatched }
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// selfHealForUser
//
// Called automatically from the Clerk webhook after every user.created event.
// If the user already has a Convex subscription record, returns immediately.
// Otherwise queries Stripe by email and upserts any active subscription found.
// Idempotent — safe to call multiple times.
// ─────────────────────────────────────────────────────────────────────────────
export const selfHealForUser = internalAction({
  args: {
    userId: v.string(),   // Convex _id
    clerkId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { userId, clerkId, email }): Promise<void> => {
    if (!email) return

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) return

    // Check if Convex already has a subscription for this user
    const existing = await ctx.runQuery(internal.subscriptions.getSubscriptionForUser, {
      userId: userId as any,
    })
    if (existing) return // nothing to heal

    // Search Stripe for customers matching this email
    const searchRes = await fetch(
      `https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=5&expand[]=data.subscriptions`,
      { headers: { Authorization: `Bearer ${stripeKey}` } },
    )
    if (!searchRes.ok) {
      console.warn(`[backfill] selfHealForUser Stripe search failed: ${searchRes.status}`)
      return
    }

    const { data: customers } = (await searchRes.json()) as {
      data: Array<{
        id: string
        subscriptions?: {
          data: Array<{
            id: string
            status: string
            items: { data: Array<{ price: { id: string } }> }
            current_period_end: number
            cancel_at_period_end: boolean
          }>
        }
      }>
    }

    for (const customer of customers) {
      const subs = customer.subscriptions?.data ?? []
      const active = subs.find((s) => s.status === 'active' || s.status === 'trialing')
      if (!active) continue

      await ctx.runMutation(internal.subscriptions.upsertSubscription, {
        userId: userId as any,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: active.id,
        stripePriceId: active.items.data[0]?.price?.id ?? '',
        status: active.status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'paused',
        currentPeriodEnd: active.current_period_end * 1000,
        cancelAtPeriodEnd: active.cancel_at_period_end,
      })
      console.log(`[backfill] selfHealForUser healed userId=${userId} clerkId=${clerkId} email=${email} subId=${active.id}`)
      return
    }
  },
})
