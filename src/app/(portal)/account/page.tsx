'use client'

import { useQuery, useAction } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { UserButton, useClerk } from '@clerk/nextjs'
import { useLang } from '@/lib/i18n'
import { formatDate } from '@/lib/utils'
import styles from './account.module.css'

export default function AccountPage() {
  const me = useQuery(api.users.getMe)
  const sub = useQuery(api.subscriptions.getMySubscription)
  const createPortal = useAction(api.stripe.createPortalSession)
  const { signOut } = useClerk()
  const { t } = useLang()

  async function handleManageBilling() {
    const url = await createPortal()
    window.location.href = url
  }

  const isAdmin = me?.role === 'super_admin' || me?.role === 'admin' || me?.role === 'moderator'
  const isActive = isAdmin || sub?.status === 'active' || sub?.status === 'trialing'
  const memberSince = me ? formatDate(me._creationTime) : '—'

  function getRoleBadge() {
    switch (me?.role) {
      case 'super_admin': return t.roleSuperAdmin
      case 'admin':       return t.roleAdmin
      case 'moderator':   return t.roleModerator
      default:            return t.roleMember
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t.myAccountTitle}</h1>

      {/* Profile */}
      <section className={styles.card} aria-labelledby="profile-heading">
        <p className="label" id="profile-heading" style={{ marginBottom: 'var(--space-5)' }}>{t.profile}</p>
        <div className={styles.profileRow}>
          <div className={styles.avatarWrap}>
            <UserButton appearance={{ elements: { avatarBox: { width: 56, height: 56 } } }} />
          </div>
          <div className={styles.profileInfo}>
            <p className={styles.profileName}>{me?.name ?? '—'}</p>
            <p className={styles.profileEmail}>{me?.email}</p>
            <span className={`${styles.roleBadge} ${me?.role !== 'member' ? styles.roleAdmin : ''}`}>
              {getRoleBadge()}
            </span>
          </div>
        </div>
        <div className={styles.fields}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>{t.memberSince}</span>
            <span className={styles.fieldValue}>{memberSince}</span>
          </div>
        </div>
      </section>

      {/* Subscription — hidden for admins who have full access by role */}
      {!isAdmin && (
        <section className={styles.card} aria-labelledby="sub-heading">
          <div className={styles.cardHeader}>
            <p className="label" id="sub-heading">{t.subscription}</p>
            {isActive && <span className={styles.statusPill}>● {t.active}</span>}
          </div>

          {!sub ? (
            <div className={styles.noSubWrap}>
              <p className={styles.noSub}>{t.noSubscription}</p>
              <a href="/" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 'var(--space-4)' }}>
                {t.subscribeNow}
              </a>
            </div>
          ) : (
            <>
              <div className={styles.planBox}>
                <div>
                  <p className={styles.planName}>{t.planName}</p>
                  <p className={styles.planPrice}>
                    {sub.stripePriceId?.includes('yearly') || sub.stripePriceId?.includes('year') || sub.stripePriceId?.includes('annual')
                      ? <>${'199'} <span>/an</span></>
                      : <>${'29'} <span>/mois</span></>
                    }
                  </p>
                </div>
                <div className={`${styles.statusDot} ${isActive ? styles.dotActive : styles.dotInactive}`} />
              </div>

              <div className={styles.fields}>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>{t.statusLabel}</span>
                  <span className={`${styles.fieldValue} ${isActive ? styles.textSuccess : styles.textAlert}`}>
                    {sub.status === 'active' ? t.statusActive :
                     sub.status === 'trialing' ? t.statusTrialing :
                     sub.status === 'canceled' ? t.statusCanceled : sub.status}
                  </span>
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>
                    {sub.cancelAtPeriodEnd ? t.cancelsOn : t.renewsOn}
                  </span>
                  <span className={styles.fieldValue}>{formatDate(sub.currentPeriodEnd)}</span>
                </div>
              </div>

              {sub.cancelAtPeriodEnd && (
                <div className={styles.cancelWarning}>
                  ⚠ {t.cancelWarning} {formatDate(sub.currentPeriodEnd)}{t.cancelWarningEnd}
                </div>
              )}

              <div className={styles.billingActions}>
                <button onClick={handleManageBilling} className="btn btn-ghost">
                  {t.manageBilling}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {/* What's included */}
      <section className={styles.card} aria-labelledby="access-heading">
        <p className="label" id="access-heading" style={{ marginBottom: 'var(--space-5)' }}>
          {t.whatsIncluded}
        </p>
        <div className={styles.accessGrid}>
          {t.access.map((label, i) => {
            const icons = ['📦','🗓','🎬','⚠','📋','🌐','📊','🚚','🎙','♾']
            return (
              <div key={i} className={styles.accessItem}>
                <span className={styles.accessIcon}>{icons[i]}</span>
                <span className={styles.accessLabel}>{label}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Help */}
      <section className={styles.card} aria-labelledby="help-heading">
        <p className="label" id="help-heading" style={{ marginBottom: 'var(--space-5)' }}>{t.help}</p>
        <div className={styles.helpList}>
          <a href="mailto:support@jengasuppliers.com" className={styles.helpItem}>
            <span className={styles.helpIcon}>📧</span>
            <div>
              <p className={styles.helpTitle}>{t.contactSupport}</p>
              <p className={styles.helpSub}>support@jengasuppliers.com</p>
            </div>
            <span className={styles.helpArrow}>→</span>
          </a>
          <div className={styles.helpItem}>
            <span className={styles.helpIcon}>🎙</span>
            <div>
              <p className={styles.helpTitle}>{t.monthlyLives}</p>
              <p className={styles.helpSub}>{t.monthlyLivesSub}</p>
            </div>
          </div>
          <div className={styles.helpItem}>
            <span className={styles.helpIcon}>📖</span>
            <div>
              <p className={styles.helpTitle}>{t.startingGuide}</p>
              <p className={styles.helpSub}>{t.startingGuideSub}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sign out */}
      <section className={styles.card}>
        <button
          className={styles.signOutBtn}
          onClick={() => signOut({ redirectUrl: '/' })}
        >
          <span>→</span>
          {t.signOut}
        </button>
      </section>
    </div>
  )
}
