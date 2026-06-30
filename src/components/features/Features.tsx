import styles from './features.module.css'

const FEATURES = [
  {
    num: '01',
    title: 'Fournisseurs vérifiés',
    desc: 'Plus de 500 fournisseurs et usines vérifiés, organisés par catégories et mis à jour chaque semaine.',
  },
  {
    num: '02',
    title: 'Weekly Drops',
    desc: 'Chaque semaine : nouveau fournisseur, nouvelle usine, nouveau produit rentable, nouvelle tendance, nouveau marché.',
  },
  {
    num: '03',
    title: 'Guides & Ressources',
    desc: 'Guides de négociation, d\'importation, templates de messages en anglais et chinois, calculateur de coûts, check-lists.',
  },
  {
    num: '04',
    title: 'Éviter les arnaques',
    desc: 'Apprenez à identifier les fournisseurs fiables, éviter les pièges les plus fréquents et importer en toute sécurité grâce à nos conseils et méthodes.',
  },
  {
    num: '05',
    title: 'Vidéos d\'usines',
    desc: 'Découvrez des vidéos tournées directement dans les usines de nos différents fournisseurs afin d\'évaluer leur qualité, leur sérieux et leurs méthodes de production avant de commander.',
  },
  {
    num: '06',
    title: 'Communauté Jenga',
    desc: 'Échangez avec les autres membres, partagez vos expériences, posez vos questions, publiez les photos de vos commandes et bénéficiez des retours de la communauté.',
  },
]

export function Features() {
  return (
    <section id="portals" className={styles.features} aria-labelledby="features-heading">
      <div className={styles.inner}>
        <p className="label" style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
          Ce que vous trouverez à l&apos;intérieur
        </p>

        <h2 id="features-heading" className={styles.sectionTitle}>
          Tout ce dont vous avez besoin pour sourcer en Chine.
        </h2>

        <div className={styles.grid}>
          {FEATURES.map((f) => (
            <div key={f.num} className={styles.item}>
              <div className={styles.number} aria-hidden="true">{f.num}</div>
              <h3 className={styles.title}>{f.title}</h3>
              <p className={styles.desc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
