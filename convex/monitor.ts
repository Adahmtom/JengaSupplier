import { internalAction, internalMutation, internalQuery } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { Id } from './_generated/dataModel'

const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000 // 7 days between repeat emails

// ── Queries ──────────────────────────────────────────────────────────────────

export const getRecentNotification = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return ctx.db
      .query('accessNotifications')
      .withIndex('by_email', (q) => q.eq('email', email))
      .order('desc')
      .first()
  },
})

export const getAllUsers = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query('users').collect(),
})

export const getAllSubs = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query('subscriptions').collect(),
})

// ── Mutations ─────────────────────────────────────────────────────────────────

export const logNotification = internalMutation({
  args: {
    email: v.string(),
    type: v.union(v.literal('create_account'), v.literal('access_confirmed')),
  },
  handler: async (ctx, { email, type }) => {
    await ctx.db.insert('accessNotifications', { email, type, sentAt: Date.now() })
  },
})

// ── Email helpers ─────────────────────────────────────────────────────────────

function createAccountEmail(email: string, name: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
      <h2 style="color:#b8860b">China Business Vault by Belle Jones 🌟</h2>
      <p>Bonjour ${name || 'chère membre'},</p>
      <p>Votre paiement a bien été reçu et confirmé — merci pour votre confiance !</p>
      <p>Pour accéder à la plateforme, il vous suffit de <strong>créer votre compte</strong> en utilisant exactement cette adresse email :</p>
      <p style="font-size:18px;font-weight:bold;color:#b8860b;text-align:center;padding:12px;background:#fffbf0;border-radius:8px">${email}</p>
      <p style="text-align:center;margin:24px 0">
        <a href="https://jengasuppliers.com/sign-up"
           style="background:#b8860b;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">
          Créer mon compte →
        </a>
      </p>
      <p>⚠️ <strong>Important :</strong> Utilisez bien l'adresse email ci-dessus lors de votre inscription pour que votre accès soit activé automatiquement.</p>
      <p>Une fois votre compte créé, vous aurez immédiatement accès à :</p>
      <ul>
        <li>✅ Le fil des fournisseurs vérifiés</li>
        <li>✅ Les vidéos entrepôts</li>
        <li>✅ La communauté Jenga</li>
      </ul>
      <p>En cas de problème, répondez directement à cet email.</p>
      <p>Bienvenue dans l'aventure Jenga ! 🚀</p>
      <p style="color:#888;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px">
        China Business Vault by Belle Jones · jengasuppliers.com
      </p>
    </div>
  `
}

function accessConfirmedEmail(name: string, expiryDate: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
      <h2 style="color:#b8860b">China Business Vault by Belle Jones 🌟</h2>
      <p>Bonjour ${name || 'chère membre'},</p>
      <p>Bonne nouvelle ! Votre accès à la plateforme est maintenant <strong style="color:green">actif</strong>. ✅</p>
      <p>Votre abonnement est valide jusqu'au <strong>${expiryDate}</strong>.</p>
      <p style="text-align:center;margin:24px 0">
        <a href="https://jengasuppliers.com/feed"
           style="background:#b8860b;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">
          Accéder à la plateforme →
        </a>
      </p>
      <p>Si vous voyez encore la page de verrouillage, faites un simple <strong>rechargement de la page</strong> (F5 ou Ctrl+R).</p>
      <p>Bienvenue dans l'aventure Jenga ! 🚀</p>
      <p style="color:#888;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px">
        China Business Vault by Belle Jones · jengasuppliers.com
      </p>
    </div>
  `
}

// ── Main monitor action ───────────────────────────────────────────────────────

