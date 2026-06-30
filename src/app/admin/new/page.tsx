'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import styles from './new-drop.module.css'

export default function NewDropPage() {
  const router = useRouter()
  const portals = useQuery(api.portals.listPortalsAdmin)
  const createDrop = useMutation(api.drops.createDrop)
  const generateUploadUrl = useMutation(api.drops.generateUploadUrl)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [portalId, setPortalId] = useState<Id<'portals'> | ''>('')
  const [isPinned, setIsPinned] = useState(false)
  const [isAlert, setIsAlert] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!portalId || !title.trim() || !body.trim()) {
      setError('Title, body, and portal are required.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      let imageStorageId: Id<'_storage'> | undefined

      if (imageFile) {
        const uploadUrl = await generateUploadUrl()
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': imageFile.type },
          body: imageFile,
        })
        const { storageId } = await result.json()
        imageStorageId = storageId
      }

      await createDrop({
        portalId: portalId as Id<'portals'>,
        title: title.trim(),
        body: body.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        imageStorageId,
        isPinned,
        isAlert,
        isVerified,
      })

      router.push('/admin/drops')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Add a New Vendor</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="title">Vendor Name</label>
            <input
              id="title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Guangzhou Textile Co. — Min. order 500 pcs"
              required
              maxLength={200}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="portal">Category</label>
            <select
              id="portal"
              className="input"
              value={portalId}
              onChange={(e) => setPortalId(e.target.value as Id<'portals'>)}
              required
            >
              <option value="">Select a category…</option>
              {portals?.map((p) => (
                <option key={p._id} value={p._id}>{p.emoji} {p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="phone">Phone / WhatsApp</label>
            <input
              id="phone"
              className="input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+86 138 0000 0000"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@supplier.com"
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="body">Description</label>
          <textarea
            id="body"
            className={`input ${styles.textarea}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Products, pricing, minimum orders, shipping terms, sourcing notes…"
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="image">Image (optional)</label>
          <div className={styles.uploadZone}>
            <input
              id="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className={styles.fileInput}
            />
            {imageFile ? (
              <p className={styles.fileName}>{imageFile.name}</p>
            ) : (
              <p className={styles.uploadHint}>Drag photo here or click to upload</p>
            )}
          </div>
        </div>

        <div className={styles.toggleRow}>
          <Toggle
            id="pinned"
            label="Pin to top of feed"
            checked={isPinned}
            onChange={setIsPinned}
          />
          <Toggle
            id="alert"
            label="Mark as Scam Alert"
            checked={isAlert}
            onChange={setIsAlert}
          />
          <Toggle
            id="verified"
            label="✓ Verified Vendor"
            checked={isVerified}
            onChange={setIsVerified}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
          style={{ minWidth: '160px' }}
        >
          {submitting ? 'Publishing…' : 'Publish Vendor'}
        </button>
      </form>
    </div>
  )
}

function Toggle({ id, label, checked, onChange }: {
  id: string
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className={styles.toggle}>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`${styles.toggleTrack} ${checked ? styles.toggleOn : ''}`}
      >
        <span className={styles.toggleThumb} />
      </button>
      <label htmlFor={id} className={styles.toggleLabel}>{label}</label>
    </div>
  )
}
