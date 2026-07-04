'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import styles from './new-drop.module.css'

// ── Types ────────────────────────────────────────────────────────────────────

interface BulkRow {
  title: string
  body: string
  phone?: string
  email?: string
  isVerified?: boolean
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function NewDropPage() {
  const [tab, setTab] = useState<'manual' | 'bulk'>('manual')

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Add Vendors</h1>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'manual' ? styles.tabActive : ''}`}
          onClick={() => setTab('manual')}
        >
          ✦ Single vendor
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'bulk' ? styles.tabActive : ''}`}
          onClick={() => setTab('bulk')}
        >
          ⬆ Bulk upload (CSV / XLSX)
        </button>
      </div>

      {tab === 'manual' ? <ManualForm /> : <BulkUpload />}
    </div>
  )
}

// ── Manual single-vendor form ─────────────────────────────────────────────────

function ManualForm() {
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
  const [videoFile, setVideoFile] = useState<File | null>(null)
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

      let videoStorageId: Id<'_storage'> | undefined
      if (videoFile) {
        const uploadUrl = await generateUploadUrl()
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': videoFile.type },
          body: videoFile,
        })
        const { storageId } = await result.json()
        videoStorageId = storageId
      }

      await createDrop({
        portalId: portalId as Id<'portals'>,
        title: title.trim(),
        body: body.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        imageStorageId,
        videoStorageId,
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

      <div className={styles.row}>
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
              <p className={styles.fileName}>📷 {imageFile.name}</p>
            ) : (
              <p className={styles.uploadHint}>Drag photo here or click to upload</p>
            )}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="video">Warehouse Video (optional)</label>
          <div className={styles.uploadZone}>
            <input
              id="video"
              type="file"
              accept="video/mp4,video/webm,video/mov,video/quicktime"
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
              className={styles.fileInput}
            />
            {videoFile ? (
              <p className={styles.fileName}>🎥 {videoFile.name}</p>
            ) : (
              <>
                <p className={styles.uploadHint}>Drag warehouse video here or click</p>
                <p className={styles.uploadHintSub}>MP4 / WebM / MOV</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.toggleRow}>
        <Toggle id="pinned" label="Pin to top of feed" checked={isPinned} onChange={setIsPinned} />
        <Toggle id="alert" label="🎥 Mark as Warehouse Video" checked={isAlert} onChange={setIsAlert} />
        <Toggle id="verified" label="✓ Verified Vendor" checked={isVerified} onChange={setIsVerified} />
      </div>

      <button type="submit" className="btn btn-primary" disabled={submitting} style={{ minWidth: '160px' }}>
        {submitting ? 'Publishing…' : 'Publish Vendor'}
      </button>
    </form>
  )
}

// ── Bulk upload ───────────────────────────────────────────────────────────────

