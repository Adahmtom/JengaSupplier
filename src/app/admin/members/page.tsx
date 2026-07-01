'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import { formatDate } from '@/lib/utils'
import styles from '../overview.module.css'
import mStyles from './members.module.css'

type Role = 'super_admin' | 'admin' | 'moderator' | 'member'
const ADMIN_ROLES: Role[] = ['super_admin', 'admin', 'moderator']
const ALL_ROLES: Role[] = ['super_admin', 'admin', 'moderator', 'member']

export default function AdminMembersPage() {
  const members = useQuery(api.users.listMembers)
  const setUserRole = useMutation(api.users.setUserRole)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'members' | 'team'>('members')
  const [updating, setUpdating] = useState<string | null>(null)

  const regularMembers = members?.filter((m) => m.role === 'member') ?? []
  const teamMembers = members?.filter((m) => (ADMIN_ROLES as string[]).includes(m.role)) ?? []

  const list = tab === 'members' ? regularMembers : teamMembers
  const filtered = list.filter((m) =>
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

  const isLoading = members === undefined

  return (
    <div className={styles.page}>
      <div className={mStyles.header}>
        <div>
          <h1 className={styles.title}>
            {tab === 'members' ? 'Members' : 'Team'}
          </h1>
          {!isLoading && members !== null && (
            <p className={mStyles.count}>
              {tab === 'members'
                ? `${regularMembers.length} subscriber${regularMembers.length !== 1 ? 's' : ''}`
                : `${teamMembers.length} team member${teamMembers.length !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>
        <input
          className={`input ${mStyles.search}`}
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className={mStyles.tabs}>
        <button
          className={`${mStyles.tab} ${tab === 'members' ? mStyles.tabActive : ''}`}
          onClick={() => { setTab('members'); setSearch('') }}
        >
          👥 Members
          {!isLoading && members !== null && (
            <span className={mStyles.badge}>{regularMembers.length}</span>
          )}
        </button>
        <button
          className={`${mStyles.tab} ${tab === 'team' ? mStyles.tabActive : ''}`}
          onClick={() => { setTab('team'); setSearch('') }}
        >
          🛡 Team
          {!isLoading && members !== null && (
            <span className={mStyles.badge}>{teamMembers.length}</span>
          )}
        </button>
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
                {tab === 'members' && <th>Sub Status</th>}
                {tab === 'members' && <th>Next Billing</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={tab === 'members' ? 6 : 4} className={styles.loading}>Loading…</td></tr>
              ) : members === null ? (
                <tr><td colSpan={tab === 'members' ? 6 : 4} className={styles.loading}>Role not set — go to Convex dashboard and set your role to admin.</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={tab === 'members' ? 6 : 4} className={styles.loading}>
                  {search ? 'No results found.' : tab === 'members' ? 'No members yet.' : 'No team members yet.'}
                </td></tr>
              ) : filtered.map((member) => (
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
                      {ALL_ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td>{formatDate(member._creationTime)}</td>
                  {tab === 'members' && (
                    <td>
                      {member.subscription ? (
                        <span className={member.subscription.status === 'active' ? styles.statusActive : styles.statusInactive}>
                          ● {member.subscription.status}
                        </span>
                      ) : (
                        <span className={styles.statusInactive}>● none</span>
                      )}
                    </td>
                  )}
                  {tab === 'members' && (
                    <td>
                      {member.subscription?.currentPeriodEnd
                        ? formatDate(member.subscription.currentPeriodEnd)
                        : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
