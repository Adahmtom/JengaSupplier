import { internalAction, internalQuery } from './_generated/server'
import { internal } from './_generated/api'

export const getAllUsers = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query('users').collect(),
})

export const getAllSubs = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query('subscriptions').collect(),
})

// Runs every 6 hours via cron.
// 1. Fixes blank-email user records by fetching real email from Clerk API
// 2. Resyncs all Stripe subscriptions so paid members get access automatically
export const checkAndFix = internalAction({
  args: {},
  handler: async (ctx): Promise<Record<string, unknown>> => {
    const clerkKey = process.env.CLERK_SECRET_KEY
    if (!clerkKey) {
      console.error('[monitor] CLERK_SECRET_KEY not set')
      return { error: 'Missing CLERK_SECRET_KEY' }
    }

    const allUsers: Array<{ _id: string; clerkId: string; email: string; name?: string }> =
      await ctx.runQuery(internal.monitor.getAllUsers)

    // ── Step 1: Fix blank-email real Clerk users ──────────────────────────────
    const blankRealUsers = allUsers.filter(
      (u) => !u.email && !u.clerkId.startsWith('placeholder:'),
    )

    let emailsFixed = 0
    for (const u of blankRealUsers) {
      try {
        const res = await fetch(`https://api.clerk.com/v1/users/${u.clerkId}`, {
          headers: { Authorization: `Bearer ${clerkKey}` },
        })
        if (!res.ok) continue
        const data = (await res.json()) as {
          email_addresses: Array<{ email_address: string; id: string }>
          primary_email_address_id: string | null
          first_name: string | null
          last_name: string | null
          image_url: string | null
        }
        const primary = data.email_addresses.find((e) => e.id === data.primary_email_address_id)
        if (!primary?.email_address) continue
        await ctx.runMutation(internal.users.upsertUser, {
          clerkId: u.clerkId,
          email: primary.email_address,
          name: [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined,
          imageUrl: data.image_url ?? undefined,
        })
        emailsFixed++
        console.log(`[monitor] fixed blank email ${u.clerkId} → ${primary.email_address}`)
      } catch (err) {
        console.error(`[monitor] failed to fix ${u.clerkId}:`, err)
      }
    }

    // ── Step 2: Sync all Stripe subscriptions ─────────────────────────────────
    const syncResult = await ctx.runAction(internal.users.syncAllStripeSubscriptions)
    const { synced, skipped } = syncResult as { synced: number; skipped: number }
    console.log(`[monitor] stripe sync done: synced=${synced} skipped=${skipped}`)

    // ── Step 3: Migrate placeholder subscriptions ─────────────────────────────
    const migResult = await ctx.runAction(internal.backfill.migratePlaceholderSubscriptions)
    console.log(`[monitor] placeholder migration done:`, migResult)

    const report = { emailsFixed, stripeSynced: synced, stripeSkipped: skipped }
    console.log(`[monitor] cycle complete: ${JSON.stringify(report)}`)
    return report
  },
})
