'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import styles from '../overview.module.css'
import cStyles from './categories.module.css'

export default function AdminCategoriesPage() {
  const categories = useQuery(api.portals.listPortalsAdmin)
  const seedPortals = useMutation(api.portals.seedPortals)
  const reseedPortals = useMutation(api.portals.reseedPortals)
  const updatePortal = useMutation(api.portals.updatePortal)

  const isEmpty = categories !== null && categories !== undefined && categories.length === 0

  async function handleSeed() {
    if (!confirm('Seed the 15 default categories? This only runs if the list is empty.')) return
    await seedPortals()
  }

  async function handleReseed() {
    if (!confirm('This will DELETE all existing categories and re-create the 15 defaults. Vendor category assignments will break. Continue?')) return
    await reseedPortals()
  }

  async function handleToggle(id: string, current: boolean) {
    await updatePortal({ portalId: id as any, isActive: !current })
  }

  return (
    <div className={styles.page}>
      <div className={cStyles.header}>
        <h1 className={styles.title}>Categories</h1>
        <div className={cStyles.actions}>
          {isEmpty && (
            <button className="btn btn-primary" onClick={handleSeed}>
              Seed 15 categories
            </button>
          )}
          <button className={`btn btn-secondary ${cStyles.danger}`} onClick={handleReseed}>
            Reseed (reset all)
          </button>
        </div>
      </div>

      {categories === undefined ? (
        <p className={cStyles.loading}>Loading…</p>
      ) : categories === null ? (
        <p className={cStyles.loading}>Role not set — go to Convex dashboard and set your role to admin.</p>
      ) : isEmpty ? (
        <div className={cStyles.empty}>
          <p className={cStyles.emptyIcon}>🗂</p>
          <p className={cStyles.emptyText}>No categories yet. Click <strong>Seed 15 categories</strong> to get started.</p>
        </div>
      ) : (
        <div className={styles.section}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Emoji</th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Toggle</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat._id}>
                    <td>{cat.order}</td>
                    <td className={cStyles.emoji}>{cat.emoji}</td>
                    <td className={styles.tdName}>{cat.name}</td>
                    <td><code className={cStyles.slug}>{cat.slug}</code></td>
                    <td>
                      <span className={cat.isActive ? styles.statusActive : styles.statusInactive}>
                        ● {cat.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={cStyles.toggleBtn}
                        onClick={() => handleToggle(cat._id, cat.isActive)}
                      >
                        {cat.isActive ? 'Hide' : 'Show'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
