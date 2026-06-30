import { mutation } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { getUserByClerkId } from './_helpers'

export const claimSuperAdmin = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, { inviteCode }) => {
    const expected = process.env.ADMIN_INVITE_CODE
    if (!expected || inviteCode !== expected) {
      throw new Error('Invalid invite code')
    }

    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await getUserByClerkId(ctx, identity.subject)
    if (!user) throw new Error('User not found — sign in again')

    if (user.role === 'super_admin') return { ok: true, alreadyAdmin: true }

    await ctx.db.patch(user._id, { role: 'super_admin' })

    await ctx.runMutation(internal.audit.write, {
      actorId: user._id,
      actorEmail: user.email,
      actorRole: 'super_admin',
      action: 'members.role_change',
      resource: 'members',
      targetId: user._id,
      targetLabel: user.email,
      outcome: 'success',
      severity: 'critical',
      metadata: { previousRole: user.role, newRole: 'super_admin', method: 'invite_code' },
    })

    return { ok: true, alreadyAdmin: false }
  },
})
