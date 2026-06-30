'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import { formatDate } from '@/lib/utils'
import styles from '../overview.module.css'
import mStyles from './members.module.css'

type Role = 'super_admin' | 'admin' | 'moderator' | 'member'
const ROLES: Role[] = ['super_admin', 'admin', 'moderator', 'member']

export default function AdminMembersPage() {
  const members = useQuery(api.users.listMembers)
  const setUserRole = useMutation(api.users.setUserRole)
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const filtered = members?.filter((m) =>
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    (m.name ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  async function handleRoleChange(userId: Id<'users'>, role: Role) {
    setUpdating(userId)
    try {
      await setUserRole({ targetUserId: userId, role })
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className={styles.page}>
      <div className={mStyles.header}>
        <h1 className={styles.title}>Members</h1>
        <input
          className={`input ${mStyles.search}`}
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.section}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Sub Status</th>
                <th>Next Billing</th>
              </tr>
            </thead>
            <tbody>
              {members === undefined ? (
                <tr><td colSpan={6} className={styles.loading}>Loading…</td></tr>
              ) : members === null ? (
                <tr><td colSpan={6} className={styles.loading}>Role not set — go to Convex dashboard and set your role to admin.</td></tr>
              ) : (filtered ?? []).length === 0 ? (
                <tr><td colSpan={6} className={styles.loading}>No members found.</td></tr>
              ) : (filtered ?? []).map((member) => (
                <tr key={member._id}>
                  <td className={styles.tdName}>{member.name ?? '—'}</td>
                  <td>{member.email}</td>
                  <td>
                    <select
                      className={mStyles.roleSelect}
                      value={member.role}
                      disabled={updating === member._id}
                      onChange={(e) => handleRoleChange(member._id, e.target.value as Role)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td>{formatDate(member._creationTime)}</td>
                  <td>
                    {member.subscription ? (
                      <span className={member.subscription.status === 'active' ? styles.statusActive : styles.statusInactive}>
                        ● {member.subscription.status}
                      </span>
                    ) : (
                      <span className={styles.statusInactive}>● none</span>
                    )}
                  </td>
                  <td>
                    {member.subscription?.currentPeriodEnd
                      ? formatDate(member.subscription.currentPeriodEnd)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
