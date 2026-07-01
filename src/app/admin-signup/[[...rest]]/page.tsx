'use client'

import { useState } from 'react'
import { SignUp } from '@clerk/nextjs'
import { verifyAdminInviteCode } from '../actions'
import styles from './admin-signup.module.css'

export default function AdminSignupPage() {
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setCodeError('')
    try {
      const ok = await verifyAdminInviteCode(code)
      if (ok) {
        // Store code in sessionStorage so admin-claim can read it without URL exposure
        sessionStorage.setItem('adminClaimCode', code)
        setVerified(true)
      } else {
        setCodeError('Incorrect invite code. Contact Belle Jones for access.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>JS</span>
          <span className={styles.brandName}>Jenga Suppliers™</span>
        </div>
        <div className={styles.copy}>
          <h1 className={styles.headline}>Create Admin Account</h1>
          <p className={styles.sub}>
            Admin accounts require an invite code. Once verified, your account will be
            automatically granted super_admin access.
          </p>
          <ul className={styles.perks}>
            <li>✦ Post &amp; manage vendors</li>
            <li>✦ Manage categories</li>
            <li>✦ View all members</li>
            <li>✦ Access audit logs</li>
            <li>✦ Full dashboard access</li>
          </ul>
        </div>
        <p className={styles.memberLink}>
          Already have an account? <a href="/admin-login">Admin login →</a>
        </p>
      </div>

      <div className={styles.right}>
        {!verified ? (
          <form onSubmit={handleVerify} className={styles.gate}>
            <div className={styles.gateIcon}>🔑</div>
            <h2 className={styles.gateTitle}>Enter Invite Code</h2>
            <p className={styles.gateSub}>This code is provided by Belle Jones to authorised team members only.</p>
            <input
              className={styles.codeInput}
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your invite code"
              autoComplete="off"
              required
            />
            {codeError && <p className={styles.codeError}>{codeError}</p>}
            <button type="submit" className={`btn btn-primary ${styles.verifyBtn}`} disabled={loading}>
              {loading ? 'Vérification…' : 'Verify & Continue'}
            </button>
            <p className={styles.memberLink2}>
              <a href="/admin-login">← Back to admin login</a>
            </p>
          </form>
        ) : (
          <div className={styles.clerkWrap}>
            <p className={styles.codeOk}>✓ Invite code verified</p>
            <SignUp
              forceRedirectUrl="/admin-claim"
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
          </div>
        )}
      </div>
    </div>
  )
}
