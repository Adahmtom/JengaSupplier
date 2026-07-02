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
  const [inviteLink, setInviteLink] = useState<{ email: string; url: string } | null>(null)

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
    <>
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
                <tr key={member._id} style={member.isOrphaned ? { opacity: 0.7 } : undefined}>
                  <td className={styles.tdName}>
                    {member.name ?? '—'}
                    {member.isOrphaned && (
                      <span title="Paid on Stripe but never completed sign-up" style={{ marginLeft: 6, fontSize: 10, color: 'var(--color-gold)', border: '1px solid var(--color-gold)', borderRadius: 4, padding: '1px 5px', letterSpacing: '0.05em' }}>
                        no account
                      </span>
                    )}
                  </td>
                  <td>{member.isOrphaned ? member.subscription?.stripeCustomerId ?? '—' : member.email}</td>
                  <td>
                    {member.isOrphaned ? (
                      <OrphanInviteButton
                        stripeCustomerId={member.subscription?.stripeCustomerId ?? ''}
                        onGenerated={(email, url) => setInviteLink({ email, url })}
                      />
                    ) : (
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
                    )}
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

    {/* ── Invite link modal ── */}
    {inviteLink && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-xl)', padding: '2rem', maxWidth: 520, width: '100%' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Invitation générée</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
            Envoyez ce lien à <strong>{inviteLink.email}</strong>. Il est à usage unique et expire dans 7 jours.
          </p>
          <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all', marginBottom: 16, color: 'var(--color-text)' }}>
            {inviteLink.url}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, fontSize: 12 }}
              onClick={() => navigator.clipboard.writeText(inviteLink.url)}
            >
              📋 Copier le lien
            </button>
            <button
              style={{ fontSize: 12, padding: '8px 16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              onClick={() => setInviteLink(null)}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

function OrphanInviteButton({
  stripeCustomerId,
  onGenerated,
}: {
  stripeCustomerId: string
  onGenerated: (email: string, url: string) => void
}) {
  const createInvite = useMutation(api.invites.createInvite)
  const [loading, setLoading] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [showInput, setShowInput] = useState(false)

  async function handleGenerate() {
    if (!emailInput.trim()) return
    setLoading(true)
    try {
      const token = await createInvite({ email: emailInput.trim(), stripeCustomerId })
      const url = `${window.location.origin}/join?token=${token}`
      onGenerated(emailInput.trim(), url)
      setShowInput(false)
      setEmailInput('')
    } finally {
      setLoading(false)
    }
  }

  if (!showInput) {
    return (
      <button
        className="btn btn-primary"
        style={{ fontSize: 10, padding: '4px 10px' }}
        onClick={() => setShowInput(true)}
      >
        ✉ Inviter
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <input
        className="input"
        style={{ fontSize: 11, padding: '4px 8px', width: 160 }}
        placeholder="Email du client"
        value={emailInput}
        onChange={(e) => setEmailInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
        autoFocus
      />
      <button
        className="btn btn-primary"
        style={{ fontSize: 10, padding: '4px 8px' }}
        disabled={loading || !emailInput.trim()}
        onClick={handleGenerate}
      >
        {loading ? '…' : '→'}
      </button>
      <button
        style={{ fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
        onClick={() => setShowInput(false)}
      >
        ✕
      </button>
    </div>
  )
}
