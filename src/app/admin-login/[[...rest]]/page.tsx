import { SignIn } from '@clerk/nextjs'
import styles from './admin-login.module.css'

export const metadata = { title: 'Admin Login — Jenga Suppliers' }

export default function AdminLoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>JS</span>
          <span className={styles.brandName}>Jenga Suppliers™</span>
        </div>
        <div className={styles.copy}>
          <h1 className={styles.headline}>Administration Portal</h1>
          <p className={styles.sub}>
            Restricted access. Belle Jones &amp; authorised team only.
          </p>
        </div>
        <p className={styles.memberLink}>
          Not an admin? <a href="/sign-in">Member login →</a>
        </p>
      </div>

      <div className={styles.right}>
        <div className={styles.clerkWrap}>
          <SignIn
            forceRedirectUrl="/admin"
            appearance={{
              variables: {
                colorPrimary: '#9B2FFF',
                colorBackground: '#0D0D0D',
                colorNeutral: '#3D2E52',
                borderRadius: '10px',
                fontFamily: 'Barlow, sans-serif',
              },
              elements: {
                card: { boxShadow: 'none', background: 'transparent' },
                headerTitle: { display: 'none' },
                headerSubtitle: { display: 'none' },
                socialButtonsBlockButton: { border: '1px solid #3D2E52' },
                dividerLine: { background: '#3D2E52' },
                formButtonPrimary: {
                  background: 'linear-gradient(135deg, #9B2FFF 0%, #FFB800 100%)',
                  border: 'none',
                },
              },
            }}
          />
          <p className={styles.noAccount}>
            Need an admin account? <a href="/admin-signup">Request access →</a>
          </p>
        </div>
      </div>
    </div>
  )
}
