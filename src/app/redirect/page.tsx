'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

const ADMIN_ROLES = new Set(['super_admin', 'admin', 'moderator'])

export default function RedirectPage() {
  const router = useRouter()
  const me = useQuery(api.users.getMe)
  const ensureUser = useMutation(api.users.ensureUser)
  const ensured = useRef(false)

  useEffect(() => {
    if (me === undefined) return // still loading
    if (me === null) {
      // User authenticated in Clerk but not yet in Convex — create them now
      if (!ensured.current) {
        ensured.current = true
        ensureUser().catch(() => {})
      }
      return
    }
    if (ADMIN_ROLES.has(me.role)) {
      router.replace('/admin')
    } else {
      router.replace('/feed')
    }
  }, [me, router, ensureUser])

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
