'use client'

import { useRef, useState, useEffect } from 'react'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { useAuth } from '@clerk/nextjs'

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  const clientRef = useRef<ConvexReactClient | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  if (!clientRef.current && convexUrl) {
    clientRef.current = new ConvexReactClient(convexUrl)
  }
  if (!clientRef.current) return <>{children}</>
  return (
    <ConvexProviderWithClerk client={clientRef.current} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  )
}
