'use client'

import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import styles from './pricing.module.css'

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

type Plan = 'monthly' | 'quarterly' | 'semiannual' | 'yearly'

function PlanButton({ plan, label, className }: { plan: Plan; label: string; className: string }) {
  const { isSignedIn } = useAuth()
  const href = isSignedIn ? `/checkout?plan=${plan}` : `/sign-up?plan=${plan}`
  return (
    <Link href={href} className={className} prefetch={false}>
      {label}
    </Link>
  )
}

export function Pricing() {
  return (
    <section id="pricing" className={styles.section} aria-labelledby="pricing-heading">
      <div className={styles.header}>
        <p className="label">✦ Membres Uniquement</p>
        <h2 id="pricing-heading" className={styles.sectionTitle}>Choisissez votre formule</h2>
      </div>

      <div className={styles.grid}>

        {/* ── Monthly ── */}
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
          <PlanButton plan="monthly" label="Deviens Membre" className={`btn ${styles.joinBtnSecondary}`} />
          <p className={styles.note}>Accès instantané · Aucun frais caché</p>
        </div>

        {/* ── 3-month ── */}
        <div className={styles.card}>
          <div className={styles.goldLine} aria-hidden="true" />
          <p className={styles.planLabel}>3 Mois</p>
          <div className={styles.priceRow}>
            <span className={styles.currency}>$</span>
            <span className={styles.priceNum}>79</span>
            <span className={styles.pricePer}>/trim.</span>
          </div>
          <p className={styles.originalPrice}>
            <s>$87/trim.</s>
            <span className={styles.saveTag}>Économisez $8</span>
          </p>
          <p className={styles.period}>soit $26.33/mois · facturation trimestrielle</p>
          <ul className={styles.perks} role="list">
            {PERKS.map((perk) => (
              <li key={perk} className={styles.perk}>
                <span className={styles.perkIcon} aria-hidden="true">✦</span>
                {perk}
              </li>
            ))}
          </ul>
          <PlanButton plan="quarterly" label="Commencer — 3 mois" className={`btn ${styles.joinBtnSecondary}`} />
          <p className={styles.note}>Accès instantané · Facturation trimestrielle · Aucun frais caché</p>
        </div>

        {/* ── 6-month ── */}
        <div className={styles.card}>
          <div className={styles.goldLine} aria-hidden="true" />
          <p className={styles.planLabel}>6 Mois</p>
          <div className={styles.priceRow}>
            <span className={styles.currency}>$</span>
            <span className={styles.priceNum}>139</span>
            <span className={styles.pricePer}>/sem.</span>
          </div>
          <p className={styles.originalPrice}>
            <s>$174/sem.</s>
            <span className={styles.saveTag}>Économisez $35</span>
          </p>
          <p className={styles.period}>soit $23/mois · facturation semestrielle</p>
          <ul className={styles.perks} role="list">
            {PERKS.map((perk) => (
              <li key={perk} className={styles.perk}>
                <span className={styles.perkIcon} aria-hidden="true">✦</span>
                {perk}
              </li>
            ))}
          </ul>
          <PlanButton plan="semiannual" label="Commencer — 6 mois" className={`btn ${styles.joinBtnSecondary}`} />
          <p className={styles.note}>Accès instantané · Facturation semestrielle · Aucun frais caché</p>
        </div>

        {/* ── Yearly (featured) ── */}
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
          <PlanButton plan="yearly" label="Commencer — $299/an" className={`btn btn-primary ${styles.joinBtn}`} />
          <p className={styles.note}>Accès instantané · Facturation annuelle · Aucun frais caché</p>
        </div>

      </div>
    </section>
  )
}
