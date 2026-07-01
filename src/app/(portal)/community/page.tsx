'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import styles from './community.module.css'

const EMOJIS = ['🔥', '❤️', '👏', '💯', '😂']
const POSTS_PER_PAGE = 40

export default function CommunityPage() {
  const [limit, setLimit] = useState(POSTS_PER_PAGE)
  const posts = useQuery(api.community.listPosts, { limit })

  if (posts === undefined) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Chargement…</p>
        </div>
      </div>
    )
  }

  if (posts === null) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>💬</span>
          <p>Communauté</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>💬 Communauté</h1>
          <p className={styles.subtitle}>{posts.length} publications</p>
        </div>
      </header>

      <Composer />

      <section
        className={styles.feed}
        aria-label="Publications"
        aria-busy={false}
      >
        {posts.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>💬</span>
            <p>Soyez le premier à publier dans la communauté !</p>
          </div>
        )}
        {posts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
        {posts.length >= limit && (
          <button className={styles.loadMore} onClick={() => setLimit(l => l + POSTS_PER_PAGE)}>
            Voir plus de publications
          </button>
        )}
      </section>
    </div>
  )
}

function Composer() {
  const sendPost = useMutation(api.community.sendPost)
  const generateUrl = useMutation(api.community.generateUploadUrl)

  const [body, setBody] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  function pickImage(file: File) {
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() && !imageFile) return
    setSending(true)
    setError('')
    try {
      let imageStorageId: import('convex/values').GenericId<'_storage'> | undefined
      if (imageFile) {
        const url = await generateUrl()
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': imageFile.type },
          body: imageFile,
        })
        if (!res.ok) throw new Error(`Échec de l'upload (${res.status})`)
        const { storageId } = await res.json()
        imageStorageId = storageId as import('convex/values').GenericId<'_storage'>

      }
      await sendPost({ body, imageStorageId })
      setBody('')
      removeImage()
      textRef.current?.focus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la publication.')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.composer}>
      <label htmlFor="composer-body" className="sr-only">Votre message</label>
      <textarea
        id="composer-body"
        ref={textRef}
        className={styles.composerInput}
        placeholder="Partagez votre expérience, posez une question, publiez vos trouvailles…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={2000}
      />
      {imagePreview && (
        <div className={styles.previewWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagePreview} alt="Aperçu" className={styles.previewImg} />
          <button type="button" className={styles.previewRemove} onClick={removeImage} aria-label="Supprimer l'image">✕</button>
        </div>
      )}
      {error && <p className={styles.composerError} role="alert">{error}</p>}
      <div className={styles.composerActions}>
        <button type="button" className={styles.attachBtn} onClick={() => fileRef.current?.click()} aria-label="Ajouter une photo">
          📷 Photo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pickImage(f) }}
        />
        <span className={styles.charCount} aria-hidden="true">{body.length}/2000</span>
        <button type="submit" className={styles.sendBtn} disabled={sending || (!body.trim() && !imageFile)}>
          {sending ? 'Envoi…' : 'Publier'}
        </button>
      </div>
    </form>
  )
}

type Post = NonNullable<NonNullable<ReturnType<typeof useQuery<typeof api.community.listPosts>>>[number]>

