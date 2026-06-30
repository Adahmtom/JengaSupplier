import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { PortalSidebar } from '@/components/portal/PortalSidebar'
import styles from './portal.module.css'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className={styles.layout}>
      <PortalSidebar />
      <main className={styles.main} id="main-content">
        {children}
      </main>
    </div>
  )
}
