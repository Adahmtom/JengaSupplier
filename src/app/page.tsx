import { Nav } from '@/components/nav/Nav'
import { Hero } from '@/components/hero/Hero'
import { Features } from '@/components/features/Features'
import { Pricing } from '@/components/pricing/Pricing'

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Features />
        <section id="about" style={{ padding: 'var(--space-24) var(--space-8)', textAlign: 'center', maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <p className="label" style={{ marginBottom: 'var(--space-6)' }}>Conçu pour les revendeurs sérieux</p>
          <p style={{ fontSize: 'var(--text-h3)', fontFamily: 'var(--font-serif)', color: 'var(--color-text-secondary)', maxWidth: '720px', margin: '0 auto', lineHeight: 'var(--leading-snug)' }}>
            &ldquo;Franchement, je ne m&apos;attendais pas à repartir avec autant de valeur. Cette formation a largement dépassé mes attentes. Belle n&apos;a pas seulement partagé des fournisseurs, elle nous a expliqué comment les trouver, comment les contacter, comment négocier et surtout comment éviter les erreurs qui coûtent cher. Je repars avec plus de 90 fournisseurs vérifiés.&rdquo;
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-subtle)', marginTop: 'var(--space-4)', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase' }}>
            — Mariama K., Revendeuse
          </p>
        </section>
        <Pricing />
      </main>
      <footer style={{ borderTop: '1px solid var(--color-border-subtle)', padding: 'var(--space-8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 'var(--content-max)', margin: '0 auto' }}>
        <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-gold)', fontSize: '13px', letterSpacing: '0.1em' }}>JENGA SUPPLIERS</span>
        <span style={{ fontSize: '10px', color: 'var(--color-text-subtle)', letterSpacing: '0.1em' }}>© 2026 · All rights reserved</span>
      </footer>
    </>
  )
}
