import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// ── Role union ───────────────────────────────────────────────────────────────
// super_admin: Belle Jones — unrestricted
// admin:       can post drops, manage portals, view members
// moderator:   can create/edit drops only
// member:      read-only + like/comment
export const roleValidator = v.union(
  v.literal('super_admin'),
  v.literal('admin'),
  v.literal('moderator'),
  v.literal('member'),
)

export const severityValidator = v.union(
  v.literal('info'),
  v.literal('warning'),
  v.literal('critical'),
)

export const outcomeValidator = v.union(
  v.literal('success'),
  v.literal('failure'),
)

export default defineSchema({
  // ── App data ───────────────────────────────────────────────────────────────
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    role: roleValidator,
  })
    .index('by_clerkId', ['clerkId'])
    .index('by_email', ['email'])
    .index('by_role', ['role']),

  subscriptions: defineTable({
    userId: v.id('users'),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    status: v.union(
      v.literal('active'),
      v.literal('trialing'),
      v.literal('past_due'),
      v.literal('canceled'),
      v.literal('incomplete'),
      v.literal('incomplete_expired'),
      v.literal('unpaid'),
      v.literal('paused'),
    ),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  })
    .index('by_userId', ['userId'])
    .index('by_stripeCustomerId', ['stripeCustomerId'])
    .index('by_stripeSubscriptionId', ['stripeSubscriptionId']),

  portals: defineTable({
    name: v.string(),
    slug: v.string(),
    emoji: v.string(),
    order: v.number(),
    isActive: v.boolean(),
  })
    .index('by_slug', ['slug'])
    .index('by_order', ['order']),

  drops: defineTable({
    portalId: v.id('portals'),
    title: v.string(),
    body: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    imageStorageId: v.optional(v.id('_storage')),
    authorId: v.id('users'),
    isPinned: v.boolean(),
    isAlert: v.boolean(),
    isPublished: v.boolean(),
    isVerified: v.optional(v.boolean()),
  })
    .index('by_portal', ['portalId'])
    .index('by_alert', ['isAlert'])
    .index('by_pinned', ['isPinned'])
    .index('by_published', ['isPublished']),

  likes: defineTable({
    dropId: v.id('drops'),
    userId: v.id('users'),
  })
    .index('by_drop', ['dropId'])
    .index('by_drop_user', ['dropId', 'userId']),

  comments: defineTable({
    dropId: v.id('drops'),
    userId: v.id('users'),
    body: v.string(),
  }).index('by_drop', ['dropId']),

  waitlist: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    service: v.string(), // 'travel-sep-2026' | 'travel-apr-2027' | 'sourcing-sep-2026' | 'sourcing-apr-2027'
  })
    .index('by_email', ['email'])
    .index('by_service', ['service']),

  // ── Audit log (SOC2) ───────────────────────────────────────────────────────
  // Immutable by design — no public update or delete mutations exist.
  // Written only via internal.audit.write (server-side only, client-inaccessible).
  // Snapshots actor email + role so records remain accurate after user changes.
  auditLogs: defineTable({
    // Actor — snapshotted so records survive user deletion or role changes
    actorId: v.id('users'),
    actorEmail: v.string(),
    actorRole: v.string(),

    // Action — structured as "resource.action" e.g. "drops.create"
    action: v.string(),
    resource: v.string(),

    // Target — what was acted on
    targetId: v.optional(v.string()),
    targetLabel: v.optional(v.string()),

    // Outcome
    outcome: outcomeValidator,
    severity: severityValidator,

    // Extra context
    metadata: v.optional(v.any()),
  })
    .index('by_actor', ['actorId'])
    .index('by_resource', ['resource'])
    .index('by_action', ['action'])
    .index('by_severity', ['severity'])
    .index('by_outcome', ['outcome'])
    .index('by_resource_action', ['resource', 'action']),
})
