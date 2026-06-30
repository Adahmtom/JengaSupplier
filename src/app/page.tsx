'use client'

import { useState, useEffect } from 'react'
import { Nav } from '@/components/nav/Nav'
import { Hero } from '@/components/hero/Hero'
import { Features } from '@/components/features/Features'
import { Pricing } from '@/components/pricing/Pricing'
import { WaitlistModal } from '@/components/waitlist/WaitlistModal'

interface WaitlistEntry {
  service: string
  serviceLabel: string
  date: string
}

export default function LandingPage() {
  const [waitlist, setWaitlist] = useState<WaitlistEntry | null>(null)

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

        {/* ── Services section ── */}
        <section style={{ padding: 'var(--space-24) var(--space-8)', maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <p className="label" style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>✦ Services Exclusifs</p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            Aller plus loin avec l&apos;équipe Jenga
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>

            {/* Travel to China */}
            <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <span style={{ fontSize: '2rem' }}>✈️</span>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text)' }}>
                Voyage en Chine avec Belle &amp; l&apos;équipe Jenga
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Rejoignez Belle Jones et l&apos;équipe Jenga pour une immersion unique en Chine. Visitez des usines, rencontrez des fournisseurs vérifiés, sourcez des produits rentables et apprenez à acheter directement à la source pour lancer ou développer votre business.
              </p>
              <p style={{ color: 'var(--color-gold)', fontSize: '0.85rem', fontStyle: 'italic', lineHeight: 1.5 }}>
                Le succès appartient à ceux qui passent à l&apos;action. Votre prochain chapitre commence aujourd&apos;hui.
              </p>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 700, color: 'var(--color-gold)' }}>$3 500</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'auto' }}>
                <SessionSlot
                  label="Septembre 2026"
                  startLabel="Début : Avril 2026"
                  deadline={new Date('2026-09-01T00:00:00')}
                  service="travel-sep-2026"
                  serviceLabel="Voyage en Chine avec Belle & l'équipe Jenga"
                  onJoin={setWaitlist}
                />
              </div>
            </div>

            {/* Sourcing for you */}
            <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <span style={{ fontSize: '2rem' }}>📦</span>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text)' }}>
                Sourcing de produits en Chine pour vous
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Confiez votre sourcing à Belle et à l&apos;équipe Jenga. Nous trouvons des fournisseurs vérifiés, négocions les meilleurs prix, contrôlons la qualité et gérons vos commandes directement pour vous. Vous gagnez du temps, réduisez les risques et achetez en toute confiance.
              </p>
              <p style={{ color: 'var(--color-gold)', fontSize: '0.85rem', fontStyle: 'italic', lineHeight: 1.5 }}>
                Votre business mérite les meilleurs fournisseurs. Nous les trouvons pour vous.
              </p>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 700, color: 'var(--color-gold)' }}>$1 200</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'auto' }}>
                <SessionSlot
                  label="Septembre 2026"
                  startLabel="Début : Avril 2026"
                  deadline={new Date('2026-09-01T00:00:00')}
                  service="sourcing-sep-2026"
                  serviceLabel="Sourcing de produits en Chine pour vous"
                  onJoin={setWaitlist}
                />
              </div>
            </div>

          </div>
        </section>

      </main>
      <footer style={{ borderTop: '1px solid var(--color-border-subtle)', padding: 'var(--space-8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 'var(--content-max)', margin: '0 auto' }}>
        <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-gold)', fontSize: '13px', letterSpacing: '0.1em' }}>JENGA SUPPLIERS</span>
        <span style={{ fontSize: '10px', color: 'var(--color-text-subtle)', letterSpacing: '0.1em' }}>© 2026 · All rights reserved</span>
      </footer>

      {waitlist && (
        <WaitlistModal
          service={waitlist.service}
          serviceLabel={waitlist.serviceLabel}
          date={waitlist.date}
          onClose={() => setWaitlist(null)}
        />
      )}
    </>
  )
}

// ── Countdown hook ────────────────────────────────────────────────────────────

function useCountdown(target: Date) {
  const getRemaining = () => Math.max(0, target.getTime() - Date.now())
  const [ms, setMs] = useState(getRemaining)

  useEffect(() => {
    if (ms === 0) return
    const id = setInterval(() => setMs(getRemaining()), 1000)
    return () => clearInterval(id)
  }, [ms])

  const total = ms / 1000
  const days  = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const mins  = Math.floor((total % 3600) / 60)
  const secs  = Math.floor(total % 60)
  return { days, hours, mins, secs, expired: ms === 0 }
}

// ── SessionSlot ───────────────────────────────────────────────────────────────

interface SessionSlotProps {
  label: string
  startLabel?: string
  deadline?: Date
  service: string
  serviceLabel: string
  onJoin: (entry: { service: string; serviceLabel: string; date: string }) => void
}

function SessionSlot({ label, startLabel, deadline, service, serviceLabel, onJoin }: SessionSlotProps) {
  const countdown = useCountdown(deadline ?? new Date(0))

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border-subtle)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-4)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
    }}>
      {/* Row 1: date label + start badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>
          📅 {label}
        </span>
        {startLabel && (
          <span style={{
            fontSize: '9px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-gold)',
            background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.25)',
            borderRadius: '999px',
            padding: '2px 8px',
            fontWeight: 600,
          }}>
            {startLabel}
          </span>
        )}
      </div>

      {/* Row 2: countdown (only when deadline provided and not expired) */}
      {deadline && !countdown.expired && (
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {[
            { v: countdown.days,  u: 'Jours' },
            { v: countdown.hours, u: 'Heures' },
            { v: countdown.mins,  u: 'Min' },
            { v: countdown.secs,  u: 'Sec' },
          ].map(({ v, u }) => (
            <div key={u} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: '52px',
              background: 'var(--color-gold)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 8px',
            }}>
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '1.2rem', fontWeight: 800, color: '#000', lineHeight: 1 }}>
                {pad(v)}
              </span>
              <span style={{ fontSize: '8px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.6)', marginTop: '3px', fontWeight: 600 }}>
                {u}
              </span>
            </div>
          ))}
        </div>
      )}
      {deadline && countdown.expired && (
        <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)', letterSpacing: '0.06em' }}>Session terminée</span>
      )}

      {/* Row 3: CTA */}
      <button
        onClick={() => onJoin({ service, serviceLabel, date: label })}
        style={{
          alignSelf: 'flex-start',
          fontSize: '10px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: '#000',
          background: 'var(--color-gold)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 16px',
          cursor: 'pointer',
          transition: 'opacity 150ms',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        Rejoindre la liste d&apos;attente →
      </button>
    </div>
  )
}
