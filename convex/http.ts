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
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-06-24.dahlia',
    })

    const signature = request.headers.get('stripe-signature')
    if (!signature) return new Response('Missing signature', { status: 400 })

    const rawBody = await request.text()

    let event: import('stripe').Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      )
    } catch {
      return new Response('Invalid signature', { status: 400 })
    }

    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      let subscription: import('stripe').Stripe.Subscription

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as import('stripe').Stripe.Checkout.Session
        if (session.mode !== 'subscription' || !session.subscription) {
          return new Response('ok', { status: 200 })
        }
        subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      } else {
        subscription = event.data.object as import('stripe').Stripe.Subscription
      }

      const customerId = subscription.customer as string
      const user = await ctx.runQuery(internal.subscriptions.getUserByStripeCustomerId, {
        stripeCustomerId: customerId,
      })

      // On first checkout, look up user via metadata
      let userId = user?._id
      if (!userId && event.type === 'checkout.session.completed') {
        const session = event.data.object as import('stripe').Stripe.Checkout.Session
        const clerkId = session.metadata?.clerkId
        if (clerkId) {
          const foundUser = await ctx.runQuery(internal.users.getUserByClerkId, { clerkId })
          userId = foundUser?._id
        }
      }

      if (!userId) return new Response('User not found', { status: 400 })

      const item = subscription.items.data[0]
      await ctx.runMutation(internal.subscriptions.upsertSubscription, {
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: item.price.id,
        status: subscription.status as
          | 'active'
          | 'trialing'
          | 'past_due'
          | 'canceled'
          | 'incomplete'
          | 'incomplete_expired'
          | 'unpaid'
          | 'paused',
        currentPeriodEnd: (subscription as any).current_period_end * 1000,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      })
    }

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
    if (!webhookSecret) return new Response('Not configured', { status: 500 })

    const svixId = request.headers.get('svix-id')
    const svixTimestamp = request.headers.get('svix-timestamp')
    const svixSignature = request.headers.get('svix-signature')
    if (!svixId || !svixTimestamp || !svixSignature) {
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
    } catch {
      return new Response('Invalid signature', { status: 400 })
    }

    if (event.type === 'user.created' || event.type === 'user.updated') {
      const data = event.data
      const primaryEmail = (data.email_addresses as Array<{ email_address: string; id: string }>).find(
        (e) => e.id === data.primary_email_address_id,
      )

      await ctx.runMutation(internal.users.upsertUser, {
        clerkId: data.id as string,
        email: primaryEmail?.email_address ?? '',
        name:
          [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined,
        imageUrl: (data.image_url as string) || undefined,
      })
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

export default http
