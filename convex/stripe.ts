import { action } from './_generated/server'
import { v } from 'convex/values'
import { api, internal } from './_generated/api'

export const createCheckoutSession = action({
  args: { plan: v.optional(v.union(v.literal('monthly'), v.literal('yearly'))) },
  handler: async (ctx, { plan = 'monthly' }): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.runQuery(api.users.getMe)
    if (!user) throw new Error('User not found')

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-06-24.dahlia',
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card', 'link'],
      line_items: [{
        price: plan === 'yearly' ? process.env.STRIPE_YEARLY_PRICE_ID! : process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/feed?welcome=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=1`,
      customer_email: user.email,
      metadata: { userId: user._id, clerkId: identity.subject },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      custom_fields: [
        {
          key: 'full_name',
          label: { type: 'custom', custom: 'Nom complet' },
          type: 'text',
        },
      ],
      custom_text: {
        submit: { message: 'Votre abonnement commence immédiatement après le paiement.' },
      },
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
    })

    return session.url!
  },
})

export const getSessionEmail = action({
  args: { sessionId: v.string() },
  handler: async (_ctx, { sessionId }): Promise<string> => {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-06-24.dahlia' })
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return session.customer_details?.email ?? ''
  },
})

export const createGuestCheckoutSession = action({
  args: { plan: v.union(v.literal('monthly'), v.literal('yearly')) },
  handler: async (_ctx, { plan }): Promise<string> => {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-06-24.dahlia' })

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card', 'link'],
      line_items: [{
        price: plan === 'yearly' ? process.env.STRIPE_YEARLY_PRICE_ID! : process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/sign-up?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=1`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_creation: 'always',
      custom_fields: [{ key: 'full_name', label: { type: 'custom', custom: 'Nom complet' }, type: 'text' }],
      custom_text: { submit: { message: 'Votre abonnement commence immédiatement après le paiement.' } },
      payment_method_options: { card: { request_three_d_secure: 'automatic' } },
    })

    return session.url!
  },
})

export const activateGuestSubscription = action({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }): Promise<void> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.runQuery(api.users.getMe)
    if (!user) throw new Error('User not found')

    // Check if subscription already activated (webhook may have fired first)
    const existing = await ctx.runQuery(api.subscriptions.getSubscriptionQuery, { userId: user._id })
    if (existing) return

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-06-24.dahlia' })

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    })

    if (session.payment_status !== 'paid') throw new Error('Payment not completed')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub = session.subscription as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customer = session.customer as any
    const priceId: string = sub?.items?.data?.[0]?.price?.id ?? ''

    await ctx.runMutation(internal.subscriptions.upsertSubscription, {
      userId: user._id,
      stripeCustomerId: customer.id as string,
      stripeSubscriptionId: sub.id as string,
      stripePriceId: priceId,
      status: sub.status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'paused',
      currentPeriodEnd: sub.current_period_end as number,
      cancelAtPeriodEnd: sub.cancel_at_period_end as boolean,
    })
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
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-06-24.dahlia',
    })

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
    })

    return session.url
  },
})
