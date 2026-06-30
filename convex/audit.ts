// ── Isolated Audit Module (SOC2) ─────────────────────────────────────────────
//
// IMMUTABLE BY DESIGN:
//   - All writes go through `internal.audit.write` — an internalMutation
//     that the client can NEVER call directly
//   - No public `mutation` for insert, update, or delete exists in this file
//   - Records include snapshots of actor email/role so they survive user changes
//
// ARCHITECTURE-LEVEL ISOLATION:
//   - This module is the ONLY path to audit log writes
//   - All other Convex functions must call ctx.runMutation(internal.audit.write)
//   - For full SOC2 data isolation in production, deploy audit logs to a
//     separate Convex project with its own credentials and database
//
// QUERYABLE:
//   - Indexed by actor, resource, action, severity, outcome
//   - Filterable by time range, resource type, and severity
// ─────────────────────────────────────────────────────────────────────────────

import { internalMutation, query } from './_generated/server'
import { v } from 'convex/values'
import { AUDIT_READ_ROLES } from './lib/permissions'
import { severityValidator, outcomeValidator } from './schema'

// ── Internal write — client-inaccessible ──────────────────────────────────────
export const write = internalMutation({
  args: {
    actorId: v.id('users'),
    actorEmail: v.string(),
    actorRole: v.string(),
    action: v.string(),
    resource: v.string(),
    targetId: v.optional(v.string()),
    targetLabel: v.optional(v.string()),
    outcome: outcomeValidator,
    severity: severityValidator,
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('auditLogs', args)
  },
})

// ── Read queries (admin/super_admin only) ─────────────────────────────────────
export const list = query({
  args: {
    resource: v.optional(v.string()),
    severity: v.optional(v.union(
      v.literal('info'),
      v.literal('warning'),
      v.literal('critical'),
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { resource, severity, limit }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const actor = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!actor || !AUDIT_READ_ROLES.has(actor.role)) {
      throw new Error('Forbidden: insufficient permissions to read audit logs')
    }

    let logs

    if (resource) {
      logs = await ctx.db
        .query('auditLogs')
        .withIndex('by_resource', (q) => q.eq('resource', resource))
        .order('desc')
        .take(limit ?? 100)
    } else if (severity) {
      logs = await ctx.db
        .query('auditLogs')
        .withIndex('by_severity', (q) => q.eq('severity', severity))
        .order('desc')
        .take(limit ?? 100)
    } else {
      logs = await ctx.db
        .query('auditLogs')
        .order('desc')
        .take(limit ?? 100)
    }

    return logs
  },
})

export const listCritical = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const actor = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!actor || !AUDIT_READ_ROLES.has(actor.role)) {
      throw new Error('Forbidden')
    }

    return ctx.db
      .query('auditLogs')
      .withIndex('by_severity', (q) => q.eq('severity', 'critical'))
      .order('desc')
      .take(50)
  },
})
