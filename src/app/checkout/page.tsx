'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAction, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import styles from './checkout.module.css'

function CheckoutInner() {
  const createCheckout = useAction(api.stripe.createCheckoutSession)
  const params = useSearchParams()
  const me = useQuery(api.users.getMe)
  const called = useRef(false)
  const [status, setStatus] = useState<'waiting' | 'redirecting'>('waiting')

  useEffect(() => {
    if (me === undefined || me === null) return
    if (called.current) return
    called.current = true

    setStatus('redirecting')

    const paramPlan = params.get('plan')
    let plan: 'monthly' | 'yearly' | 'quarterly' | 'semiannual' = 'monthly'
    if (paramPlan === 'yearly' || paramPlan === 'quarterly' || paramPlan === 'semiannual') {
      plan = paramPlan
    } else {
      try {
        const stored = localStorage.getItem('jenga_plan')
        if (stored === 'yearly' || stored === 'quarterly' || stored === 'semiannual') {
          plan = stored as 'yearly' | 'quarterly' | 'semiannual'
        }
        localStorage.removeItem('jenga_plan')
      } catch {}
    }

    createCheckout({ plan })
      .then((url) => { window.location.href = url })
      .catch(() => { window.location.href = '/?error=checkout' })
  }, [me, createCheckout, params])

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.spinner} aria-hidden="true" />
        <p className={styles.eyebrow}>✦ China Business Vault by Belle Jones</p>
        <h1 className={styles.heading}>
          {status === 'waiting' ? 'Création de votre compte…' : 'Préparation du paiement…'}
        </h1>
        <p className={styles.sub}>
          {status === 'waiting'
            ? 'Veuillez patienter un instant.'
            : 'Vous allez être redirigé vers le paiement sécurisé.'}
        </p>
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
