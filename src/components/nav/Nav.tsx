'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Show, UserButton } from '@clerk/nextjs'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { useTheme } from '@/lib/theme'
import styles from './nav.module.css'

export function Nav() {
  const pathname = usePathname()
  const isLanding = pathname === '/'
  const { theme, toggleTheme } = useTheme()

  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Main navigation">
        <BrandLogo variant="nav" href="/" />

        {isLanding && (
          <ul className={styles.links} role="list">
            <li><a href="#portals" className={styles.link}>Portals</a></li>
            <li><a href="#pricing" className={styles.link}>Pricing</a></li>
            <li><a href="#about" className={styles.link}>About</a></li>
          </ul>
        )}

        <div className={styles.actions}>
          <button
            className={styles.themeBtn}
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <Show when="signed-out">
            <Link href="/sign-in" className={`${styles.link} ${styles.signIn}`}>
              Se connecter
            </Link>
            <a href="#pricing" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '10px' }}>
              Rejoindre
            </a>
          </Show>
          <Show when="signed-in">
            <Link href="/feed" className={styles.link}>Mon Vault</Link>
            <UserButton />
          </Show>
        </div>
      </nav>
    </header>
  )
}
