'use client'

import Image from 'next/image'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { formatRelativeDate } from '@/lib/utils'
import styles from './drop-card.module.css'

type Drop = {
  _id: Id<'drops'>
  title: string
  body: string
  phone?: string | null
  email?: string | null
  isAlert: boolean
  isPinned: boolean
  isVerified?: boolean | null
  likeCount: number
  isLiked: boolean
  commentCount: number
  imageUrl: string | null
  videoUrl?: string | null
  portalId: Id<'portals'>
  _creationTime: number
}

type DropCardProps = {
  drop: Drop
  portalName?: string
}

export function DropCard({ drop, portalName }: DropCardProps) {
  const toggleLike = useMutation(api.drops.toggleLike)

  async function handleLike() {
    await toggleLike({ dropId: drop._id })
  }

  return (
    <article
      className={`${styles.card} ${drop.isAlert ? styles.alertCard : ''} ${drop.isPinned ? styles.pinnedCard : ''}`}
      aria-label={drop.title}
    >
      {/* Video takes priority over image when both exist */}
      {drop.videoUrl ? (
        <div className={styles.videoWrap}>
          <video
            src={drop.videoUrl}
            controls
            controlsList="nodownload nofullscreen"
            disablePictureInPicture
            preload="metadata"
            playsInline
            className={styles.video}
            aria-label={`Vidéo entrepôt — ${drop.title}`}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      ) : drop.imageUrl ? (
        <div className={styles.imageWrap}>
          <Image
            src={drop.imageUrl}
            alt=""
            fill
            className={styles.image}
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </div>
      ) : null}

      <div className={styles.body}>
        <div className={styles.tag}>
          {drop.isAlert ? (
            <span className="badge badge-alert">🎥 Warehouse Video</span>
          ) : (
            <span className={styles.portal}>✦ {portalName}</span>
          )}
          {drop.isPinned && (
            <span className="badge badge-gold" style={{ marginLeft: '6px' }}>Pinned</span>
          )}
        </div>

        <h2 className={`${styles.title} ${drop.isAlert ? styles.alertTitle : ''}`}>
          {drop.isVerified && (
            <span className={styles.verifiedBadge} title="Fournisseur vérifié par Jenga" aria-label="Vérifié">
              ✓
            </span>
          )}
          {drop.title}
        </h2>

        <p className={styles.text}>{drop.body}</p>

        {(drop.phone || drop.email) && (
          <div className={styles.contact}>
            {drop.phone && (
              <a href={`tel:${drop.phone}`} className={styles.contactItem}>
                <span className={styles.contactIcon}>📞</span>
                {drop.phone}
              </a>
            )}
            {drop.email && (
              <a href={`mailto:${drop.email}`} className={styles.contactItem}>
                <span className={styles.contactIcon}>✉</span>
                {drop.email}
              </a>
            )}
          </div>
        )}

        <div className={styles.footer}>
          <span className={styles.date}>{formatRelativeDate(drop._creationTime)}</span>
          <div className={styles.actions}>
            <button
              className={`${styles.action} ${drop.isLiked ? styles.liked : ''}`}
              onClick={handleLike}
              aria-label={drop.isLiked ? 'Unlike' : 'Like'}
              aria-pressed={drop.isLiked}
            >
              ♥ {drop.likeCount}
            </button>
            <span className={styles.action}>💬 {drop.commentCount}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
