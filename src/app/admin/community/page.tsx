'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import styles from './community-mod.module.css'

type ReportedPost = NonNullable<NonNullable<ReturnType<typeof useQuery<typeof api.community.listReportedPosts>>>[number]> & {
  reportCount: number
}

export default function AdminCommunityPage() {
  const posts = useQuery(api.community.listReportedPosts)
  const hidePost = useMutation(api.community.hidePost)
  const deletePost = useMutation(api.community.deletePost)

  if (posts === undefined) return <div className={styles.loading}>Chargement…</div>
  if (!posts) return <div className={styles.loading}>Accès refusé.</div>

  const reportedPosts = posts as ReportedPost[]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Modération communauté</h1>
        <p className={styles.subtitle}>
          {reportedPosts.length === 0
            ? 'Aucun signalement en attente'
            : `${reportedPosts.length} publication${reportedPosts.length > 1 ? 's' : ''} signalée${reportedPosts.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {reportedPosts.length === 0 ? (
        <div className={styles.empty}>
          <span>✅</span>
          <p>Aucun contenu signalé. Tout est propre.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {reportedPosts.map((post) => (
            <PostRow
              key={post._id}
              post={post}
              onHide={async () => {
                try {
                  await hidePost({ postId: post._id as Id<'communityPosts'>, reason: 'Signalé par les membres' })
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Erreur lors du masquage.')
                }
              }}
              onDelete={async () => {
                if (!confirm('Supprimer définitivement cette publication ?')) return
                try {
                  await deletePost({ postId: post._id as Id<'communityPosts'> })
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Erreur lors de la suppression.')
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PostRow({
  post,
  onHide,
  onDelete,
}: {
  post: ReportedPost
  onHide: () => void
  onDelete: () => void
}) {
  return (
    <div className={`${styles.card} ${post.isHidden ? styles.cardHidden : ''}`}>
      <div className={styles.cardHeader}>
        <span className={styles.badge}>
          ⚑ {post.reportCount} signalement{post.reportCount > 1 ? 's' : ''}
        </span>
        {post.isHidden && <span className={styles.hiddenTag}>Masqué</span>}
      </div>

      {post.body
        ? <p className={styles.body}>{post.body}</p>
        : <p className={styles.bodyEmpty}>(Publication sans texte — contient une image)</p>
      }

      <div className={styles.meta}>
        <span>Portail: {post.portalId}</span>
      </div>

      <div className={styles.actions}>
        {!post.isHidden && (
          <button className={styles.hideBtn} onClick={onHide}>
            🚫 Masquer
          </button>
        )}
        <button className={styles.deleteBtn} onClick={onDelete}>
          🗑 Supprimer
        </button>
      </div>
    </div>
  )
}
