'use client'

import { Suspense, useEffect, useState } from 'react'
import { SignUp } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { useAction } from 'convex/react'
import { api } from '../../../../convex/_generated/api'

function SignUpInner() {
  const params = useSearchParams()
  const plan = params.get('plan') === 'yearly' ? 'yearly' : 'monthly'
  const sessionId = params.get('session_id') ?? ''
  const getEmail = useAction(api.stripe.getSessionEmail)
  const [prefillEmail, setPrefillEmail] = useState('')

  useEffect(() => {
    if (sessionId) {
      try { sessionStorage.setItem('jenga_stripe_session', sessionId) } catch {}
      getEmail({ sessionId }).then(setPrefillEmail).catch(() => {})
    }
  }, [sessionId, getEmail])

  const redirectUrl = sessionId ? '/activate' : `/checkout?plan=${plan}`
  const isPaid = !!sessionId

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)', background: 'var(--color-surface)' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--color-gold)', letterSpacing: '0.08em', marginBottom: 'var(--space-2)' }}>
            ✦ China Business Vault by Belle Jones
          </p>
          {isPaid && (
            <p style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>✅</p>
          )}
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
            {isPaid ? 'Paiement confirmé — dernière étape' : 'Créez votre compte'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            {isPaid
              ? 'Créez votre mot de passe pour accéder au Vault'
              : `${plan === 'yearly' ? '$299/an' : '$29/mois'} · Résiliez à tout moment`}
          </p>
        </div>
        <SignUp
          forceRedirectUrl={redirectUrl}
          initialValues={prefillEmail ? { emailAddress: prefillEmail } : undefined}
          appearance={{
            variables: {
              colorBackground: '#ffffff',
              colorText: '#1a1a1a',
              colorInputBackground: '#f5f5f5',
              colorInputText: '#1a1a1a',
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
