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

function savePlan(plan: string) {
  try { localStorage.setItem('jenga_plan', plan) } catch {}
}

export function Pricing() {
  const { isSignedIn } = useAuth()
  const base = isSignedIn ? '/checkout' : '/sign-up'

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

          <Link href={`${base}?plan=monthly`} onClick={() => savePlan('monthly')} className={`btn ${styles.joinBtnSecondary}`}>
            Deviens Membre
          </Link>
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

          <Link href={`${base}?plan=yearly`} onClick={() => savePlan('yearly')} className={`btn btn-primary ${styles.joinBtn}`}>
            Commencer — $299/an
          </Link>
          <p className={styles.note}>Accès instantané · Facturation annuelle · Aucun frais caché</p>
        </div>

      </div>
    </section>
  )
}
