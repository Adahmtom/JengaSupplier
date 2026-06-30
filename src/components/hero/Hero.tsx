'use client'

import Link from 'next/link'
import styles from './hero.module.css'

const AVATARS = ['B', 'M', 'K', 'S', 'A']

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.content}>
        <p className={`label ${styles.eyebrow}`}>✦ Bienvenue dans le Jenga Supplier Vault</p>

        <h1 id="hero-heading" className={styles.headline}>
          La plus grande bibliothèque{' '}
          <em className={styles.emphasis}>francophone</em>
          <br />
          de fournisseurs vérifiés au monde.
        </h1>

        <p className={styles.subtext}>
          Découvrez des centaines de fournisseurs sélectionnés avec soin, classés par catégories
          et mis à jour en continu pour vous aider à lancer ou développer votre business,
          où que vous soyez.
        </p>

        <div className={styles.cta}>
          <a href="#pricing" className="btn btn-primary">
            Rejoins Jenga Maintenant
          </a>
          <a href="#pricing" className={styles.ctaLink}>
            $299/an · économisez $49 →
          </a>
        </div>

        <div className={styles.social}>
          <div className={styles.avatarStack} aria-hidden="true">
            {AVATARS.map((letter, i) => (
              <div key={i} className={styles.avatar} style={{ zIndex: AVATARS.length - i }}>
                {letter}
              </div>
            ))}
          </div>
          <p className={styles.socialText}>
            Déjà plus de <strong>150+ membres</strong>
          </p>
        </div>
      </div>

      <div className={styles.visual} aria-hidden="true">
        <div className={styles.previewCard}>
          <div className={styles.previewHeader}>
            <span className={styles.previewTitle}>JENGA SUPPLIERS</span>
            <span className={styles.liveBadge}>● Live</span>
          </div>

          <div className={styles.previewFeed}>
            {PREVIEW_DROPS.map((drop, i) => (
              <div key={i} className={`${styles.previewDrop} ${drop.isAlert ? styles.alertDrop : ''}`}>
                <div className={styles.previewDropTag}>{drop.isAlert ? '⚠ Alerte' : `✦ ${drop.portal}`}</div>
                <div className={styles.previewDropTitle}>{drop.title}</div>
                <div className={styles.previewDropMeta}>{drop.meta}</div>
              </div>
            ))}
          </div>

          <div className={styles.previewOverlay}>
            <span className="badge badge-gold">● 3 nouveaux drops aujourd&apos;hui</span>
            <span className={styles.previewDate}>Mis à jour 28 Juin</span>
          </div>
        </div>

        <div className={styles.floatingBadge}>
          <span>$29</span>
          <span className={styles.floatingBadgeSub}>/mois</span>
        </div>
      </div>
    </section>
  )
}

const PREVIEW_DROPS = [
  { portal: 'Usine', title: 'Fournisseur de sacs — contact direct usine Guangzhou inclus', meta: '♥ 74 · 12 commentaires', isAlert: false },
  { portal: 'Alerte', title: 'Arnaque signalée — fournisseur AliExpress "luxegoods88"', meta: '⚠ Vérifié · 56 signalements', isAlert: true },
  { portal: 'Tendance', title: 'Nouveau produit rentable — marge 300% confirmée', meta: '♥ 93 · 21 commentaires', isAlert: false },
]
