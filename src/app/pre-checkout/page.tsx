'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import styles from '../checkout/checkout.module.css'

function PreCheckoutInner() {
  const createGuestCheckout = useAction(api.stripe.createGuestCheckoutSession)
  const params = useSearchParams()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const raw = params.get('plan')
    const plan: 'monthly' | 'yearly' = raw === 'yearly' ? 'yearly' : 'monthly'

    try { localStorage.setItem('jenga_plan', plan) } catch {}

    createGuestCheckout({ plan })
      .then((url) => { window.location.href = url })
      .catch(() => { window.location.href = '/?canceled=1' })
  }, [createGuestCheckout, params])

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.spinner} aria-hidden="true" />
        <p className={styles.eyebrow}>✦ China Business Vault by Belle Jones</p>
        <h1 className={styles.heading}>Préparation du paiement…</h1>
        <p className={styles.sub}>Vous allez être redirigé vers le paiement sécurisé.</p>
      </div>
    </div>
  )
}

export default function PreCheckoutPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000' }} />}>
      <PreCheckoutInner />
    </Suspense>
  )
}
