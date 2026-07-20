'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ActivateInner() {
  const router = useRouter()
  const params = useSearchParams()
  const sessionId = params.get('session_id') ?? ''

  useEffect(() => {
    // Forward session_id to feed so activation works even if localStorage was wiped by Clerk's redirect cycle
    const dest = sessionId ? `/feed?welcome=1&session_id=${sessionId}` : '/feed?welcome=1'
    router.replace(dest)
  }, [router, sessionId])

  return <div style={{ minHeight: '100vh', background: '#000' }} />
}

export default function ActivatePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000' }} />}>
      <ActivateInner />
    </Suspense>
  )
}
