import { RateLimiter } from '@convex-dev/rate-limiter'
import { components } from '../_generated/api'

const MINUTE = 60_000
const HOUR   = 60 * MINUTE

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Waitlist: max 3 submissions per IP-equivalent (per user) per hour
  joinWaitlist: { kind: 'fixed window', rate: 3, period: HOUR },

  // Comments: max 10 per user per minute (prevents comment spam floods)
  addComment: { kind: 'token bucket', rate: 10, period: MINUTE, capacity: 3 },

  // Community posts: max 5 per user per minute
  sendPost: { kind: 'token bucket', rate: 5, period: MINUTE, capacity: 2 },

  // Replies: max 10 per user per minute
  sendReply: { kind: 'token bucket', rate: 10, period: MINUTE, capacity: 3 },

  // Likes: max 30 per user per minute (generous but blocks bots)
  toggleLike: { kind: 'token bucket', rate: 30, period: MINUTE, capacity: 10 },

  // Invite redemption: max 5 attempts per user per hour (blocks invite brute-force)
  redeemInvite: { kind: 'fixed window', rate: 5, period: HOUR },
})
