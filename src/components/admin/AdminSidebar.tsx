'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { useLang } from '@/lib/i18n'
import styles from './admin-sidebar.module.css'

const NAV = [
  { href: '/admin',           icon: '📊', label: 'Overview' },
  { href: '/admin/new',       icon: '✦',  label: 'New Vendor' },
  { href: '/admin/drops',     icon: '📁', label: 'All Vendors' },
  { href: '/admin/categories',icon: '🗂', label: 'Categories' },
  { href: '/admin/members',   icon: '👥', label: 'Members' },
  { href: '/admin/audit',     icon: '📋', label: 'Audit Log' },
  { href: '/admin/waitlist',  icon: '📝', label: 'Waitlist' },
]

// 5 most important for the mobile bottom bar
const MOBILE_NAV = [
  { href: '/admin',          icon: '📊', label: 'Overview' },
  { href: '/admin/drops',    icon: '📁', label: 'Vendors' },
  { href: '/admin/new',      icon: '＋',  label: 'Ajouter', isNew: true },
  { href: '/admin/members',  icon: '👥', label: 'Membres' },
  { href: '/admin/waitlist', icon: '📝', label: 'Waitlist' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { lang, toggle } = useLang()

  function isActive(href: string) {
    return pathname === href
  }

  return (
    <>
      {/* ── Mobile top bar ── */}
      <header className={styles.mobileTopBar}>
        <span className={styles.mobileTopLogo}>⚙ Jenga Admin</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/feed" style={{ fontSize: '11px', color: 'var(--color-text-subtle)', textDecoration: 'none', letterSpacing: '0.06em' }}>
            ← Vue membre
          </Link>
          <UserButton />
        </div>
      </header>

      {/* ── Desktop / tablet sidebar ── */}
      <aside className={styles.sidebar} aria-label="Admin navigation">
        <div>
          <div className={styles.logoWrap}>
            <span className={styles.logo}>⚙ Jenga Admin</span>
          </div>
          <nav>
            <ul role="list" className={styles.list}>
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${styles.item} ${isActive(item.href) ? styles.active : ''}`}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className={styles.bottom}>
          <Link href="/feed" className={styles.item}>
            <span aria-hidden="true">👁</span> Member View
          </Link>
          <Link href="/admin-signup" className={styles.item}>
            <span aria-hidden="true">➕</span> Add Admin
          </Link>
          <button
            onClick={toggle}
            className={styles.langToggle}
            type="button"
            aria-label="Toggle language"
          >
            <span className={lang === 'fr' ? styles.langActive : styles.langInactive}>FR</span>
            <span className={styles.langDivider}>·</span>
            <span className={lang === 'en' ? styles.langActive : styles.langInactive}>EN</span>
          </button>
          <div className={styles.user}><UserButton /></div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className={styles.mobileNav} aria-label="Navigation admin mobile">
        <div className={styles.mobileNavInner}>
          {MOBILE_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.mobileNavItem} ${isActive(item.href) ? styles.mobileActive : ''}`}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              <span className={item.isNew ? styles.mobileIconNew : styles.mobileIcon}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
