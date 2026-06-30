'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import styles from './admin-claim.module.css'

const MAX_RETRIES = 8
const RETRY_DELAY = 1500 // ms between retries

export default function AdminClaimPage() {
  const router = useRouter()
  const params = useSearchParams()
  const claimSuperAdmin = useMutation(api.admin.claimSuperAdmin)

  const [status, setStatus] = useState<'claiming' | 'success' | 'error'>('claiming')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const code = params.get('code') ?? ''
    let cancelled = false
    let attempt = 0

    async function tryClam() {
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
        // Retry on auth errors — JWT may not be hydrated yet
        if (!cancelled && attempt < MAX_RETRIES && msg.toLowerCase().includes('not authenticated')) {
          setTimeout(tryClam, RETRY_DELAY)
        } else if (!cancelled) {
          setStatus('error')
          setErrorMsg(msg)
        }
      }
    }

    // Initial delay to allow Convex JWT to hydrate after Clerk redirect
    const t = setTimeout(tryClam, 2000)
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
