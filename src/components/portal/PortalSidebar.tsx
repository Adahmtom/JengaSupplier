'use client'

import { useState } from 'react'
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
  const [sheetOpen, setSheetOpen] = useState(false)

  const isAdmin = me?.role === 'super_admin' || me?.role === 'admin' || me?.role === 'moderator'

  function isActive(href: string) {
    return pathname === href
  }

  return (
    <>
      {/* ── Desktop / tablet sidebar ── */}
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

            <span className={styles.sectionLabel}>
              {lang === 'fr' ? 'Communauté' : 'Community'}
            </span>
            <ul role="list" className={styles.navList}>
              {portals?.map((portal) => (
                <SidebarItem
                  key={portal._id + '-community'}
                  href={`/community/${portal.slug}`}
                  icon="💬"
                  label={portal.name}
                  active={pathname === `/community/${portal.slug}`}
                />
              ))}
              {!portals && Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className={styles.skeleton} />
              ))}
            </ul>
          </nav>
        </div>

        <div className={styles.bottom}>
          <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
            <span className={styles.themeIcon}>{theme === 'dark' ? '☀' : '☾'}</span>
            <span className={styles.themeLabel}>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>

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

      {/* ── Mobile: categories slide-up sheet ── */}
      {sheetOpen && (
        <>
          <div
            className={styles.sheetOverlay}
            onClick={() => setSheetOpen(false)}
            aria-hidden="true"
          />
          <div className={styles.sheet} role="dialog" aria-label="Catégories">
            <div className={styles.sheetHandle} />
            <div className={styles.sheetHeader}>
              <span className={styles.sheetTitle}>
                {lang === 'fr' ? 'Catégories' : 'Categories'}
              </span>
              <button className={styles.sheetClose} onClick={() => setSheetOpen(false)} aria-label="Fermer">✕</button>
            </div>
            <nav>
              <ul role="list" className={styles.sheetList}>
                <li>
                  <Link
                    href="/feed"
                    className={`${styles.sheetItem} ${isActive('/feed') ? styles.sheetItemActive : ''}`}
                    onClick={() => setSheetOpen(false)}
                  >
                    <span className={styles.sheetIcon}>✦</span>
                    {t.dailyFeed}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/alerts"
                    className={`${styles.sheetItem} ${isActive('/alerts') ? styles.sheetItemActive : ''}`}
                    onClick={() => setSheetOpen(false)}
                  >
                    <span className={styles.sheetIcon}>⚠</span>
                    {t.scamAlerts}
                  </Link>
                </li>
                {portals?.map((portal) => (
                  <li key={portal._id}>
                    <Link
                      href={`/portal/${portal.slug}`}
                      className={`${styles.sheetItem} ${isActive(`/portal/${portal.slug}`) ? styles.sheetItemActive : ''}`}
                      onClick={() => setSheetOpen(false)}
                    >
                      <span className={styles.sheetIcon}>{portal.emoji}</span>
                      {portal.name}
                    </Link>
                  </li>
                ))}
                {portals && portals.length > 0 && (
                  <li style={{ paddingTop: 'var(--space-2)', paddingBottom: 2, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-subtle)', fontWeight: 700, fontFamily: 'var(--font-sans)', paddingLeft: 'var(--space-5)' }}>
                    {lang === 'fr' ? 'Communauté' : 'Community'}
                  </li>
                )}
                {portals?.map((portal) => (
                  <li key={portal._id + '-community'}>
                    <Link
                      href={`/community/${portal.slug}`}
                      className={`${styles.sheetItem} ${pathname === `/community/${portal.slug}` ? styles.sheetItemActive : ''}`}
                      onClick={() => setSheetOpen(false)}
                    >
                      <span className={styles.sheetIcon}>💬</span>
                      {portal.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className={styles.sheetBottom}>
              <button className={styles.sheetAction} onClick={toggleTheme}>
                {theme === 'dark' ? '☀ Light mode' : '☾ Dark mode'}
              </button>
              <button className={styles.sheetAction} onClick={toggle}>
                {lang === 'fr' ? '🇬🇧 English' : '🇫🇷 Français'}
              </button>
              {isAdmin && (
                <Link href="/admin" className={styles.sheetAction} onClick={() => setSheetOpen(false)}>
                  ⚙ Admin
                </Link>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Mobile bottom nav ── */}
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
          <button
            className={`${styles.mobileNavItem} ${sheetOpen ? styles.mobileActive : ''} ${pathname.startsWith('/portal') ? styles.mobileActive : ''}`}
            onClick={() => setSheetOpen(true)}
            aria-label="Ouvrir les catégories"
          >
            <span className={styles.mobileIcon}>🗂</span>
            {lang === 'fr' ? 'Catégories' : 'Cat.'}
          </button>
          <button
            className={`${styles.mobileNavItem} ${pathname.startsWith('/community') ? styles.mobileActive : ''}`}
            onClick={() => setSheetOpen(true)}
            aria-label="Communauté"
          >
            <span className={styles.mobileIcon}>💬</span>
            {lang === 'fr' ? 'Communauté' : 'Community'}
          </button>
          <Link href="/account" className={`${styles.mobileNavItem} ${isActive('/account') ? styles.mobileActive : ''}`}>
            <span className={styles.mobileIcon}>👤</span>
            Compte
          </Link>
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
