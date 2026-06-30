import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import styles from './admin.module.css'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/admin-login')

  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <main className={styles.main}>{children}</main>
    </div>
  )
}
