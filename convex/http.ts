import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { api, internal } from './_generated/api'

const http = httpRouter()

// ── Stripe Webhook ──────────────────────────────────────────────────────────
http.route({
  path: '/stripe/webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-06-24.dahlia' })

    const signature = request.headers.get('stripe-signature')
    if (!signature) {
      console.error('[stripe-webhook] missing stripe-signature header')
      return new Response('Missing signature', { status: 400 })
    }

    const rawBody = await request.text()

    let event: import('stripe').Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[stripe-webhook] signature verification failed: ${msg}`)
      return new Response('Invalid signature', { status: 400 })
    }

    console.log(`[stripe-webhook] received event=${event.type} id=${event.id}`)

    // ── checkout.session.completed ────────────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as import('stripe').Stripe.Checkout.Session
      if (session.mode !== 'subscription' || !session.subscription) {
        console.log(`[stripe-webhook] checkout.session.completed skipped: not a subscription session`)
        return new Response('ok', { status: 200 })
      }

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      const customerId = subscription.customer as string
      const clerkId = session.metadata?.clerkUserId ?? session.client_reference_id

      // Resolve Convex user: try clerkId from session metadata first
      let userId: string | undefined
      if (clerkId) {
        const found = await ctx.runQuery(internal.users.getUserByClerkId, { clerkId })
        userId = found?._id
        if (!userId) console.warn(`[stripe-webhook] checkout.session.completed clerkId=${clerkId} not found in Convex`)
      }

      // Fallback: look up by stripeCustomerId (repeat checkout scenario)
      if (!userId) {
        const byCustomer = await ctx.runQuery(internal.subscriptions.getUserByStripeCustomerId, {
          stripeCustomerId: customerId,
        })
        userId = byCustomer?._id
      }

      if (!userId) {
        console.error(`[stripe-webhook] checkout.session.completed cannot resolve userId clerkId=${clerkId} customerId=${customerId}`)
        return new Response('ok', { status: 200 })
      }

      const item = subscription.items.data[0]
      await ctx.runMutation(internal.subscriptions.upsertSubscription, {
        userId: userId as any,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: item.price.id,
        status: subscription.status as SubscriptionStatus,
        currentPeriodEnd: (subscription as any).current_period_end * 1000,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      })
      console.log(`[stripe-webhook] checkout.session.completed provisioned userId=${userId} subId=${subscription.id}`)
      return new Response('ok', { status: 200 })
    }

    // ── customer.subscription.created / updated ───────────────────────────
    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated'
    ) {
      const subscription = event.data.object as import('stripe').Stripe.Subscription
      const customerId = subscription.customer as string

      const byCustomer = await ctx.runQuery(internal.subscriptions.getUserByStripeCustomerId, {
        stripeCustomerId: customerId,
      })
      if (!byCustomer) {
        console.warn(`[stripe-webhook] ${event.type} no user for customerId=${customerId} — checkout.session.completed should handle first provision`)
        return new Response('ok', { status: 200 })
      }

      const item = subscription.items.data[0]
      await ctx.runMutation(internal.subscriptions.upsertSubscription, {
        userId: byCustomer._id,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: item.price.id,
        status: subscription.status as SubscriptionStatus,
        currentPeriodEnd: (subscription as any).current_period_end * 1000,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      })
      console.log(`[stripe-webhook] ${event.type} updated userId=${byCustomer._id} subId=${subscription.id} status=${subscription.status}`)
      return new Response('ok', { status: 200 })
    }

    // ── customer.subscription.deleted ─────────────────────────────────────
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as import('stripe').Stripe.Subscription
      const customerId = subscription.customer as string

      const byCustomer = await ctx.runQuery(internal.subscriptions.getUserByStripeCustomerId, {
        stripeCustomerId: customerId,
      })
      if (!byCustomer) {
        console.warn(`[stripe-webhook] subscription.deleted no user for customerId=${customerId}`)
        return new Response('ok', { status: 200 })
      }

      const item = subscription.items.data[0]
      await ctx.runMutation(internal.subscriptions.upsertSubscription, {
        userId: byCustomer._id,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: item.price.id,
        status: 'canceled',
        currentPeriodEnd: (subscription as any).current_period_end * 1000,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      })
      console.log(`[stripe-webhook] subscription.deleted userId=${byCustomer._id} subId=${subscription.id}`)
      return new Response('ok', { status: 200 })
    }

    // ── invoice.payment_failed ────────────────────────────────────────────
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as import('stripe').Stripe.Invoice
      const customerId = invoice.customer as string
      const inv = invoice as import('stripe').Stripe.Invoice & { subscription?: string | { id: string } }
      const subscriptionId = typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id

      const byCustomer = await ctx.runQuery(internal.subscriptions.getUserByStripeCustomerId, {
        stripeCustomerId: customerId,
      })
      if (!byCustomer) {
        console.warn(`[stripe-webhook] invoice.payment_failed no user for customerId=${customerId}`)
        return new Response('ok', { status: 200 })
      }

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const item = subscription.items.data[0]
        await ctx.runMutation(internal.subscriptions.upsertSubscription, {
          userId: byCustomer._id,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripePriceId: item.price.id,
          status: subscription.status as SubscriptionStatus,
          currentPeriodEnd: (subscription as any).current_period_end * 1000,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        })
      }

      console.warn(`[stripe-webhook] invoice.payment_failed userId=${byCustomer._id} customerId=${customerId} invoiceId=${invoice.id}`)
      return new Response('ok', { status: 200 })
    }

    console.log(`[stripe-webhook] unhandled event=${event.type} — returning 200`)
    return new Response('ok', { status: 200 })
  }),
})

// ── Clerk Webhook (user sync) ───────────────────────────────────────────────
http.route({
  path: '/clerk/webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const { Webhook } = await import('svix')
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('[clerk-webhook] CLERK_WEBHOOK_SECRET not set')
      return new Response('Not configured', { status: 500 })
    }

    const svixId = request.headers.get('svix-id')
    const svixTimestamp = request.headers.get('svix-timestamp')
    const svixSignature = request.headers.get('svix-signature')
    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('[clerk-webhook] missing svix headers')
      return new Response('Missing svix headers', { status: 400 })
    }

    const rawBody = await request.text()
    const wh = new Webhook(webhookSecret)
    let event: { type: string; data: Record<string, unknown> }

    try {
      event = wh.verify(rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as { type: string; data: Record<string, unknown> }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[clerk-webhook] signature verification failed: ${msg}`)
      return new Response('Invalid signature', { status: 400 })
    }

    console.log(`[clerk-webhook] received event=${event.type}`)

    if (event.type === 'user.created' || event.type === 'user.updated') {
      const data = event.data
      const primaryEmail = (data.email_addresses as Array<{ email_address: string; id: string }>).find(
        (e) => e.id === data.primary_email_address_id,
      )
      const email = primaryEmail?.email_address ?? ''
      const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined
      const imageUrl = (data.image_url as string) || undefined
      const clerkId = data.id as string

      await ctx.runMutation(internal.users.upsertUser, { clerkId, email, name, imageUrl })
      console.log(`[clerk-webhook] ${event.type} upserted clerkId=${clerkId} email=${email}`)
    }

    return new Response('ok', { status: 200 })
  }),
})

// Bootstrap endpoint disabled after initial setup.
// To promote a user: use the Convex dashboard to run internal.users.bootstrapAdmin directly.
http.route({
  path: '/admin/bootstrap',
  method: 'POST',
  handler: httpAction(async (_ctx, _request) => {
    return new Response('Disabled', { status: 410 })
  }),
})

type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'
  | 'paused'

export default http
