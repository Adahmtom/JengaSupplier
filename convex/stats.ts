import { query } from './_generated/server'
import { v } from 'convex/values'
import { softPermission } from './_helpers'

export const adminStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await softPermission(ctx, 'members', 'read')
    if (!user) return null

    const [users, subs, drops, portals] = await Promise.all([
      ctx.db.query('users').collect(),
      ctx.db.query('subscriptions').collect(),
      ctx.db.query('drops').collect(),
      ctx.db.query('portals').collect(),
    ])

    const now = Date.now()
    const weekAgo  = now - 7  * 24 * 60 * 60 * 1000
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000

    const activeSubs  = subs.filter((s) => s.status === 'active')
    const trialSubs   = subs.filter((s) => s.status === 'trialing')
    const canceledSubs = subs.filter((s) => s.status === 'canceled')
    const pastDueSubs = subs.filter((s) => s.status === 'past_due')

    const activeMembers = activeSubs.length + trialSubs.length
    const mrr = activeSubs.length * 2900
    const arr = mrr * 12

    const newThisWeek  = users.filter((u) => u._creationTime > weekAgo).length
    const newThisMonth = users.filter((u) => u._creationTime > monthAgo).length
    const dropsThisWeek = drops.filter((d) => d._creationTime > weekAgo).length
    const publishedDrops = drops.filter((d) => d.isPublished).length
    const alertDrops = drops.filter((d) => d.isAlert && d.isPublished).length

    const churnRate = subs.length > 0 ? (canceledSubs.length / subs.length) * 100 : 0

    // Vendors per category
    const vendorsByCategory: Record<string, number> = {}
    for (const drop of drops) {
      const key = drop.portalId as string
      vendorsByCategory[key] = (vendorsByCategory[key] ?? 0) + 1
    }

    const categoryBreakdown = portals
      .map((p) => ({ name: p.name, emoji: p.emoji, count: vendorsByCategory[p._id] ?? 0 }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      // Core
      activeMembers,
      mrr,
      arr,
      totalMembers: users.length,
      totalDrops: drops.length,
      publishedDrops,
      alertDrops,
      totalCategories: portals.filter((p) => p.isActive).length,
      // Growth
      newThisWeek,
      newThisMonth,
      dropsThisWeek,
      // Sub breakdown
      subActive:   activeSubs.length,
      subTrialing: trialSubs.length,
      subCanceled: canceledSubs.length,
      subPastDue:  pastDueSubs.length,
      churnRate: Math.round(churnRate * 10) / 10,
      // Category leaderboard
      categoryBreakdown,
    }
  },
})

export const auditLogs = query({
  args: {
    resource: v.optional(v.string()),
    severity: v.optional(v.union(
      v.literal('info'),
      v.literal('warning'),
      v.literal('critical'),
    )),
  },
  handler: async (ctx, { resource, severity }) => {
    const user = await softPermission(ctx, 'audit_logs', 'read')
    if (!user) return null

    let logs

    if (resource) {
      logs = await ctx.db
        .query('auditLogs')
        .withIndex('by_resource', (q) => q.eq('resource', resource))
        .order('desc')
        .take(100)
    } else if (severity) {
      logs = await ctx.db
        .query('auditLogs')
        .withIndex('by_severity', (q) => q.eq('severity', severity))
        .order('desc')
        .take(100)
    } else {
      logs = await ctx.db.query('auditLogs').order('desc').take(100)
    }

    return logs
  },
})
