'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { DropCard } from '@/components/portal/DropCard'
import { useLang } from '@/lib/i18n'
import styles from '../feed/feed.module.css'

export default function WarehouseVideosPage() {
  const drops = useQuery(api.drops.listDrops, { alertsOnly: true })
  const { lang } = useLang()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {lang === 'fr' ? 'Vidéos Entrepôts' : 'Warehouse Videos'}
        </h1>
        {drops && (
          <span className="badge badge-gold" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            🎥 {drops.length} {lang === 'fr' ? 'vidéo' : 'video'}{drops.length !== 1 ? 's' : ''}
          </span>
        )}
      </header>

      {drops === undefined && (
        <div className={styles.feed}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      )}

      {drops === null && (
        <div className={styles.empty}>
          <p>🔒 {lang === 'fr' ? 'Abonnement requis.' : 'Subscription required.'}</p>
          <a href="/#pricing" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.6rem 1.4rem', background: 'var(--color-gold)', color: '#fff', borderRadius: '8px', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
            {lang === 'fr' ? 'Voir les plans →' : 'See plans →'}
          </a>
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
