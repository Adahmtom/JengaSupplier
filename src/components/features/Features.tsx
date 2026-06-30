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
    title: 'Alertes Arnaques',
    desc: 'Protégez votre business — notre communauté signale les mauvais acteurs avant qu\'ils ne vous coûtent de l\'argent.',
  },
  {
    num: '05',
    title: 'Vidéos d\'usines',
    desc: 'Vidéos tournées directement dans les usines chinoises pour voir la qualité avant d\'acheter.',
  },
  {
    num: '06',
    title: 'Sessions en direct',
    desc: 'Sessions en direct chaque mois avec Belle Jones — Q&A, nouveaux marchés, opportunités exclusives.',
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
