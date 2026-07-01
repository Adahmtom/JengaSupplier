'use client'

import { use } from 'react'
import Link from 'next/link'
import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { DropCard } from '@/components/portal/DropCard'
import styles from '../../feed/feed.module.css'
import portalStyles from './portal.module.css'

export default function PortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const portal = useQuery(api.portals.getPortalBySlug, { slug })

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

      {portal && (
        <Link href="/community" className={portalStyles.communityCta}>
          <span className={portalStyles.communityCtaIcon}>💬</span>
          <div className={portalStyles.communityCtaText}>
            <strong>Join the {portal.name} community</strong>
            <span>Ask questions, share tips, connect with other members</span>
          </div>
          <span className={portalStyles.communityCtaArrow}>→</span>
        </Link>
      )}

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
