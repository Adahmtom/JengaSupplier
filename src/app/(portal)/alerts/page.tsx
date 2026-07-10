'use client'

import Link from 'next/link'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { DropCard } from '@/components/portal/DropCard'
import { useLang } from '@/lib/i18n'
import styles from '../feed/feed.module.css'

export default function WarehouseVideosPage() {
  const drops = useQuery(api.drops.listDrops, { alertsOnly: true })
  const me = useQuery(api.users.getMe)
  const { lang } = useLang()

  const isAdmin = me?.role === 'super_admin' || me?.role === 'admin' || me?.role === 'moderator'

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {lang === 'fr' ? 'Vidéos Entrepôts' : 'Warehouse Videos'}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {drops && (
            <span className="badge badge-gold" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              🎥 {drops.length} {lang === 'fr' ? 'vidéo' : 'video'}{drops.length !== 1 ? 's' : ''}
            </span>
          )}
          {isAdmin && (
            <Link
              href="/admin/new"
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              🎥 {lang === 'fr' ? 'Ajouter une vidéo' : 'Upload video'}
            </Link>
          )}
        </div>
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
          <p>
            {lang === 'fr'
              ? 'Aucune vidéo d\'entrepôt pour l\'instant. Revenez bientôt.'
              : 'No warehouse videos yet. Check back soon.'}
          </p>
        </div>
      )}

      {drops && drops.length > 0 && (
        <div className={styles.feed}>
          {drops.map((drop) => (
            <DropCard key={drop._id} drop={drop} portalName="Warehouse Video" />
          ))}
        </div>
      )}
    </div>
  )
}
