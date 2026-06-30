// ── Resources ─────────────────────────────────────────────────────────────────
export const RESOURCES = {
  DROPS: 'drops',
  PORTALS: 'portals',
  MEMBERS: 'members',
  SUBSCRIPTIONS: 'subscriptions',
  AUDIT_LOGS: 'audit_logs',
  SETTINGS: 'settings',
} as const

export type Resource = typeof RESOURCES[keyof typeof RESOURCES]

// ── Actions ───────────────────────────────────────────────────────────────────
export const ACTIONS = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  PUBLISH: 'publish',
  MANAGE: 'manage',
} as const

export type Action = typeof ACTIONS[keyof typeof ACTIONS]

// ── Permission matrix ─────────────────────────────────────────────────────────
// Scoped by: Role (team) × Resource (data type) × Action
//
//   super_admin  All permissions on all resources
//   admin        Content + portal management, read members/billing, read audit
//   moderator    Create/edit drops only — no member or settings access
//   member       Read drops + own subscription only
//
type PermissionMatrix = Record<string, Partial<Record<Resource, Action[]>>>

const MATRIX: PermissionMatrix = {
  super_admin: {
    drops:         ['read', 'create', 'update', 'delete', 'publish'],
    portals:       ['read', 'create', 'update', 'delete', 'manage'],
    members:       ['read', 'manage', 'delete'],
    subscriptions: ['read', 'manage'],
    audit_logs:    ['read'],
    settings:      ['read', 'manage'],
  },
  admin: {
    drops:         ['read', 'create', 'update', 'delete', 'publish'],
    portals:       ['read', 'create', 'update'],
    members:       ['read'],
    subscriptions: ['read'],
    audit_logs:    ['read'],
    settings:      ['read'],
  },
  moderator: {
    drops:         ['read', 'create', 'update'],
    portals:       ['read'],
    members:       [],
    subscriptions: [],
    audit_logs:    [],
    settings:      [],
  },
  member: {
    drops:         ['read'],
    portals:       ['read'],
    members:       [],
    subscriptions: ['read'],
    audit_logs:    [],
    settings:      [],
  },
}

export function hasPermission(role: string, resource: Resource, action: Action): boolean {
  const rolePerms = MATRIX[role]
  if (!rolePerms) return false
  const allowed = rolePerms[resource]
  if (!allowed) return false
  return (allowed as string[]).includes(action)
}

// Roles that have any admin-level access (can reach admin dashboard)
export const ADMIN_ROLES = new Set(['super_admin', 'admin', 'moderator'])

// Roles that can manage other members
export const MEMBER_MANAGEMENT_ROLES = new Set(['super_admin'])

// Roles that can read audit logs
export const AUDIT_READ_ROLES = new Set(['super_admin', 'admin'])
