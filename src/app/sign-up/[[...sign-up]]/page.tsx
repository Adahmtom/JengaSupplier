'use client'

import { Suspense } from 'react'
import { SignUp } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'

const VALID_PLANS = new Set(['monthly', 'quarterly', 'semiannual', 'yearly'])

function SignUpInner() {
  const params = useSearchParams()
  const raw = params.get('plan') ?? 'monthly'
  const plan = VALID_PLANS.has(raw) ? raw : 'monthly'

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
            Étape 1 sur 2 — Ensuite vous choisirez votre plan
          </p>
        </div>
        <SignUp
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
