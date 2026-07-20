'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import styles from '../checkout/checkout.module.css'

// Old guest pre-checkout route — redirects to the new signup-first flow.
function PreCheckoutRedirect() {
  const params = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const plan = params.get('plan') ?? 'monthly'
    router.replace(`/sign-up?plan=${plan}`)
  }, [params, router])

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.spinner} aria-hidden="true" />
        <p className={styles.eyebrow}>✦ China Business Vault by Belle Jones</p>
        <h1 className={styles.heading}>Redirection…</h1>
      </div>
    </div>
  )
}

export default function PreCheckoutPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000' }} />}>
      <PreCheckoutRedirect />
    </Suspense>
  )
}
