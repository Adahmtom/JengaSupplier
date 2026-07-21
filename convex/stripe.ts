import { action } from './_generated/server'
import { v } from 'convex/values'
import { api, internal } from './_generated/api'

const VALID_PLANS = new Set(['monthly', 'quarterly', 'semiannual', 'yearly'])
type Plan = 'monthly' | 'quarterly' | 'semiannual' | 'yearly'

function priceIdForPlan(plan: Plan): string {
  if (plan === 'yearly') return process.env.STRIPE_YEARLY_PRICE_ID!
  if (plan === 'quarterly') return process.env.STRIPE_QUARTERLY_PRICE_ID!
  if (plan === 'semiannual') return process.env.STRIPE_SEMIANNUAL_PRICE_ID!
  return process.env.STRIPE_PRICE_ID!
}

// Called from /checkout after Clerk sign-up. User is authenticated.
// Stripe session carries clerkId in metadata so the webhook can link directly.
export const createCheckoutSession = action({
  args: {
    plan: v.optional(v.union(
      v.literal('monthly'), v.literal('yearly'),
      v.literal('quarterly'), v.literal('semiannual'),
    )),
  },
  handler: async (ctx, { plan = 'monthly' }): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    // Ensure user record exists (checkout page may arrive before Clerk webhook)
    let user = await ctx.runQuery(api.users.getMe)
    if (!user) {
      await ctx.runMutation(api.users.ensureUser)
      user = await ctx.runQuery(api.users.getMe)
    }
    if (!user) throw new Error('User not found in Convex')

    // Use identity email as authoritative fallback — user.email may be blank
    // if ensureUser ran before Clerk populated the identity email field
    const email = user.email?.trim() || identity.email || undefined

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-06-24.dahlia' })

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card', 'link'],
      line_items: [{ price: priceIdForPlan(plan as Plan), quantity: 1 }],
      // session_id lets /feed immediately verify payment server-side before webhook arrives
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/feed?welcome=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=1`,
      ...(email ? { customer_email: email } : {}),
      // clerkUserId in metadata is the canonical link — webhook reads this
      metadata: { clerkUserId: identity.subject, plan },
      client_reference_id: identity.subject,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      custom_fields: [{
        key: 'full_name',
        label: { type: 'custom', custom: 'Nom complet' },
        type: 'text',
      }],
      custom_text: {
        submit: { message: 'Votre abonnement commence immédiatement après le paiement.' },
      },
      payment_method_options: { card: { request_three_d_secure: 'automatic' } },
    })

    console.log(`[stripe] checkout.session.created userId=${user._id} clerkId=${identity.subject} plan=${plan}`)
    return session.url!
  },
})

// Fallback: called client-side if webhook hasn't landed yet within the
// brief window after redirect from Stripe. Idempotent — safe to call multiple times.
export const activateSubscription = action({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }): Promise<void> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    let user = await ctx.runQuery(api.users.getMe)
    if (!user) {
      await ctx.runMutation(api.users.ensureUser)
      user = await ctx.runQuery(api.users.getMe)
    }
    if (!user) throw new Error('User not found')

    // Already activated — webhook beat us here
    const existing = await ctx.runQuery(api.subscriptions.getSubscriptionQuery, { userId: user._id })
    if (existing?.status === 'active' || existing?.status === 'trialing') {
      console.log(`[stripe] activateSubscription already_active userId=${user._id}`)
      return
    }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-06-24.dahlia' })
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    })

    if (session.payment_status !== 'paid') throw new Error('Payment not completed')

    const sub = session.subscription as any
    const customer = session.customer as any

    await ctx.runMutation(internal.subscriptions.upsertSubscription, {
      userId: user._id,
      stripeCustomerId: customer.id as string,
      stripeSubscriptionId: sub.id as string,
      stripePriceId: sub.items.data[0].price.id as string,
      status: sub.status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'paused',
      currentPeriodEnd: (sub.current_period_end as number) * 1000,
      cancelAtPeriodEnd: sub.cancel_at_period_end as boolean,
    })

    console.log(`[stripe] activateSubscription provisioned userId=${user._id} subId=${sub.id}`)
  },
})

export const createPortalSession = action({
  args: {},
  handler: async (ctx): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.runQuery(api.users.getMe)
    if (!user) throw new Error('User not found')

    const sub = await ctx.runQuery(api.subscriptions.getSubscriptionQuery, { userId: user._id })
    if (!sub) throw new Error('No subscription found')

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-06-24.dahlia' })

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
    })

    return session.url
  },
})
