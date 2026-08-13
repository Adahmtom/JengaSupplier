import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Every 6 hours: check for paid members without access and notify them
crons.interval(
  'access-monitor',
  { hours: 6 },
  internal.monitor.checkAndNotify,
)

export default crons
