'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div style={pageStyle}>
        <div style={cardStyle}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Chargement…</p>
        </div>
      </div>
    }>
      <JoinContent />
    </Suspense>
  )
}

function JoinContent() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''

  const invite = useQuery(api.invites.peekInvite, token ? { token } : 'skip')
  const redeem = useMutation(api.invites.redeemInvite)
  const [loading, setLoading] = useState(false)

  // Auto-redirect if already signed in
  useEffect(() => {
    // If they somehow land here while signed in, push to feed
    const cookie = document.cookie
    if (cookie.includes('__session')) router.replace('/feed')
  }, [router])

  async function handleClaim() {
    if (!token) return
    setLoading(true)
    try {
      const result = await redeem({ token })
      if (!result.ok) {
        setLoading(false)
        return
      }
      // Redirect to Clerk sign-up pre-filled with their email
      const url = new URL('/sign-up', window.location.origin)
      url.searchParams.set('email', result.email ?? '')
      router.replace(url.toString())
    } catch {
      setLoading(false)
    }
  }

  if (!token) return <InviteError message="Lien invalide." />

  if (invite === undefined) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Vérification…</p>
        </div>
      </div>
    )
  }

  if (!invite.ok) {
    const messages: Record<string, string> = {
      invalid: "Ce lien d'invitation est invalide.",
      used: "Ce lien a déjà été utilisé. Connectez-vous ou contactez le support.",
      expired: "Ce lien a expiré. Contactez le support pour en obtenir un nouveau.",
    }
    return <InviteError message={messages[invite.reason ?? ''] ?? "Lien invalide."} />
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-gold)', fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 24 }}>
          Jenga Suppliers
        </p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 12, lineHeight: 1.2 }}>
          Bienvenue dans le Vault
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginBottom: 8, lineHeight: 1.6 }}>
          Votre paiement a été confirmé. Créez votre compte avec l'adresse e-mail suivante pour accéder à votre abonnement :
        </p>
        <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 16px', marginBottom: 28, fontFamily: 'var(--font-mono, monospace)', fontSize: 14, color: 'var(--color-text)', wordBreak: 'break-all' }}>
          {invite.email}
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginBottom: 24, lineHeight: 1.5 }}>
          ⚠️ Ce lien est à usage unique et ne peut pas être partagé. Il expirera dans 7 jours.
        </p>
        <button
          onClick={handleClaim}
          disabled={loading}
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: 13, letterSpacing: '0.08em' }}
        >
          {loading ? 'Redirection…' : 'Créer mon compte →'}
        </button>
      </div>
    </div>
  )
}

function InviteError({ message }: { message: string }) {
  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <p style={{ fontSize: '2rem', marginBottom: 16 }}>🔒</p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>
          Lien non valide
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
        <a href="/" style={{ fontSize: 13, color: 'var(--color-gold)', textDecoration: 'none' }}>← Retour à l'accueil</a>
      </div>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100dvh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  background: 'var(--color-bg)',
}

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 440,
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-xl)',
  padding: 'clamp(2rem, 5vw, 3rem)',
  textAlign: 'center',
}
