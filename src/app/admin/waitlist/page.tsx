'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'

const SERVICE_LABELS: Record<string, string> = {
  'travel-sep-2026': 'Voyage en Chine — Sept. 2026',
  'travel-apr-2027': 'Voyage en Chine — Avr. 2027',
  'sourcing-sep-2026': 'Sourcing en Chine — Sept. 2026',
  'sourcing-apr-2027': 'Sourcing en Chine — Avr. 2027',
}

export default function WaitlistAdminPage() {
  const entries = useQuery(api.waitlist.listWaitlist, {})

  return (
    <div style={{ padding: 'var(--space-8)', maxWidth: '900px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700, marginBottom: 'var(--space-8)' }}>
        Liste d&apos;attente
      </h1>

      {entries === undefined && (
        <p style={{ color: 'var(--color-text-muted)' }}>Chargement…</p>
      )}
      {entries === null && (
        <p style={{ color: 'var(--color-text-muted)' }}>Accès refusé.</p>
      )}
      {entries && entries.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)' }}>Aucune inscription pour l&apos;instant.</p>
      )}
      {entries && entries.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border-subtle)', textAlign: 'left' }}>
              <th style={{ padding: '10px 12px', color: 'var(--color-text-subtle)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Nom</th>
              <th style={{ padding: '10px 12px', color: 'var(--color-text-subtle)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Email</th>
              <th style={{ padding: '10px 12px', color: 'var(--color-text-subtle)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Téléphone</th>
              <th style={{ padding: '10px 12px', color: 'var(--color-text-subtle)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Service</th>
              <th style={{ padding: '10px 12px', color: 'var(--color-text-subtle)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e._id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: '12px', color: 'var(--color-text)' }}>{e.name}</td>
                <td style={{ padding: '12px', color: 'var(--color-text-muted)' }}>{e.email}</td>
                <td style={{ padding: '12px', color: 'var(--color-text-muted)' }}>{e.phone}</td>
                <td style={{ padding: '12px', color: 'var(--color-text-muted)' }}>{SERVICE_LABELS[e.service] ?? e.service}</td>
                <td style={{ padding: '12px', color: 'var(--color-text-subtle)', fontSize: '11px' }}>
                  {new Date(e._creationTime).toLocaleDateString('fr-CA')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
