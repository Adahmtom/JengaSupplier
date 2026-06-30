'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { DropCard } from '@/components/portal/DropCard'
import styles from '../feed/feed.module.css'

export default function AlertsPage() {
  const drops = useQuery(api.drops.listDrops, { alertsOnly: true })

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Scam Alerts</h1>
        {drops && (
          <span className="badge badge-alert">⚠ {drops.length} active</span>
        )}
      </header>

      {!drops && (
        <div className={styles.feed}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      )}

      {drops?.length === 0 && (
        <div className={styles.empty}>
          <p>No scam alerts at the moment. Stay safe out there.</p>
        </div>
      )}

      {drops && drops.length > 0 && (
        <div className={styles.feed}>
          {drops.map((drop) => (
            <DropCard key={drop._id} drop={drop} portalName="Scam Alert" />
          ))}
        </div>
      )}
    </div>
  )
}
