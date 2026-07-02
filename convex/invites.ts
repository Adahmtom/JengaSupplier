import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { requirePermission } from './_helpers'

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

function randomToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

// Admin creates a one-time invite link for a subscriber who hasn't signed up yet
export const createInvite = mutation({
  args: {
    email: v.string(),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, { email, stripeCustomerId }) => {
    await requirePermission(ctx, 'members', 'read')

    // Invalidate any previous unused invite for this email
    const existing = await ctx.db
      .query('signupInvites')
      .withIndex('by_email', (q) => q.eq('email', email))
      .collect()
    for (const inv of existing) {
      if (!inv.usedAt) await ctx.db.delete(inv._id)
    }

    const token = randomToken()
    await ctx.db.insert('signupInvites', {
      email,
      stripeCustomerId,
      token,
      expiresAt: Date.now() + SEVEN_DAYS,
    })

    return token
  },
})

// Called from the /join page — validates and consumes the token
export const redeemInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const invite = await ctx.db
      .query('signupInvites')
      .withIndex('by_token', (q) => q.eq('token', token))
      .unique()

    if (!invite) return { ok: false, reason: 'invalid' as const }
    if (invite.usedAt) return { ok: false, reason: 'used' as const }
    if (Date.now() > invite.expiresAt) return { ok: false, reason: 'expired' as const }

    await ctx.db.patch(invite._id, { usedAt: Date.now() })

    return { ok: true, email: invite.email }
  },
})

// Check without consuming — lets the /join page show the email before they commit
export const peekInvite = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const invite = await ctx.db
      .query('signupInvites')
      .withIndex('by_token', (q) => q.eq('token', token))
      .unique()

    if (!invite) return { ok: false, reason: 'invalid' as const }
    if (invite.usedAt) return { ok: false, reason: 'used' as const }
    if (Date.now() > invite.expiresAt) return { ok: false, reason: 'expired' as const }

    return { ok: true, email: invite.email }
  },
})
