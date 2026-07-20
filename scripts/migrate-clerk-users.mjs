/**
 * Clerk Dev → Production user migration script
 *
 * Usage:
 *   CLERK_DEV_SECRET=sk_test_xxx CLERK_PROD_SECRET=sk_live_xxx node scripts/migrate-clerk-users.mjs
 *
 * What it does:
 *   1. Fetches all users from your dev Clerk instance
 *   2. Creates each one in your production Clerk instance
 *   3. Skips users whose email already exists in production
 *   4. Prints a summary at the end
 *
 * Users are created WITHOUT a password — Clerk will let them sign in via
 * magic link or they can use "Forgot password" to set one.
 */

const DEV_SECRET  = process.env.CLERK_DEV_SECRET
const PROD_SECRET = process.env.CLERK_PROD_SECRET

if (!DEV_SECRET || !PROD_SECRET) {
  console.error('❌  Set CLERK_DEV_SECRET and CLERK_PROD_SECRET before running.')
  process.exit(1)
}

const DEV_BASE  = 'https://api.clerk.com/v1'
const PROD_BASE = 'https://api.clerk.com/v1'

async function clerkGet(base, path, secret) {
  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${secret}` },
  })
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${await res.text()}`)
  return res.json()
}

async function clerkPost(base, path, secret, body) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  return { status: res.status, body: await res.json() }
}

// Fetch ALL users from dev (handles pagination)
async function fetchAllDevUsers() {
  const users = []
  let offset = 0
  const limit = 500

  while (true) {
    const page = await clerkGet(DEV_BASE, `/users?limit=${limit}&offset=${offset}`, DEV_SECRET)
    if (!Array.isArray(page) || page.length === 0) break
    users.push(...page)
    if (page.length < limit) break
    offset += limit
  }

  return users
}

// Fetch all existing prod emails so we can skip duplicates
async function fetchProdEmails() {
  const users = []
  let offset = 0
  const limit = 500

  while (true) {
    const page = await clerkGet(PROD_BASE, `/users?limit=${limit}&offset=${offset}`, PROD_SECRET)
    if (!Array.isArray(page) || page.length === 0) break
    users.push(...page)
    if (page.length < limit) break
    offset += limit
  }

  return new Set(
    users.flatMap(u => u.email_addresses.map(e => e.email_address.toLowerCase()))
  )
}

async function main() {
  console.log('🔍  Fetching users from development...')
  const devUsers = await fetchAllDevUsers()
  console.log(`    Found ${devUsers.length} dev users\n`)

  console.log('🔍  Fetching existing production emails...')
  const prodEmails = await fetchProdEmails()
  console.log(`    Found ${prodEmails.size} existing prod emails\n`)

  let created = 0
  let skipped = 0
  let failed  = 0

  for (const user of devUsers) {
    const primaryEmail = user.email_addresses?.find(e => e.id === user.primary_email_address_id)
    const email = primaryEmail?.email_address

    if (!email) {
      console.log(`  ⚠️  Skipping user ${user.id} — no primary email`)
      skipped++
      continue
    }

    if (prodEmails.has(email.toLowerCase())) {
      console.log(`  ⏭  ${email} — already in production, skipping`)
      skipped++
      continue
    }

    const payload = {
      email_address: [email],
      first_name: user.first_name || undefined,
      last_name:  user.last_name  || undefined,
      // No password — user will sign in via magic link / forgot password
      skip_password_requirement: true,
    }

    if (user.username) payload.username = user.username

    const { status, body } = await clerkPost(PROD_BASE, '/users', PROD_SECRET, payload)

    if (status === 200 || status === 201) {
      console.log(`  ✅  ${email} — created`)
      created++
    } else {
      const msg = body?.errors?.[0]?.message ?? JSON.stringify(body)
      console.log(`  ❌  ${email} — failed (${status}): ${msg}`)
      failed++
    }

    // Small delay to stay within Clerk rate limits
    await new Promise(r => setTimeout(r, 100))
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Migration complete
  ✅  Created : ${created}
  ⏭  Skipped : ${skipped}
  ❌  Failed  : ${failed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Users were created WITHOUT passwords.
They can sign in using magic link or "Forgot password" on your site.
`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
