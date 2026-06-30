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
          <p style={{ fontSize: 'var(--text-h3)', fontFamily: 'var(--font-serif)', color: 'var(--color-text-secondary)', maxWidth: '640px', margin: '0 auto', lineHeight: 'var(--leading-snug)' }}>
            &ldquo;Grâce au Vault de Belle, j&apos;ai trouvé des fournisseurs que je n&apos;aurais jamais pu trouver seule. Rentabilisé dès la première semaine.&rdquo;
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
