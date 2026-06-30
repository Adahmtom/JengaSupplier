'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import styles from './community-mod.module.css'

export default function AdminCommunityPage() {
  const posts = useQuery(api.community.listReportedPosts)
  const hidePost = useMutation(api.community.hidePost)
  const deletePost = useMutation(api.community.deletePost)

  if (posts === undefined) return <div className={styles.loading}>Chargement…</div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Modération communauté</h1>
        <p className={styles.subtitle}>
          {posts.length === 0
            ? 'Aucun signalement en attente'
            : `${posts.length} publication${posts.length > 1 ? 's' : ''} signalée${posts.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {posts.length === 0 ? (
        <div className={styles.empty}>
          <span>✅</span>
          <p>Aucun contenu signalé. Tout est propre.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {posts.map((post) => (
            <div key={post!._id} className={`${styles.card} ${post!.isHidden ? styles.cardHidden : ''}`}>
              <div className={styles.cardHeader}>
                <span className={styles.badge}>
                  ⚑ {(post as any).reportCount} signalement{(post as any).reportCount > 1 ? 's' : ''}
                </span>
                {post!.isHidden && <span className={styles.hiddenTag}>Masqué</span>}
              </div>

              {post!.body && <p className={styles.body}>{post!.body}</p>}

              {!post!.body && <p className={styles.bodyEmpty}>(Publication sans texte — contient une image)</p>}

              <div className={styles.meta}>
                <span>ID: {post!._id}</span>
                <span>Portail: {post!.portalId}</span>
              </div>

              <div className={styles.actions}>
                {!post!.isHidden && (
                  <button
                    className={styles.hideBtn}
                    onClick={() => hidePost({ postId: post!._id as Id<'communityPosts'>, reason: 'Signalé par les membres' })}
                  >
                    🚫 Masquer
                  </button>
                )}
                <button
                  className={styles.deleteBtn}
                  onClick={async () => {
                    if (!confirm('Supprimer définitivement cette publication ?')) return
                    await deletePost({ postId: post!._id as Id<'communityPosts'> })
                  }}
                >
                  🗑 Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
