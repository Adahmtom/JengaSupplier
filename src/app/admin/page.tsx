'use client'

import Link from 'next/link'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import styles from './overview.module.css'

export default function AdminOverviewPage() {
  const stats = useQuery(api.stats.adminStats)
  const members = useQuery(api.users.listMembers)
  const logs = useQuery(api.stats.auditLogs, {})

  if (stats === null || members === null) {
    return (
      <div className={styles.page}>
        <div className={styles.accessDenied}>
          <p className={styles.accessIcon}>🔒</p>
          <p className={styles.accessTitle}>Role not configured</p>
          <p className={styles.accessSub}>
            Your Convex user role needs to be set to <code>super_admin</code> or <code>admin</code>.
            Go to <strong>Convex Dashboard → Data → users</strong>, find your record, and change the <code>role</code> field.
          </p>
        </div>
      </div>
    )
  }

  const recentMembers = members?.slice(0, 8) ?? []
  const recentLogs = logs?.slice(0, 6) ?? []

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Overview</h1>
      </div>

      {/* ── Row 1: Core KPIs ── */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Active Members"
          value={stats?.activeMembers ?? '—'}
          sub={`↑ ${stats?.newThisWeek ?? 0} this week`}
          good
        />
        <StatCard
          label="MRR"
          value={stats ? formatCurrency(stats.mrr) : '—'}
          sub={`ARR ${stats ? formatCurrency(stats.arr) : '—'}`}
          good
        />
        <StatCard
          label="Total Members"
          value={stats?.totalMembers ?? '—'}
          sub={`${stats?.newThisMonth ?? 0} joined this month`}
          good
        />
        <StatCard
          label="Published Vendors"
          value={stats?.publishedDrops ?? '—'}
          sub={`${stats?.dropsThisWeek ?? 0} added this week`}
          good
        />
        <StatCard
          label="Scam Alerts"
          value={stats?.alertDrops ?? '—'}
          sub="Active warnings"
          good={false}
        />
        <StatCard
          label="Churn Rate"
          value={stats ? `${stats.churnRate}%` : '—'}
          sub={`${stats?.subCanceled ?? 0} canceled`}
          good={false}
        />
      </div>

      {/* ── Row 2: Sub breakdown + Category leaderboard ── */}
      <div className={styles.twoCol}>
        {/* Subscription breakdown */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className="label">Subscription Breakdown</p>
          </div>
          <div className={styles.subBreakdown}>
            <SubRow label="Active" count={stats?.subActive} color="var(--color-success)" />
            <SubRow label="Trialing" count={stats?.subTrialing} color="var(--color-gold)" />
            <SubRow label="Past due" count={stats?.subPastDue} color="var(--color-alert-text)" />
            <SubRow label="Canceled" count={stats?.subCanceled} color="var(--color-text-subtle)" />
          </div>
          {stats && (
            <div className={styles.subTotal}>
              <span>Total subs</span>
              <strong>{stats.subActive + stats.subTrialing + stats.subPastDue + stats.subCanceled}</strong>
            </div>
          )}
        </div>

        {/* Top categories */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className="label">Top Categories by Vendors</p>
            <Link href="/admin/categories" className={styles.sectionLink}>Manage →</Link>
          </div>
          {stats?.categoryBreakdown && stats.categoryBreakdown.length > 0 ? (
            <div className={styles.catBreakdown}>
              {stats.categoryBreakdown.map((c) => (
                <div key={c.name} className={styles.catRow}>
                  <span className={styles.catEmoji}>{c.emoji}</span>
                  <span className={styles.catName}>{c.name}</span>
                  <div className={styles.catBarWrap}>
                    <div
                      className={styles.catBar}
                      style={{ width: `${Math.min(100, (c.count / (stats.categoryBreakdown[0]?.count || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className={styles.catCount}>{c.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyNote}>No vendors yet. <Link href="/admin/new">Add one →</Link></p>
          )}
        </div>
      </div>

      {/* ── Row 3: Quick actions ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <p className="label">Quick Actions</p>
        </div>
        <div className={styles.quickActions}>
          <Link href="/admin/new" className={styles.quickBtn}>
            <span className={styles.quickIcon}>✦</span>
            <span className={styles.quickLabel}>New Vendor</span>
          </Link>
          <Link href="/admin/warehouse" className={styles.quickBtn}>
            <span className={styles.quickIcon}>🎥</span>
            <span className={styles.quickLabel}>Warehouse Video</span>
          </Link>
          <Link href="/admin/categories" className={styles.quickBtn}>
            <span className={styles.quickIcon}>🗂</span>
            <span className={styles.quickLabel}>Manage Categories</span>
          </Link>
          <Link href="/admin/members" className={styles.quickBtn}>
            <span className={styles.quickIcon}>👥</span>
            <span className={styles.quickLabel}>View Members</span>
          </Link>
          <Link href="/admin/drops" className={styles.quickBtn}>
            <span className={styles.quickIcon}>📁</span>
            <span className={styles.quickLabel}>All Vendors</span>
          </Link>
          <Link href="/admin/audit" className={styles.quickBtn}>
            <span className={styles.quickIcon}>📋</span>
            <span className={styles.quickLabel}>Audit Log</span>
          </Link>
          <Link href="/admin/community" className={styles.quickBtn}>
            <span className={styles.quickIcon}>💬</span>
            <span className={styles.quickLabel}>Community</span>
          </Link>
          <Link href="/admin/waitlist" className={styles.quickBtn}>
            <span className={styles.quickIcon}>📊</span>
            <span className={styles.quickLabel}>Waitlist</span>
          </Link>
          <Link href="/feed" className={styles.quickBtn}>
            <span className={styles.quickIcon}>👁</span>
            <span className={styles.quickLabel}>Member View</span>
          </Link>
        </div>
      </div>

      {/* ── Row 4: Recent members ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <p className="label">Recent Members</p>
          <Link href="/admin/members" className={styles.sectionLink}>View all →</Link>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Next Billing</th>
              </tr>
            </thead>
            <tbody>
              {!members && (
                <tr><td colSpan={5} className={styles.loading}>Loading…</td></tr>
              )}
              {recentMembers.map((member) => (
                <tr key={member._id}>
                  <td className={styles.tdName}>{member.name ?? '—'}</td>
                  <td>{member.email}</td>
                  <td>{formatDate(member._creationTime)}</td>
                  <td>
                    <span className={member.subscription?.status === 'active' ? styles.statusActive : styles.statusInactive}>
                      ● {member.subscription?.status ?? 'none'}
                    </span>
                  </td>
                  <td>{member.subscription?.currentPeriodEnd ? formatDate(member.subscription.currentPeriodEnd) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Row 5: Recent audit events ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <p className="label">Recent Activity</p>
          <Link href="/admin/audit" className={styles.sectionLink}>Full log →</Link>
        </div>
        {recentLogs.length === 0 ? (
          <p className={styles.emptyNote}>No audit events yet.</p>
        ) : (
          <div className={styles.auditList}>
            {recentLogs.map((log) => (
              <div key={log._id} className={styles.auditRow}>
                <span className={`${styles.auditDot} ${
                  log.severity === 'critical' ? styles.dotCritical :
                  log.severity === 'warning'  ? styles.dotWarning : styles.dotInfo
                }`} />
                <div className={styles.auditBody}>
                  <span className={styles.auditAction}>{log.action}</span>
                  {log.targetLabel && <span className={styles.auditTarget}> · {log.targetLabel}</span>}
                </div>
                <span className={styles.auditActor}>{log.actorEmail}</span>
                <span className={styles.auditTime}>{formatDate(log._creationTime)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, good }: {
  label: string
  value: string | number
  sub: string
  good: boolean
}) {
  return (
    <div className={styles.statCard}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
      <p className={`${styles.statDelta} ${good ? styles.deltaGood : styles.deltaBad}`}>{sub}</p>
    </div>
  )
}

function SubRow({ label, count, color }: { label: string; count?: number; color: string }) {
  return (
    <div className={styles.subRow}>
      <span className={styles.subDot} style={{ background: color }} />
      <span className={styles.subLabel}>{label}</span>
      <span className={styles.subCount}>{count ?? '—'}</span>
    </div>
  )
}
