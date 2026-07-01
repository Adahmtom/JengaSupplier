'use client'

import { useState, useEffect, useRef } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import styles from './waitlist.module.css'

interface WaitlistModalProps {
  service: string
  serviceLabel: string
  date: string
  onClose: () => void
}

export function WaitlistModal({ service, serviceLabel, date, onClose }: WaitlistModalProps) {
  const join = useMutation(api.waitlist.joinWaitlist)
  const [step, setStep] = useState<'form' | 'thanks'>('form')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })

  const modalRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  // Element that had focus before the modal opened
  const returnFocusRef = useRef<HTMLElement | null>(null)

  // On open: store returning element, move focus inside
  useEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement
    closeBtnRef.current?.focus()

    // Focus trap
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return

      const modal = modalRef.current
      if (!modal) return
      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // On close: return focus
  function handleClose() {
    returnFocusRef.current?.focus()
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.phone) return
    setLoading(true)
    try {
      await join({ ...form, service })
      setStep('thanks')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="waitlist-dialog-title"
      >
        <button ref={closeBtnRef} className={styles.close} onClick={handleClose} aria-label="Fermer">✕</button>

        {step === 'form' ? (
          <>
            <p className={styles.eyebrow}>✦ Liste d&apos;attente</p>
            <h2 id="waitlist-dialog-title" className={styles.title}>{serviceLabel}</h2>
            <p className={styles.date}>📅 {date}</p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="wl-name">Nom complet</label>
                <input
                  id="wl-name"
                  className={styles.input}
                  type="text"
                  placeholder="Votre nom"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="wl-email">Adresse e-mail</label>
                <input
                  id="wl-email"
                  className={styles.input}
                  type="email"
                  placeholder="vous@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="wl-phone">Numéro de téléphone</label>
                <input
                  id="wl-phone"
                  className={styles.input}
                  type="tel"
                  placeholder="+1 000 000 0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className={styles.submit} disabled={loading}>
                {loading ? 'Envoi…' : 'Rejoindre la liste d\'attente'}
              </button>
            </form>
          </>
        ) : (
          <div className={styles.thanks}>
            <div className={styles.thanksIcon} aria-hidden="true">✓</div>
            <h2 id="waitlist-dialog-title" className={styles.thanksTitle}>Vous êtes sur la liste !</h2>
            <p className={styles.thanksMsg}>
              Merci <strong>{form.name}</strong> — nous vous contacterons à <strong>{form.email}</strong> dès que les places seront disponibles pour {date}.
            </p>
            <button className={styles.submit} onClick={handleClose}>Fermer</button>
          </div>
        )}
      </div>
    </div>
  )
}
