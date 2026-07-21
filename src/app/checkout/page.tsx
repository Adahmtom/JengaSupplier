'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAction, useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import styles from './checkout.module.css'

const VALID_PLANS = new Set(['monthly', 'quarterly', 'semiannual', 'yearly'])
type Plan = 'monthly' | 'quarterly' | 'semiannual' | 'yearly'

function readCookiePlan(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)jenga_plan=([^;]+)/)
  return match ? match[1] : null
}

function resolvePlan(params: URLSearchParams): Plan | null {
  // 1. Query param (primary — carried by Clerk's forceRedirectUrl)
  const fromParam = params.get('plan')
  if (fromParam && VALID_PLANS.has(fromParam)) return fromParam as Plan

  // 2. Cookie (survives OAuth redirects and email-verification detours)
  const fromCookie = readCookiePlan()
  if (fromCookie && VALID_PLANS.has(fromCookie)) return fromCookie as Plan

  // 3. localStorage (same-device backup)
  try {
    const fromStorage = localStorage.getItem('jenga_plan')
    if (fromStorage && VALID_PLANS.has(fromStorage)) return fromStorage as Plan
  } catch {}

  return null
}

function CheckoutInner() {
  const createCheckout = useAction(api.stripe.createCheckoutSession)
  const ensureUser = useMutation(api.users.ensureUser)
  const params = useSearchParams()
  const router = useRouter()
  const me = useQuery(api.users.getMe)
  const called = useRef(false)
  const ensured = useRef(false)

  // Checkout lives outside the portal layout, so PortalSidebar never runs.
  // Call ensureUser here so the Convex user record exists before we proceed.
  useEffect(() => {
    if (ensured.current) return
    ensured.current = true
    ensureUser().catch(() => {})
  }, [ensureUser])

  useEffect(() => {
    if (me === undefined) return // still loading
    if (me === null) return      // ensureUser in flight — wait for reactive re-render
    if (called.current) return
    called.current = true

    const plan = resolvePlan(params)
    if (!plan) {
      // No tier found anywhere — send back to pricing
      router.replace('/#pricing')
      return
    }

    // Clear storage now that we're committed to a plan
    try {
      localStorage.removeItem('jenga_plan')
      document.cookie = 'jenga_plan=; path=/; max-age=0'
    } catch {}

    createCheckout({ plan })
      .then((url) => { window.location.href = url })
      .catch(() => { window.location.href = '/?error=checkout' })
  }, [me, createCheckout, params, router])

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
