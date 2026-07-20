'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { DropCard } from '@/components/portal/DropCard'
import { useLang } from '@/lib/i18n'
import styles from './feed.module.css'

export default function FeedPage() {
  const drops = useQuery(api.drops.listDrops, {})
  const portals = useQuery(api.portals.listPortals)
  const [search, setSearch] = useState('')
  const [activePortal, setActivePortal] = useState<string | null>(null)
  const { t } = useLang()
  const searchParams = useSearchParams()

  const portalMap = useMemo(
    () => new Map(portals?.map((p) => [p._id, p]) ?? []),
    [portals],
  )

  const filtered = useMemo(() => {
    if (!drops) return []
    let result = drops
    if (activePortal) result = result.filter((d) => d.portalId === activePortal)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.body.toLowerCase().includes(q),
      )
    }
    return result
  }, [drops, activePortal, search])

  const newToday = useMemo(() => {
    if (!drops) return 0
    const oneDayAgo = Date.now() - 86_400_000
    return drops.filter((d) => d._creationTime > oneDayAgo).length
  }, [drops])

  const isLoading = drops === undefined
  const noSubscription = drops === null
  // welcome=1 means user just paid — webhook may not have landed yet
  const justPaid = searchParams.get('welcome') === '1'

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t.feedTitle}</h1>
          {drops && (
            <p className={styles.subtitle}>
              {drops.length} {t.feedSuppliers} · {newToday} {t.feedNew}
            </p>
          )}
        </div>
        {newToday > 0 && (
          <span className="badge badge-live">● {newToday} {t.feedNewBadge}</span>
        )}
      </header>

      {/* Search */}
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon} aria-hidden="true">🔍</span>
        <input
          className={styles.search}
          type="search"
          placeholder={t.feedSearch}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t.feedSearch}
        />
        {search && (
          <button className={styles.clearSearch} onClick={() => setSearch('')} aria-label="Effacer">
            ✕
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className={styles.categories} role="tablist">
        <button
          role="tab"
          aria-selected={activePortal === null}
          className={`${styles.catBtn} ${activePortal === null ? styles.catActive : ''}`}
          onClick={() => setActivePortal(null)}
        >
          {t.feedAll}
        </button>
        {portals?.map((portal) => (
          <button
            key={portal._id}
            role="tab"
            aria-selected={activePortal === portal._id}
            className={`${styles.catBtn} ${activePortal === portal._id ? styles.catActive : ''}`}
            onClick={() => setActivePortal(activePortal === portal._id ? null : portal._id)}
          >
            {portal.emoji} {portal.name}
          </button>
        ))}
      </div>

      {/* Results label */}
      {(search || activePortal) && drops && (
        <p className={styles.resultsLabel}>
          {filtered.length} {filtered.length !== 1 ? t.feedResults_p : t.feedResults}
          {search ? ` ${t.feedFor} "${search}"` : ''}
          {activePortal && portals ? ` ${t.feedIn} ${portalMap.get(activePortal as any)?.name}` : ''}
        </p>
      )}

      {/* No subscription — webhook lag fallback if just paid, else pricing CTA */}
      {noSubscription && (justPaid ? <WebhookLagFallback /> : <NoPlanCTA />)}

      {/* Loading skeletons */}
      {isLoading && (
        <div className={styles.feed}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      )}

      {/* Empty states */}
      {!isLoading && !noSubscription && drops?.length === 0 && (
        <div className={styles.empty}>
          <p className={styles.emptyIcon}>📦</p>
          <p className={styles.emptyText}>{t.feedNoDrops}</p>
        </div>
      )}

      {!isLoading && !noSubscription && drops && drops.length > 0 && filtered.length === 0 && (
        <div className={styles.empty}>
          <p className={styles.emptyIcon}>🔍</p>
          <p className={styles.emptyText}>{t.feedNoResults}</p>
          <button className={styles.clearBtn} onClick={() => { setSearch(''); setActivePortal(null) }}>
            {t.feedReset}
          </button>
        </div>
      )}

      {/* Feed */}
      {!isLoading && filtered.length > 0 && (
        <div className={styles.feed}>
          {filtered.map((drop) => (
            <DropCard
              key={drop._id}
              drop={drop}
              portalName={portalMap.get(drop.portalId as any)?.name}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Shown for max 8s when welcome=1 and webhook hasn't landed yet.
// After 8s, redirects to pricing so the user isn't stuck.
function WebhookLagFallback() {
  const [dots, setDots] = useState('.')
  const redirected = useRef(false)

  useEffect(() => {
    const dotsId = setInterval(() => setDots((d) => (d.length >= 3 ? '.' : d + '.')), 600)
    const timeoutId = setTimeout(() => {
      if (!redirected.current) {
        redirected.current = true
        window.location.href = '/#pricing'
      }
    }, 8000)
    return () => { clearInterval(dotsId); clearTimeout(timeoutId) }
  }, [])

  return (
    <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
      <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✦</p>
      <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-text)' }}>
        Activation de votre accès{dots}
      </p>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: '320px', margin: '0 auto 1.5rem' }}>
        Votre paiement a été confirmé. Votre vault s&apos;ouvre dans quelques secondes.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{ padding: '0.6rem 1.4rem', background: 'var(--color-gold)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
      >
        Actualiser maintenant
      </button>
    </div>
  )
}

function NoPlanCTA() {
  return (
    <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
      <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔒</p>
      <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-text)' }}>
        Abonnement requis
      </p>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: '320px', margin: '0 auto 1.5rem' }}>
        Choisissez un plan pour accéder à plus de 500 fournisseurs vérifiés.
      </p>
      <a
        href="/#pricing"
        style={{ display: 'inline-block', padding: '0.7rem 1.6rem', background: 'var(--color-gold)', color: '#fff', borderRadius: '8px', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}
      >
        Voir les plans →
      </a>
    </div>
  )
}
