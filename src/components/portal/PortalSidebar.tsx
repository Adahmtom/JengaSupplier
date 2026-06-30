'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { UserButton, useClerk } from '@clerk/nextjs'
import { useLang } from '@/lib/i18n'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { useTheme } from '@/lib/theme'
import styles from './portal-sidebar.module.css'

export function PortalSidebar() {
  const pathname = usePathname()
  const portals = useQuery(api.portals.listPortals)
  const me = useQuery(api.users.getMe)
  const { signOut } = useClerk()
  const { t, lang, toggle } = useLang()
  const { theme, toggleTheme } = useTheme()

  const isAdmin = me?.role === 'super_admin' || me?.role === 'admin' || me?.role === 'moderator'

  function isActive(href: string) {
    return pathname === href
  }

  return (
    <>
      {/* Desktop / tablet sidebar */}
      <aside className={styles.sidebar} aria-label="Navigation principale">
        <div className={styles.top}>
          <div className={styles.logoWrap}>
            <BrandLogo variant="sidebar" href="/feed" />
          </div>

          <nav>
            <span className={styles.sectionLabel}>{t.main}</span>
            <ul role="list" className={styles.navList}>
              <SidebarItem href="/feed"   icon="✦" label={t.dailyFeed}  active={isActive('/feed')} />
              <SidebarItem href="/alerts" icon="⚠" label={t.scamAlerts} active={isActive('/alerts')} />
            </ul>

            <span className={styles.sectionLabel}>{t.portals}</span>
            <ul role="list" className={styles.navList}>
              {portals?.map((portal) => (
                <SidebarItem
                  key={portal._id}
                  href={`/portal/${portal.slug}`}
                  icon={portal.emoji}
                  label={portal.name}
                  active={isActive(`/portal/${portal.slug}`)}
                />
              ))}
              {!portals && Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className={styles.skeleton} />
              ))}
            </ul>
          </nav>
        </div>

        <div className={styles.bottom}>
          {/* Theme toggle */}
          <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
            <span className={styles.themeIcon}>{theme === 'dark' ? '☀' : '☾'}</span>
            <span className={styles.themeLabel}>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>

          {/* Language toggle */}
          <button className={styles.langToggle} onClick={toggle} aria-label="Switch language">
            <span className={styles.langFlag}>{lang === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
            <span className={styles.langLabel}>{lang === 'fr' ? 'Français' : 'English'}</span>
            <span className={styles.langSwitch}>{lang === 'fr' ? 'EN' : 'FR'}</span>
          </button>

          {isAdmin && (
            <Link href="/admin" className={`${styles.navItem} ${styles.adminLink}`}>
              <span className={styles.icon}>⚙</span>
              Admin
            </Link>
          )}
          <Link href="/account" className={`${styles.navItem} ${isActive('/account') ? styles.active : ''}`}>
            <span className={styles.icon}>👤</span>
            {t.myAccount}
          </Link>

          {/* Sign out */}
          <button
            className={`${styles.navItem} ${styles.signOutBtn}`}
            onClick={() => signOut({ redirectUrl: '/' })}
          >
            <span className={styles.icon}>→</span>
            {t.signOut}
          </button>

          <div className={styles.userRow}>
            <UserButton />
            <span className={styles.userName}>{me?.name ?? me?.email}</span>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className={styles.mobileNav} aria-label="Navigation mobile">
        <div className={styles.mobileNavInner}>
          <Link href="/feed" className={`${styles.mobileNavItem} ${isActive('/feed') ? styles.mobileActive : ''}`}>
            <span className={styles.mobileIcon}>✦</span>
            Feed
          </Link>
          <Link href="/alerts" className={`${styles.mobileNavItem} ${isActive('/alerts') ? styles.mobileActive : ''}`}>
            <span className={styles.mobileIcon}>⚠</span>
            Alertes
          </Link>
          <Link href="/portal/hair" className={`${styles.mobileNavItem} ${pathname.startsWith('/portal') ? styles.mobileActive : ''}`}>
            <span className={styles.mobileIcon}>🗂</span>
            {lang === 'fr' ? 'Catégories' : 'Categories'}
          </Link>
          <Link href="/account" className={`${styles.mobileNavItem} ${isActive('/account') ? styles.mobileActive : ''}`}>
            <span className={styles.mobileIcon}>👤</span>
            Compte
          </Link>
          <button
            className={`${styles.mobileNavItem}`}
            onClick={() => signOut({ redirectUrl: '/' })}
            aria-label={t.signOut}
          >
            <span className={styles.mobileIcon}>→</span>
            {lang === 'fr' ? 'Sortir' : 'Out'}
          </button>
        </div>
      </nav>
    </>
  )
}

function SidebarItem({ href, icon, label, active }: {
  href: string
  icon: string
  label: string
  active: boolean
}) {
  return (
    <li>
      <Link
        href={href}
        className={`${styles.navItem} ${active ? styles.active : ''}`}
        aria-current={active ? 'page' : undefined}
      >
        <span className={styles.icon} aria-hidden="true">{icon}</span>
        {label}
      </Link>
    </li>
  )
}
