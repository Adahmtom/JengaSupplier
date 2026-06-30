'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

const ADMIN_ROLES = new Set(['super_admin', 'admin', 'moderator'])

export default function RedirectPage() {
  const router = useRouter()
  const me = useQuery(api.users.getMe)

  useEffect(() => {
    if (me === undefined) return // still loading
    if (me === null) {
      // Not in Convex yet — wait a moment and retry via reload
      const t = setTimeout(() => router.replace('/redirect'), 1200)
      return () => clearTimeout(t)
    }
    if (ADMIN_ROLES.has(me.role)) {
      router.replace('/admin')
    } else {
      router.replace('/feed')
    }
  }, [me, router])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000',
      fontFamily: 'Barlow, sans-serif',
      color: '#8A6EBB',
      fontSize: 13,
      letterSpacing: '0.1em',
    }}>
      Chargement…
    </div>
  )
}
