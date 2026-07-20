import { QueryCtx, MutationCtx } from './_generated/server'
import { Id } from './_generated/dataModel'
import { hasPermission, ADMIN_ROLES, Resource, Action } from './lib/permissions'

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function getUserByClerkId(ctx: QueryCtx | MutationCtx, clerkId: string) {
  return ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
    .unique()
}

export async function getActiveSubscription(ctx: QueryCtx | MutationCtx, userId: Id<'users'>) {
  const subs = await ctx.db
    .query('subscriptions')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .collect()

  // Prefer active/trialing; tolerate duplicate rows from payment retries
  return subs.find((s) => s.status === 'active' || s.status === 'trialing') ?? null
}

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Not authenticated')

  const user = await getUserByClerkId(ctx, identity.subject)
  if (!user) throw new Error('User not found')

  return user
}

export async function requireSubscription(ctx: QueryCtx | MutationCtx) {
  const user = await requireAuth(ctx)

  // Admins and moderators bypass subscription check — they need access to post
  if (ADMIN_ROLES.has(user.role)) return { user, sub: null }

  const sub = await getActiveSubscription(ctx, user._id)
  if (!sub) throw new Error('Active subscription required')
  return { user, sub }
}

// ── Role checks ───────────────────────────────────────────────────────────────

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await requireAuth(ctx)
  if (!ADMIN_ROLES.has(user.role)) throw new Error('Forbidden: admin access required')
  return user
}

export async function requireSuperAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await requireAuth(ctx)
  if (user.role !== 'super_admin') throw new Error('Forbidden: super_admin access required')
  return user
}

// ── Granular permission check ─────────────────────────────────────────────────
// Use this instead of requireAdmin when you need scoped access control.
//
// Example:
//   const user = await requirePermission(ctx, 'drops', 'delete')
//   // user is guaranteed to have drops.delete permission

export async function requirePermission(
  ctx: QueryCtx | MutationCtx,
  resource: Resource,
  action: Action,
) {
  const user = await requireAuth(ctx)

  if (!hasPermission(user.role, resource, action)) {
    throw new Error(`Forbidden: ${user.role} cannot perform ${action} on ${resource}`)
  }

  return user
}

// ── Soft variants for queries (return null during JWT hydration) ──────────────

export async function softPermission(
  ctx: QueryCtx | MutationCtx,
  resource: Resource,
  action: Action,
) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) return null

  const user = await getUserByClerkId(ctx, identity.subject)
  if (!user) return null
  if (!hasPermission(user.role, resource, action)) return null

  return user
}
