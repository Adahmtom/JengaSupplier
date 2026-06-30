'use client'

import { useEffect } from 'react'
import { ConvexReactClient, useMutation } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { useAuth, useUser } from '@clerk/nextjs'
import { api } from '../../convex/_generated/api'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

function UserSync() {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const upsert = useMutation(api.users.upsertUser)

  useEffect(() => {
    if (!isSignedIn || !user) return
    const email = user.primaryEmailAddress?.emailAddress ?? ''
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined
    upsert({ clerkId: user.id, email, name, imageUrl: user.imageUrl || undefined })
  }, [isSignedIn, user, upsert])

  return null
}

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <UserSync />
      {children}
    </ConvexProviderWithClerk>
  )
}
