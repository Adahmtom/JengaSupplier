import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Every 6 hours: fix blank emails, sync Stripe subs, migrate placeholders
crons.interval(
  'access-monitor',
  { hours: 6 },
  internal.monitor.checkAndFix,
)

export default crons