function BulkUpload() {
  const router = useRouter()
  const portals = useQuery(api.portals.listPortalsAdmin)
  const bulkCreate = useMutation(api.drops.bulkCreateDrops)

  const [portalId, setPortalId] = useState<Id<'portals'> | ''>('')
  const [rows, setRows] = useState<BulkRow[]>([])
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setParseError('')
    setRows([])
    setFileName(file.name)

    const ext = file.name.split('.').pop()?.toLowerCase()

    try {
      let parsed: BulkRow[] = []

      if (ext === 'csv') {
        const text = await file.text()
        parsed = parseCSV(text)
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buf = await file.arrayBuffer()
        parsed = await parseXLSX(buf)
      } else {
        setParseError('Unsupported format. Please upload a .csv or .xlsx file.')
        return
      }

      if (parsed.length === 0) {
        setParseError('No valid rows found. Check that the file has the expected columns.')
        return
      }
      setRows(parsed)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse file.')
    }
  }

  async function handleImport() {
    if (!portalId || rows.length === 0) return
    setSubmitting(true)
    try {
      const ids = await bulkCreate({ portalId: portalId as Id<'portals'>, rows })
      setDone(ids.length)
      setTimeout(() => router.push('/admin/drops'), 1200)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.form}>
      {/* Template download hint */}
      <div className={styles.bulkHint}>
        <p className={styles.bulkHintTitle}>Expected columns</p>
        <code className={styles.bulkCode}>title, body, phone, email, isVerified</code>
        <p className={styles.bulkHintSub}>
          <strong>title</strong> and <strong>body</strong> are required. All others are optional.
          isVerified accepts <code>true</code> / <code>1</code> / <code>yes</code>.
        </p>
        <a
          href="data:text/csv;charset=utf-8,title,body,phone,email,isVerified%0AGuangzhou Textile Co.,Min order 500 pcs — woven fabrics,+86 138 0000 0000,contact%40supplier.com,true"
          download="vendors-template.csv"
          className={styles.templateLink}
        >
          ↓ Download CSV template
        </a>
      </div>

      {/* Drop zone */}
      <div
        className={styles.uploadZone}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files[0]
          if (f) handleFile(f)
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className={styles.fileInput}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        {fileName ? (
          <p className={styles.fileName}>📄 {fileName} — {rows.length} rows parsed</p>
        ) : (
          <>
            <p className={styles.uploadHint}>Drag your CSV or XLSX here</p>
            <p className={styles.uploadHintSub}>or click to browse</p>
          </>
        )}
      </div>

      {parseError && <div className={styles.error}>{parseError}</div>}

      {/* Category selector */}
      {rows.length > 0 && (
        <>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="bulk-portal">Category for all rows</label>
            <select
              id="bulk-portal"
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

          {/* Preview table */}
          <div className={styles.previewWrap}>
            <p className={styles.label} style={{ marginBottom: '8px' }}>Preview — {rows.length} vendors</p>
            <div className={styles.tableWrap}>
              <table className={styles.previewTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Vendor name</th>
                    <th>Description</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((r, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{r.title}</td>
                      <td className={styles.tdBody}>{r.body}</td>
                      <td>{r.phone ?? '—'}</td>
                      <td>{r.email ?? '—'}</td>
                      <td>{r.isVerified ? '✓' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 50 && (
                <p className={styles.previewMore}>…and {rows.length - 50} more rows</p>
              )}
            </div>
          </div>

          {done > 0 ? (
            <p className={styles.successMsg}>✓ {done} vendors imported! Redirecting…</p>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleImport}
              disabled={submitting || !portalId}
              style={{ minWidth: '200px' }}
            >
              {submitting ? `Importing…` : `Import ${rows.length} vendors`}
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSV(text: string): BulkRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''))

  const idx = {
    title: headers.indexOf('title'),
    body: headers.indexOf('body'),
    phone: headers.indexOf('phone'),
    email: headers.indexOf('email'),
    isVerified: headers.indexOf('isverified'),
  }

  if (idx.title === -1 || idx.body === -1) {
    throw new Error('CSV must have "title" and "body" columns.')
  }

  return lines.slice(1).flatMap((line) => {
    const cols = splitCSVLine(line)
    const title = cols[idx.title]?.trim().replace(/^"|"$/g, '')
    const body = cols[idx.body]?.trim().replace(/^"|"$/g, '')
    if (!title || !body) return []
    return [{
      title,
      body,
      phone: idx.phone !== -1 ? cols[idx.phone]?.trim().replace(/^"|"$/g, '') || undefined : undefined,
      email: idx.email !== -1 ? cols[idx.email]?.trim().replace(/^"|"$/g, '') || undefined : undefined,
      isVerified: idx.isVerified !== -1 ? parseBool(cols[idx.isVerified]) : false,
    }]
  })
}

function splitCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

// ── XLSX parser (dynamic import) ──────────────────────────────────────────────

async function parseXLSX(buf: ArrayBuffer): Promise<BulkRow[]> {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

  if (raw.length === 0) return []

  const normalizeKey = (obj: Record<string, unknown>, key: string): string => {
    const found = Object.keys(obj).find((k) => k.trim().toLowerCase() === key)
    return found ? String(obj[found]).trim() : ''
  }

  return raw.flatMap((row) => {
    const title = normalizeKey(row, 'title')
    const body = normalizeKey(row, 'body')
    if (!title || !body) return []
    const phone = normalizeKey(row, 'phone') || undefined
    const email = normalizeKey(row, 'email') || undefined
    const isVerified = parseBool(normalizeKey(row, 'isverified'))
    return [{ title, body, phone, email, isVerified }]
  })
}

function parseBool(val: unknown): boolean {
  if (typeof val === 'boolean') return val
  const s = String(val).trim().toLowerCase()
  return s === 'true' || s === '1' || s === 'yes'
}

// ── Toggle ────────────────────────────────────────────────────────────────────

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
