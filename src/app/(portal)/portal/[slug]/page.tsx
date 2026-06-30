'use client'

import { use } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { DropCard } from '@/components/portal/DropCard'
import styles from '../../feed/feed.module.css'

export default function PortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const portals = useQuery(api.portals.listPortals)
  const portal = portals?.find((p) => p.slug === slug)

  const drops = useQuery(
    api.drops.listDrops,
    portal ? { portalId: portal._id } : 'skip',
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {portal ? `${portal.emoji} ${portal.name}` : 'Loading…'}
        </h1>
        {drops && (
          <span className="badge badge-gold">{drops.length} vendor{drops.length !== 1 ? 's' : ''}</span>
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
          <p>No vendors in this category yet.</p>
        </div>
      )}

      {drops && drops.length > 0 && (
        <div className={styles.feed}>
          {drops.map((drop) => (
            <DropCard key={drop._id} drop={drop} portalName={portal?.name} />
          ))}
        </div>
      )}
    </div>
  )
}
