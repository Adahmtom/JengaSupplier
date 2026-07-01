'use client'

import { useEffect, useRef, useState } from 'react'
import { useAction, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import styles from '../checkout/checkout.module.css'

export default function ActivatePage() {
  const activateSubscription = useAction(api.stripe.activateGuestSubscription)
  const me = useQuery(api.users.getMe)
  const called = useRef(false)
  const [status, setStatus] = useState<'activating' | 'error'>('activating')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // Wait until Convex user record is synced from Clerk webhook
    if (me === undefined || me === null) return
    if (called.current) return
    called.current = true

    let sessionId = ''
    try { sessionId = sessionStorage.getItem('jenga_stripe_session') ?? '' } catch {}
    try { sessionStorage.removeItem('jenga_stripe_session') } catch {}

    if (!sessionId) {
      // No session to activate — go straight to feed (webhook may have handled it)
      window.location.href = '/feed?welcome=1'
      return
    }

    activateSubscription({ sessionId })
      .then(() => { window.location.href = '/feed?welcome=1' })
      .catch((err: unknown) => {
        setStatus('error')
        setErrorMsg(err instanceof Error ? err.message : 'Une erreur est survenue.')
      })
  }, [me, activateSubscription])

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {status === 'activating' ? (
          <>
            <div className={styles.spinner} aria-hidden="true" />
            <p className={styles.eyebrow}>✦ China Business Vault by Belle Jones</p>
            <h1 className={styles.heading}>Activation de votre accès…</h1>
            <p className={styles.sub}>Votre abonnement est en cours de liaison à votre compte.</p>
          </>
        ) : (
          <>
            <p className={styles.eyebrow}>✦ China Business Vault by Belle Jones</p>
            <h1 className={styles.heading}>Une erreur est survenue</h1>
            <p className={styles.sub}>{errorMsg}</p>
            <p className={styles.sub} style={{ marginTop: '1rem' }}>
              Votre paiement a bien été reçu. Contactez le support en indiquant votre email pour que nous activions votre accès manuellement.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
