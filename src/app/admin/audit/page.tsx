'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { formatDate } from '@/lib/utils'
import styles from '../overview.module.css'
import aStyles from './audit.module.css'

type Severity = 'info' | 'warning' | 'critical'

const SEVERITY_OPTS: { value: Severity | ''; label: string }[] = [
  { value: '', label: 'All severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'warning', label: 'Warning' },
  { value: 'info', label: 'Info' },
]

export default function AdminAuditPage() {
  const [severity, setSeverity] = useState<Severity | ''>('')

  const logs = useQuery(api.stats.auditLogs, {
    severity: severity || undefined,
  })

  return (
    <div className={styles.page}>
      <div className={aStyles.header}>
        <h1 className={styles.title}>Audit Log</h1>
        <select
          className={`input ${aStyles.filter}`}
          value={severity}
          onChange={(e) => setSeverity(e.target.value as Severity | '')}
        >
          {SEVERITY_OPTS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.section}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Target</th>
                <th>Severity</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {logs === undefined ? (
                <tr><td colSpan={7} className={styles.loading}>Loading…</td></tr>
              ) : logs === null ? (
                <tr><td colSpan={7} className={styles.loading}>Role not set — go to Convex dashboard and set your role to admin.</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className={styles.loading}>No audit events found.</td></tr>
              ) : logs.map((log) => (
                <tr key={log._id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(log._creationTime)}</td>
                  <td className={styles.tdName}>{log.actorEmail}</td>
                  <td><code className={aStyles.code}>{log.action}</code></td>
                  <td>{log.resource}</td>
                  <td className={aStyles.target}>{log.targetLabel ?? '—'}</td>
                  <td>
                    <span className={
                      log.severity === 'critical' ? aStyles.critical :
                      log.severity === 'warning' ? aStyles.warning : aStyles.info
                    }>
                      {log.severity}
                    </span>
                  </td>
                  <td>
                    <span className={log.outcome === 'success' ? styles.statusActive : styles.statusInactive}>
                      {log.outcome}
                    </span>
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
