import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Jenga Suppliers — Fournisseurs vérifiés pour revendeurs francophones'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* Gold accent bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: '#C9A84C',
          display: 'flex',
        }} />

        {/* Brand mark */}
        <div style={{
          fontSize: '13px',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: '#C9A84C',
          marginBottom: '28px',
          display: 'flex',
        }}>
          JENGA SUPPLIERS™
        </div>

        {/* Main headline */}
        <div style={{
          fontSize: '58px',
          fontWeight: 700,
          color: '#f5f0e8',
          textAlign: 'center',
          lineHeight: 1.15,
          maxWidth: '900px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          La bibliothèque de fournisseurs vérifiés #1 en francophonie
        </div>

        {/* Subline */}
        <div style={{
          fontSize: '22px',
          color: '#8a8070',
          textAlign: 'center',
          maxWidth: '700px',
          lineHeight: 1.5,
          marginBottom: '40px',
          display: 'flex',
        }}>
          500+ fournisseurs · Weekly drops · Guides d&apos;importation
        </div>

        {/* Pricing badge */}
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
        }}>
          <div style={{
            background: '#C9A84C',
            color: '#000',
            fontSize: '15px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            padding: '12px 28px',
            borderRadius: '4px',
            display: 'flex',
          }}>
            À PARTIR DE $29/MOIS
          </div>
        </div>

        {/* Bottom URL */}
        <div style={{
          position: 'absolute',
          bottom: '28px',
          fontSize: '13px',
          color: '#4a4540',
          letterSpacing: '0.1em',
          display: 'flex',
        }}>
          jengasuppliers.com
        </div>
      </div>
    ),
    { ...size },
  )
}
