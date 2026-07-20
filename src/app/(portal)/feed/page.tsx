'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useAction } from 'convex/react'
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
  const activateSubscription = useAction(api.stripe.activateGuestSubscription)
  const me = useQuery(api.users.getMe)
  const activated = useRef(false)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchParams = useSearchParams()

  // Persist session_id from URL to localStorage immediately on mount
  useEffect(() => {
    const urlSessionId = searchParams.get('session_id')
    if (urlSessionId) {
      try { localStorage.setItem('jenga_stripe_session', urlSessionId) } catch {}
    }
  }, [searchParams])

  // Activate subscription — retries every 4s up to 8 times if it fails
  useEffect(() => {
    if (activated.current) return

    let sessionId = searchParams.get('session_id') ?? ''
    if (!sessionId) {
      try { sessionId = localStorage.getItem('jenga_stripe_session') ?? '' } catch {}
    }
    if (!sessionId) {
      try { sessionId = sessionStorage.getItem('jenga_stripe_session') ?? '' } catch {}
    }
    if (!sessionId) return

    let attempts = 0
    const MAX_ATTEMPTS = 8

    const tryActivate = () => {
      // Wait until we have a user identity (me !== undefined means query resolved)
      if (me === undefined) {
        retryTimer.current = setTimeout(tryActivate, 1000)
        return
      }
      if (attempts >= MAX_ATTEMPTS) return
      attempts++
      activateSubscription({ sessionId })
        .then(() => {
          activated.current = true
          try { localStorage.removeItem('jenga_stripe_session') } catch {}
          try { sessionStorage.removeItem('jenga_stripe_session') } catch {}
        })
        .catch(() => {
          // Retry after 4s
          retryTimer.current = setTimeout(tryActivate, 4000)
        })
    }

    tryActivate()
    return () => { if (retryTimer.current) clearTimeout(retryTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me])

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

      {/* Subscription syncing — payment received but not yet active in Convex */}
      {noSubscription && <SubscriptionSyncing />}

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

function SubscriptionSyncing() {
  const [dots, setDots] = useState('.')
  useEffect(() => {
    const id = setInterval(() => setDots((d) => d.length >= 3 ? '.' : d + '.'), 600)
    return () => clearInterval(id)
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
