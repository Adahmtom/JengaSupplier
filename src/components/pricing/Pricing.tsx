'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import styles from './pricing.module.css'

// Set these once after creating Payment Links in the Stripe dashboard.
// If blank, falls back to dynamic session creation via /pre-checkout.
const STRIPE_MONTHLY_LINK = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_LINK ?? ''
const STRIPE_YEARLY_LINK  = process.env.NEXT_PUBLIC_STRIPE_YEARLY_LINK  ?? ''

const PERKS = [
  'Plus de 500 fournisseurs vérifiés',
  'Nouveaux fournisseurs chaque semaine',
  'Vidéos tournées directement dans les usines',
  'Guides de négociation & d\'importation',
  'Templates de messages (anglais & chinois)',
  'Calculateur de coûts & check-lists',
  'Alertes arnaques de la communauté',
  'Transitaires recommandés',
  'COMMUNAUTÉ JENGA pour échanger avec les autres membres',
  'Résiliez à tout moment — sans engagement',
]

function PlanButton({
  plan,
  label,
  className,
  isSignedIn,
}: {
  plan: 'monthly' | 'yearly'
  label: string
  className: string
  isSignedIn: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const createGuestCheckout = useAction(api.stripe.createGuestCheckoutSession)

  async function handleClick() {
    const paymentLink = plan === 'yearly' ? STRIPE_YEARLY_LINK : STRIPE_MONTHLY_LINK
    if (paymentLink) {
      window.location.href = paymentLink
      return
    }

    // Fallback: dynamic session creation
    setLoading(true)
    setError('')
    try {
      const url = await createGuestCheckout({ plan })
      window.location.href = url
    } catch (err) {
      setLoading(false)
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessayez.')
    }
  }

  if (isSignedIn) {
    return (
      <Link href={`/checkout?plan=${plan}`} className={className}>
        {label}
      </Link>
    )
  }

  return (
    <>
      <button
        className={className}
        onClick={handleClick}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? 'Redirection…' : label}
      </button>
      {error && <p role="alert" style={{ color: 'var(--color-error, #e53e3e)', fontSize: '0.85rem', marginTop: '8px', textAlign: 'center' }}>{error}</p>}
    </>
  )
}

export function Pricing() {
  const { isSignedIn } = useAuth()

  return (
    <section id="pricing" className={styles.section} aria-labelledby="pricing-heading">
      <div className={styles.header}>
        <p className="label">✦ Membres Uniquement</p>
        <h2 id="pricing-heading" className={styles.sectionTitle}>Choisissez votre formule</h2>
      </div>

      <div className={styles.grid}>

        {/* ── Monthly card ── */}
        <div className={styles.card}>
          <div className={styles.goldLine} aria-hidden="true" />
          <p className={styles.planLabel}>Mensuel</p>

          <div className={styles.priceRow}>
            <span className={styles.currency}>$</span>
            <span className={styles.priceNum}>29</span>
            <span className={styles.pricePer}>/mois</span>
          </div>

          <p className={styles.originalPrice}>&nbsp;</p>
          <p className={styles.period}>Renouvellement mensuel · sans engagement</p>

          <ul className={styles.perks} role="list">
            {PERKS.map((perk) => (
              <li key={perk} className={styles.perk}>
                <span className={styles.perkIcon} aria-hidden="true">✦</span>
                {perk}
              </li>
            ))}
          </ul>

          <PlanButton plan="monthly" label="Deviens Membre" className={`btn ${styles.joinBtnSecondary}`} isSignedIn={!!isSignedIn} />
          <p className={styles.note}>Accès instantané · Aucun frais caché</p>
        </div>

        {/* ── Yearly card (featured) ── */}
        <div className={`${styles.card} ${styles.cardFeatured}`}>
          <div className={styles.goldLine} aria-hidden="true" />
          <div className={styles.bestBadge}>Meilleure offre</div>
          <p className={styles.planLabel}>Annuel</p>

          <div className={styles.priceRow}>
            <span className={styles.currency}>$</span>
            <span className={styles.priceNum}>299</span>
            <span className={styles.pricePer}>/an</span>
          </div>

          <p className={styles.originalPrice}>
            <s>$348/an</s>
            <span className={styles.saveTag}>Économisez $49</span>
          </p>
          <p className={styles.period}>soit $24.92/mois · facturation annuelle</p>

          <ul className={styles.perks} role="list">
            {PERKS.map((perk) => (
              <li key={perk} className={styles.perk}>
                <span className={styles.perkIcon} aria-hidden="true">✦</span>
                {perk}
              </li>
            ))}
          </ul>

          <PlanButton plan="yearly" label="Commencer — $299/an" className={`btn btn-primary ${styles.joinBtn}`} isSignedIn={!!isSignedIn} />
          <p className={styles.note}>Accès instantané · Facturation annuelle · Aucun frais caché</p>
        </div>

      </div>
    </section>
  )
}
