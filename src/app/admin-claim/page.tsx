'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import styles from './admin-claim.module.css'

const MAX_RETRIES = 8
const RETRY_DELAY = 1500

function AdminClaimInner() {
  const router = useRouter()
  const params = useSearchParams()
  const claimSuperAdmin = useMutation(api.admin.claimSuperAdmin)

  const [status, setStatus] = useState<'claiming' | 'success' | 'error'>('claiming')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // Read from sessionStorage (set by admin-signup after server-side verification).
    // Fall back to URL param for backward compatibility.
    const code = sessionStorage.getItem('adminClaimCode') ?? params.get('code') ?? ''
    sessionStorage.removeItem('adminClaimCode')
    let cancelled = false
    let attempt = 0

    async function tryClaim() {
      if (cancelled) return
      attempt++
      try {
        await claimSuperAdmin({ inviteCode: code })
        if (!cancelled) {
          setStatus('success')
          setTimeout(() => router.replace('/admin'), 1500)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong'
        if (!cancelled && attempt < MAX_RETRIES && msg.toLowerCase().includes('not authenticated')) {
          setTimeout(tryClaim, RETRY_DELAY)
        } else if (!cancelled) {
          setStatus('error')
          setErrorMsg(msg)
        }
      }
    }

    const t = setTimeout(tryClaim, 2000)
    return () => { cancelled = true; clearTimeout(t) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brandMark}>JS</div>

        {status === 'claiming' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.msg}>Activating admin access…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.msg}>Super admin granted — redirecting…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className={styles.errorIcon}>✕</div>
            <p className={styles.msgError}>{errorMsg}</p>
            <a href="/admin-signup" className={`btn btn-primary ${styles.retry}`}>
              Try again
            </a>
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminClaimPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000' }} />}>
      <AdminClaimInner />
    </Suspense>
  )
}