function PostCard({ post }: { post: Post }) {
  const toggleReaction = useMutation(api.community.toggleReaction)
  const deletePost = useMutation(api.community.deletePost)
  const hidePost = useMutation(api.community.hidePost)
  const reportPost = useMutation(api.community.reportPost)

  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [actionError, setActionError] = useState('')

  const timeAgo = formatTimeAgo(post._creationTime)

  async function handleDelete() {
    if (!confirm('Supprimer cette publication ?')) return
    try { await deletePost({ postId: post._id }) }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Erreur.') }
  }

  async function handleHide() {
    try { await hidePost({ postId: post._id, reason: 'Contenu inapproprié' }) }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Erreur.') }
  }

  async function handleReport() {
    if (!reportReason.trim()) return
    try {
      await reportPost({ postId: post._id, reason: reportReason })
      setShowReport(false)
      setReportReason('')
    } catch (err) { setActionError(err instanceof Error ? err.message : 'Erreur.') }
  }

  const authorName = post.author.name || (post.author.email ? post.author.email.split('@')[0] : 'Membre')

  return (
    <article className={`${styles.post} ${post.isHidden ? styles.postHidden : ''}`}>
      <h2 className="sr-only">{`Publication de ${authorName}, ${timeAgo}`}</h2>
      {post.isHidden && post.viewerIsAdmin && (
        <div className={styles.hiddenBadge}>🚫 Masqué par un admin</div>
      )}
      <header className={styles.postHeader}>
        <div className={styles.avatar} aria-hidden="true">
          {post.author.imageUrl
            ? <Image src={post.author.imageUrl} alt="" width={36} height={36} className={styles.avatarImg} unoptimized />
            : <span className={styles.avatarFallback}>{authorName[0].toUpperCase()}</span>
          }
        </div>
        <div className={styles.postMeta}>
          <span className={styles.postAuthor}>
            {authorName}
            {post.author.role && post.author.role !== 'member' && (
              <span className={styles.roleBadge}>
                {post.author.role === 'super_admin' ? '⭐ Jenga' : post.author.role === 'admin' ? '🛡 Admin' : '🔰 Modo'}
              </span>
            )}
          </span>
          <span className={styles.postTime}>{timeAgo}</span>
        </div>
        <div className={styles.postActions}>
          {(post.isOwn || post.viewerIsAdmin) && (
            <button className={styles.actionBtn} onClick={handleDelete} aria-label="Supprimer">🗑</button>
          )}
          {post.viewerIsAdmin && !post.isHidden && (
            <button className={styles.actionBtn} onClick={handleHide} aria-label="Masquer">🚫</button>
          )}
          {!post.isOwn && !post.hasReported && (
            <button className={styles.actionBtn} onClick={() => setShowReport(true)} aria-label="Signaler">⚑</button>
          )}
        </div>
      </header>
      {actionError && <p className={styles.composerError} role="alert">{actionError}</p>}
      {post.body && <p className={styles.postBody}>{post.body}</p>}
      {post.imageUrl && (
        <div className={styles.postImageWrap}>
          <Image
            src={post.imageUrl}
            alt={post.body ? `Image : ${post.body.substring(0, 80)}` : `Image publiée par ${authorName}`}
            className={styles.postImage}
            width={600}
            height={400}
            style={{ width: '100%', height: 'auto' }}
            unoptimized
          />
        </div>
      )}
      <div className={styles.reactions}>
        {EMOJIS.map((emoji) => {
          const r = post.reactions[emoji]
          const count = r?.count ?? 0
          return (
            <button
              key={emoji}
              className={`${styles.reactionBtn} ${r?.hasReacted ? styles.reactionActive : ''}`}
              onClick={() => toggleReaction({ postId: post._id, emoji })}
              aria-label={`${emoji} ${count}`}
              aria-pressed={r?.hasReacted ?? false}
            >
              {emoji} {count > 0 && <span aria-hidden="true">{count}</span>}
            </button>
          )
        })}
        {post.hasReported && <span className={styles.reportedTag}>Signalé</span>}
      </div>
      {showReport && (
        <div className={styles.reportForm}>
          <select className={styles.reportSelect} value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
            <option value="">Raison du signalement…</option>
            <option value="phone">Numéro de téléphone partagé</option>
            <option value="spam">Spam / publicité</option>
            <option value="inappropriate">Contenu inapproprié</option>
            <option value="other">Autre</option>
          </select>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={styles.reportSubmit} onClick={handleReport} disabled={!reportReason}>Envoyer</button>
            <button className={styles.reportCancel} onClick={() => setShowReport(false)}>Annuler</button>
          </div>
        </div>
      )}
    </article>
  )
}

function PostSkeleton() {
  return (
    <div className={styles.post} aria-hidden="true">
      <div className={styles.skeletonHeader} />
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonLineShort} />
    </div>
  )
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'À l\'instant'
  const m = Math.floor(s / 60)
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `Il y a ${d}j`
  return new Date(ts).toLocaleDateString('fr-CA')
}
