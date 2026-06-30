'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/lib/theme'

interface BrandLogoProps {
  /** sidebar = compact | nav = slim | full = large hero */
  variant?: 'sidebar' | 'nav' | 'full'
  href?: string
}

const sizes = {
  sidebar: 52,
  nav:     64,
  full:    180,
}

export function BrandLogo({ variant = 'sidebar', href = '/' }: BrandLogoProps) {
  const { theme } = useTheme()
  const size = sizes[variant]

  const isDark = theme === 'dark'

  /* Dark mode: the logo has a built-in dark-purple bg — show it as a
     glowing badge against the black surface.
     Light mode: wrap in a deep-purple rounded pill so the logo colours
     remain vivid on the white/lavender background. */
  const wrapStyle: React.CSSProperties = isDark
    ? {
        display: 'inline-flex',
        borderRadius: variant === 'full' ? 24 : 14,
        overflow: 'hidden',
        boxShadow: '0 0 0 1px rgba(155,47,255,0.30), 0 4px 24px rgba(155,47,255,0.18)',
      }
    : {
        display: 'inline-flex',
        borderRadius: variant === 'full' ? 24 : 14,
        overflow: 'hidden',
        background: '#1A003A',
        boxShadow: '0 2px 16px rgba(0,0,0,0.22)',
        padding: variant === 'full' ? 4 : 2,
      }

  const img = (
    <div style={wrapStyle}>
      <Image
        src="/logo.svg"
        alt="Jenga Suppliers"
        width={size}
        height={size}
        priority
        style={{ width: size, height: size, objectFit: 'cover', display: 'block' }}
      />
    </div>
  )

  return href ? (
    <Link
      href={href}
      aria-label="Jenga Suppliers — Accueil"
      style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
    >
      {img}
    </Link>
  ) : img
}
