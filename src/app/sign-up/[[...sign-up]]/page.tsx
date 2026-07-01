'use client'

import { Suspense, useEffect } from 'react'
import { SignUp } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'

function SignUpInner() {
  const params = useSearchParams()
  const plan = params.get('plan') === 'yearly' ? 'yearly' : 'monthly'
  const sessionId = params.get('session_id') ?? ''

  // Persist session_id so /activate can retrieve it after Clerk redirects
  useEffect(() => {
    if (sessionId) {
      try { sessionStorage.setItem('jenga_stripe_session', sessionId) } catch {}
    }
  }, [sessionId])

  const redirectUrl = sessionId ? '/activate' : `/checkout?plan=${plan}`

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)', background: 'var(--color-surface)' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--color-gold)', letterSpacing: '0.08em', marginBottom: 'var(--space-2)' }}>
            ✦ China Business Vault by Belle Jones
          </p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
            {sessionId ? 'Paiement reçu — créez votre compte' : 'Créez votre compte'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            {sessionId
              ? '✅ Paiement confirmé · Créez votre compte pour accéder au Vault'
              : `Accès instantané après paiement · ${plan === 'yearly' ? '$299/an' : '$29/mois'} · Résiliez à tout moment`}
          </p>
        </div>
        <SignUp forceRedirectUrl={redirectUrl} />
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
