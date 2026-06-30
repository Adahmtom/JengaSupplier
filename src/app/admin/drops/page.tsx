'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import { formatDate } from '@/lib/utils'
import styles from '../overview.module.css'
import dStyles from './drops.module.css'

export default function AdminDropsPage() {
  const drops = useQuery(api.drops.listAllDropsAdmin)
  const updateDrop = useMutation(api.drops.updateDrop)
  const deleteDrop = useMutation(api.drops.deleteDrop)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleTogglePublish(dropId: Id<'drops'>, current: boolean) {
    await updateDrop({ dropId, isPublished: !current })
  }

  async function handleDelete(dropId: Id<'drops'>, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeleting(dropId)
    try {
      await deleteDrop({ dropId })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className={styles.page}>
      <div className={dStyles.header}>
        <h1 className={styles.title}>All Vendors</h1>
        <a href="/admin/new" className="btn btn-primary" style={{ fontSize: 13 }}>+ New Vendor</a>
      </div>

      <div className={styles.section}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Portal</th>
                <th>Created</th>
                <th>Likes</th>
                <th>Comments</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drops === undefined ? (
                <tr><td colSpan={7} className={styles.loading}>Loading…</td></tr>
              ) : drops === null ? (
                <tr><td colSpan={7} className={styles.loading}>Role not set — go to Convex dashboard and set your role to admin.</td></tr>
              ) : drops.length === 0 ? (
                <tr><td colSpan={7} className={styles.loading}>No drops yet. <a href="/admin/new">Create one.</a></td></tr>
              ) : drops.map((drop) => (
                <tr key={drop._id}>
                  <td className={styles.tdName}>
                    {drop.isPinned && <span className={dStyles.pin} title="Pinned">📌 </span>}
                    {drop.isAlert && <span className={dStyles.alert} title="Alert">⚠ </span>}
                    {drop.title}
                  </td>
                  <td>{drop.portalId}</td>
                  <td>{formatDate(drop._creationTime)}</td>
                  <td>{drop.likeCount}</td>
                  <td>{drop.commentCount}</td>
                  <td>
                    <span className={drop.isPublished ? styles.statusActive : styles.statusInactive}>
                      ● {drop.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className={dStyles.actions}>
                    <button
                      className={dStyles.actionBtn}
                      onClick={() => handleTogglePublish(drop._id, drop.isPublished ?? false)}
                    >
                      {drop.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      className={`${dStyles.actionBtn} ${dStyles.danger}`}
                      onClick={() => handleDelete(drop._id, drop.title)}
                      disabled={deleting === drop._id}
                    >
                      {deleting === drop._id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
