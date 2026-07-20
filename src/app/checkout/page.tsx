'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAction, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import styles from './checkout.module.css'

const VALID_PLANS = new Set(['monthly', 'quarterly', 'semiannual', 'yearly'])
type Plan = 'monthly' | 'quarterly' | 'semiannual' | 'yearly'

function CheckoutInner() {
  const createCheckout = useAction(api.stripe.createCheckoutSession)
  const params = useSearchParams()
  const me = useQuery(api.users.getMe)
  const called = useRef(false)

  useEffect(() => {
    // Wait until Convex identity resolves (undefined = still loading)
    if (me === undefined) return
    // If somehow no user record yet, wait — ensureUser runs in /redirect
    if (me === null) return
    if (called.current) return
    called.current = true

    const raw = params.get('plan') ?? 'monthly'
    const plan: Plan = VALID_PLANS.has(raw) ? (raw as Plan) : 'monthly'

    createCheckout({ plan })
      .then((url) => { window.location.href = url })
      .catch(() => { window.location.href = '/?error=checkout' })
  }, [me, createCheckout, params])

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

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000' }} />}>
      <CheckoutInner />
    </Suspense>
  )
}