export const checkAndNotify = internalAction({
  args: {},
  handler: async (ctx): Promise<Record<string, unknown>> => {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const emailSecret = process.env.EMAIL_API_SECRET
    const clerkKey = process.env.CLERK_SECRET_KEY

    if (!stripeKey || !appUrl || !emailSecret || !clerkKey) {
      console.error('[monitor] Missing required env vars')
      return { error: 'Missing env vars' }
    }

    const emailEndpoint = `${appUrl}/api/send-email`

    // Load all Convex users and subscriptions
    const allUsers: Array<{ _id: string; clerkId: string; email: string; name?: string }> =
      await ctx.runQuery(internal.monitor.getAllUsers)
    const allSubs: Array<{ userId: string; status: string; currentPeriodEnd: number }> =
      await ctx.runQuery(internal.monitor.getAllSubs)

    const subByUserId = new Map(allSubs.map((s) => [s.userId, s]))
    const userByEmail = new Map(allUsers.map((u) => [u.email.toLowerCase(), u]))

    // Fix blank-email users first (silent, no email needed)
    const blankUsers = allUsers.filter((u) => !u.email && !u.clerkId.startsWith('placeholder:'))
    for (const u of blankUsers) {
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
        }
        const primary = data.email_addresses.find((e) => e.id === data.primary_email_address_id)
        if (primary?.email_address) {
          await ctx.runMutation(internal.users.upsertUser, {
            clerkId: u.clerkId,
            email: primary.email_address,
            name: [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined,
          })
          console.log(`[monitor] fixed blank email for ${u.clerkId} → ${primary.email_address}`)
        }
      } catch { /* skip */ }
    }

    // Sync missing subscriptions from Stripe
    const result = await ctx.runAction(internal.users.syncAllStripeSubscriptions)
    console.log(`[monitor] stripe sync: synced=${(result as Record<string,number>).synced} skipped=${(result as Record<string,number>).skipped}`)

    // Reload fresh after sync
    const freshUsers: Array<{ _id: string; clerkId: string; email: string; name?: string }> =
      await ctx.runQuery(internal.monitor.getAllUsers)
    const freshSubs: Array<{ userId: string; status: string; currentPeriodEnd: number }> =
      await ctx.runQuery(internal.monitor.getAllSubs)
    const freshSubByUserId = new Map(freshSubs.map((s) => [s.userId, s]))

    const stats = { emailsSent: 0, placeholders: 0, accessFixed: 0, alreadyNotified: 0 }

    for (const user of freshUsers) {
      const sub = freshSubByUserId.get(user._id)
      if (!sub) continue
      if (sub.status !== 'active' && sub.status !== 'trialing') continue
      if (!user.email) continue

      const isPlaceholder = user.clerkId.startsWith('placeholder:')
      const recent = await ctx.runQuery(internal.monitor.getRecentNotification, { email: user.email })
      const notifiedRecently = recent && (Date.now() - recent.sentAt) < COOLDOWN_MS

      if (notifiedRecently) {
        stats.alreadyNotified++
        continue
      }

      const expiryDate = new Date(sub.currentPeriodEnd).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
      })

      if (isPlaceholder) {
        // Paid but never created a Clerk account → ask them to sign up
        stats.placeholders++
        try {
          await fetch(emailEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-email-secret': emailSecret },
            body: JSON.stringify({
              to: user.email,
              subject: '✅ Votre paiement est confirmé — Créez votre compte Jenga',
              html: createAccountEmail(user.email, user.name ?? ''),
            }),
          })
          await ctx.runMutation(internal.monitor.logNotification, {
            email: user.email,
            type: 'create_account',
          })
          stats.emailsSent++
          console.log(`[monitor] sent create_account email to ${user.email}`)
        } catch (err) {
          console.error(`[monitor] failed to send to ${user.email}:`, err)
        }
      } else {
        // Real Clerk user with active sub — confirm access (only send once, not repeated)
        const everNotified = await ctx.runQuery(internal.monitor.getRecentNotification, { email: user.email })
        if (everNotified) continue

        stats.accessFixed++
        try {
          await fetch(emailEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-email-secret': emailSecret },
            body: JSON.stringify({
              to: user.email,
              subject: '✅ Votre accès Jenga est actif',
              html: accessConfirmedEmail(user.name ?? '', expiryDate),
            }),
          })
          await ctx.runMutation(internal.monitor.logNotification, {
            email: user.email,
            type: 'access_confirmed',
          })
          stats.emailsSent++
          console.log(`[monitor] sent access_confirmed email to ${user.email}`)
        } catch (err) {
          console.error(`[monitor] failed to send to ${user.email}:`, err)
        }
      }
    }

    console.log(`[monitor] done: ${JSON.stringify(stats)}`)
    return stats
  },
})
