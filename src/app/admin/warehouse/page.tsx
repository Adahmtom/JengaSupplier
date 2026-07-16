'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import styles from '../new/new-drop.module.css'

export default function WarehouseUploadPage() {
  const router = useRouter()
  const portals = useQuery(api.portals.listPortalsAdmin)
  const createDrop = useMutation(api.drops.createDrop)
  const generateUploadUrl = useMutation(api.drops.generateUploadUrl)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Use first available portal — warehouse videos appear in the alerts feed,
  // not in a specific category, so the portal assignment doesn't matter.
  const defaultPortal = portals?.[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) {
      setError('Title and description are required.')
      return
    }
    if (!videoFile) {
      setError('Please select a video to upload.')
      return
    }
    if (!defaultPortal) {
      setError('No categories found. Seed categories first.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const uploadUrl = await generateUploadUrl()
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': videoFile.type },
        body: videoFile,
      })
      const { storageId } = await result.json()

      await createDrop({
        portalId: defaultPortal._id as Id<'portals'>,
        title: title.trim(),
        body: body.trim(),
        videoStorageId: storageId,
        isAlert: true,
        isPinned: false,
        isVerified: false,
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
      <h1 className={styles.title}>Upload Warehouse Video</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Videos appear in the Warehouse Videos section for all members.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="title">Title</label>
          <input
            id="title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Visite entrepôt Guangzhou — Textiles"
            required
            maxLength={200}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="body">Description</label>
          <textarea
            id="body"
            className={`input ${styles.textarea}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What does this warehouse sell? Key observations, quality notes…"
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="video">Video</label>
          <div className={styles.uploadZone}>
            <input
              id="video"
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
              className={styles.fileInput}
              required
            />
            {videoFile ? (
              <p className={styles.fileName}>🎥 {videoFile.name}</p>
            ) : (
              <>
                <p className={styles.uploadHint}>Click to select a video file</p>
                <p className={styles.uploadHintSub}>MP4 / MOV / WebM</p>
              </>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
          style={{ minWidth: '160px' }}
        >
          {submitting ? 'Uploading…' : 'Publish Video'}
        </button>
      </form>
    </div>
  )
}
