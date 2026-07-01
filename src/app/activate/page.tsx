'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Subscription activation now happens silently on the feed page.
// This page exists only as the Clerk post-signup redirect target.
export default function ActivatePage() {
  const router = useRouter()
  useEffect(() => { router.replace('/feed?welcome=1') }, [router])
  return <div style={{ minHeight: '100vh', background: '#000' }} />
}
