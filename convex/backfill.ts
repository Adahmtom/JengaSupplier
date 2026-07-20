import { internalAction, internalMutation, internalQuery } from './_generated/server'
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

// ─────────────────────────────────────────────────────────────────────────────
// provisionUnmatchedUsers
//
// Run once from Convex dashboard after reconcileStripeSubscriptions produces
// an unmatched list. For each entry:
//   1. Queries Clerk Admin API by email to find if the user signed up
//   2. If found in Clerk → upserts Convex user + subscription (immediate access)
//   3. If NOT in Clerk yet → records as "pending" (selfHealForUser will fire
//      automatically when they sign up with the same email)
//
// Returns three lists:
//   provisioned  — healed now (were in Clerk, matched by email)
//   pending      — not yet in Clerk; self-heal will handle on first sign-in
//   failed       — Clerk lookup errored; retry manually
// ─────────────────────────────────────────────────────────────────────────────
export const provisionUnmatchedUsers = internalAction({
  args: {
    unmatched: v.array(v.object({
      subscriptionId: v.string(),
      customerId: v.string(),
      email: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { unmatched }): Promise<{
    provisioned: string[]
    pending: string[]
    failed: Array<{ email: string; error: string }>
  }> => {
    const clerkKey = process.env.CLERK_SECRET_KEY
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!clerkKey) throw new Error('CLERK_SECRET_KEY not set in Convex env')
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not set in Convex env')

    const provisioned: string[] = []
    const pending: string[] = []
    const failed: Array<{ email: string; error: string }> = []

    for (const entry of unmatched) {
      const email = entry.email
      if (!email) { pending.push('(no email)'); continue }

      try {
        // 1. Look up user in Clerk by email
        const clerkRes = await fetch(
          `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}&limit=1`,
          { headers: { Authorization: `Bearer ${clerkKey}` } },
        )
        if (!clerkRes.ok) throw new Error(`Clerk API ${clerkRes.status}`)
        const clerkUsers = (await clerkRes.json()) as Array<{
          id: string
          email_addresses: Array<{ email_address: string; id: string }>
          primary_email_address_id: string | null
          first_name: string | null
          last_name: string | null
          image_url: string | null
        }>

        if (clerkUsers.length === 0) {
          // Not in Clerk yet — selfHealForUser handles them on first sign-in
          pending.push(email)
          console.log(`[backfill] provisionUnmatched pending (not in Clerk): ${email}`)
          continue
        }

        const cu = clerkUsers[0]
        const primaryEmail = cu.email_addresses.find((e) => e.id === cu.primary_email_address_id)
        const resolvedEmail = primaryEmail?.email_address ?? email
        const name = [cu.first_name, cu.last_name].filter(Boolean).join(' ') || undefined

        // 2. Upsert the Convex user record
        const userId = await ctx.runMutation(internal.users.upsertUser, {
          clerkId: cu.id,
          email: resolvedEmail,
          name,
          imageUrl: cu.image_url ?? undefined,
        })

        // 3. Retrieve the Stripe subscription for accurate current data
        const subRes = await fetch(
          `https://api.stripe.com/v1/subscriptions/${entry.subscriptionId}`,
          { headers: { Authorization: `Bearer ${stripeKey}` } },
        )
        if (!subRes.ok) throw new Error(`Stripe API ${subRes.status}`)
        const sub = (await subRes.json()) as {
          id: string
          status: string
          customer: string
          items: { data: Array<{ price: { id: string } }> }
          current_period_end: number
          cancel_at_period_end: boolean
        }

        await ctx.runMutation(internal.subscriptions.upsertSubscription, {
          userId: userId as any,
          stripeCustomerId: entry.customerId,
          stripeSubscriptionId: sub.id,
          stripePriceId: sub.items.data[0]?.price?.id ?? '',
          status: sub.status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'paused',
          currentPeriodEnd: sub.current_period_end * 1000,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        })

        provisioned.push(email)
        console.log(`[backfill] provisionUnmatched provisioned: ${email} clerkId=${cu.id} subId=${sub.id}`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        failed.push({ email, error: msg })
        console.error(`[backfill] provisionUnmatched failed: ${email} — ${msg}`)
      }
    }

    console.log(`[backfill] provisionUnmatched done: provisioned=${provisioned.length} pending=${pending.length} failed=${failed.length}`)
    return { provisioned, pending, failed }
  },
})
