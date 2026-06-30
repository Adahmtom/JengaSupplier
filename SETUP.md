# The Vault — Setup Guide

## Prerequisites
- Node.js 18+
- Convex account (convex.dev)
- Clerk account (clerk.com)
- Stripe account (stripe.com)

## Step 1 — Convex

```bash
cd the-vault
npx convex dev
```

This will:
- Create a Convex project
- Generate `convex/_generated/` (required for the build)
- Give you your `NEXT_PUBLIC_CONVEX_URL`

Copy the URL into `.env.local`.

## Step 2 — Clerk

1. Create a new application at clerk.com
2. Copy keys into `.env.local`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. In Clerk dashboard → Webhooks → Add endpoint:
   - URL: `https://your-convex-url.convex.site/clerk/webhook`
   - Events: `user.created`, `user.updated`
   - Copy signing secret → `CLERK_WEBHOOK_SECRET`

## Step 3 — Stripe

1. Create a product in Stripe dashboard: **The Vault Membership**, $29/month recurring
2. Copy the Price ID → `STRIPE_PRICE_ID`
3. Copy keys:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. In Stripe → Webhooks → Add endpoint:
   - URL: `https://your-convex-url.convex.site/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET`
5. Enable Apple Pay domain in Stripe → Payment methods → Apple Pay

## Step 4 — Make yourself admin

After signing up, run this in the Convex dashboard → Functions:

```
users.upsertUser with role: "admin"
```

Or run the mutation directly in the Convex dashboard to change your role to "admin".

## Step 5 — Seed portals

In Convex dashboard → Functions, call:
```
portals.seedPortals
```

This creates the 10 default portals (Hair, Clothing, Jewelry, etc.)

## Step 6 — Run dev

```bash
npm run dev
```

The app will be at http://localhost:3000.
Build will succeed once `convex/_generated/` exists.

## Deployment (Vercel)

1. Push to GitHub
2. Import to Vercel
3. Add all env vars from `.env.local`
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL
5. Update Stripe and Clerk webhook URLs to your production Convex URL
