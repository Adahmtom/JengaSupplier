'use client'

import { SignIn } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'

export default function SignInPage() {
  const params = useSearchParams()
  const plan = params.get('plan')
  const redirectUrl = plan ? `/checkout?plan=${plan}` : '/redirect'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)', background: 'var(--color-surface)' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--color-gold)', letterSpacing: '0.08em', marginBottom: 'var(--space-2)' }}>
            ✦ China Business Vault by Belle Jones
          </p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
            Bon retour
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            Connectez-vous pour accéder à votre Vault
          </p>
        </div>
        <SignIn
          forceRedirectUrl={redirectUrl}
          signUpUrl={`/sign-up${plan ? `?plan=${plan}` : '?plan=monthly'}`}
        />
      </div>
    </div>
  )
}
