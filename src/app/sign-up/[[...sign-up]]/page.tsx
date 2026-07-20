'use client'

import { Suspense, useEffect } from 'react'
import { SignUp } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'

const VALID_PLANS = new Set(['monthly', 'quarterly', 'semiannual', 'yearly'])

function readCookiePlan(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)jenga_plan=([^;]+)/)
  return match ? match[1] : null
}

function SignUpInner() {
  const params = useSearchParams()

  // Resolution order: query param → cookie → localStorage
  const rawParam = params.get('plan')
  const rawCookie = readCookiePlan()
  const rawStorage = typeof window !== 'undefined' ? localStorage.getItem('jenga_plan') : null
  const raw = rawParam ?? rawCookie ?? rawStorage ?? 'monthly'
  const plan = VALID_PLANS.has(raw) ? raw : 'monthly'

  // Re-write storage on every render so detours (email verification, OAuth)
  // don't lose the selection even if the query param disappears from the URL.
  useEffect(() => {
    try {
      localStorage.setItem('jenga_plan', plan)
      document.cookie = `jenga_plan=${plan}; path=/; max-age=7200; SameSite=Lax`
    } catch {}
  }, [plan])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-8)',
      background: 'var(--color-surface)',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <p style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.1rem',
            color: 'var(--color-gold)',
            letterSpacing: '0.08em',
            marginBottom: 'var(--space-2)',
          }}>
            ✦ China Business Vault by Belle Jones
          </p>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 700,
            color: 'var(--color-text)',
            marginBottom: 'var(--space-2)',
          }}>
            Créez votre compte
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            Étape 1 sur 2 — Ensuite, vous accéderez au paiement
          </p>
        </div>
        <SignUp
          // forceRedirectUrl is respected by Clerk even after OAuth and email verification
          forceRedirectUrl={`/checkout?plan=${plan}`}
          appearance={{
            variables: {
              colorBackground: '#ffffff',
              colorPrimary: '#c9a84c',
            },
          }}
        />
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--color-surface)' }} />}>
      <SignUpInner />
    </Suspense>
  )
}
