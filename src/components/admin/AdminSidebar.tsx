'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { useLang } from '@/lib/i18n'
import styles from './admin-sidebar.module.css'

const NAV = [
  { href: '/admin', icon: '📊', label: 'Overview' },
  { href: '/admin/new', icon: '✦', label: 'New Vendor' },
  { href: '/admin/drops', icon: '📁', label: 'All Vendors' },
  { href: '/admin/categories', icon: '🗂', label: 'Categories' },
  { href: '/admin/members', icon: '👥', label: 'Members' },
  { href: '/admin/audit', icon: '📋', label: 'Audit Log' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { lang, toggle } = useLang()

  return (
    <aside className={styles.sidebar} aria-label="Admin navigation">
      <div>
        <div className={styles.logoWrap}>
          <span className={styles.logo}>JENGA ADMIN</span>
        </div>
        <nav>
          <ul role="list" className={styles.list}>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${styles.item} ${pathname === item.href ? styles.active : ''}`}
                  aria-current={pathname === item.href ? 'page' : undefined}
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
        <div className={styles.user}><UserButton  /></div>
      </div>
    </aside>
  )
}
