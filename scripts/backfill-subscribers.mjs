#!/usr/bin/env node
/**
 * Backfill all Stripe subscribers into Convex.
 * Reads all four subscription CSVs and calls provisionSubscriberByEmail
 * for every active subscriber so they have instant access.
 *
 * Usage: node scripts/backfill-subscribers.mjs
 */

import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const CSV_FILES = [
  '/Users/adahmtom/Downloads/subscriptions.csv',
  '/Users/adahmtom/Downloads/subscriptions (1).csv',
  '/Users/adahmtom/Downloads/subscriptions (2).csv',
  '/Users/adahmtom/Downloads/subscriptions (3).csv',
]

function parseCSV(content) {
  const lines = content.trim().split('\n')
  const headers = lines[0].split(',')
  return lines.slice(1).map(line => {
    // Handle quoted fields
    const values = []
    let current = ''
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes }
      else if (ch === ',' && !inQuotes) { values.push(current); current = '' }
      else { current += ch }
    }
    values.push(current)
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (values[i] ?? '').trim()]))
  })
}

// Deduplicate: keep only one row per email (prefer active, then most recent)
function dedup(rows) {
  const byEmail = new Map()
  for (const row of rows) {
    const email = row['Customer Email']?.toLowerCase()
    if (!email) continue
    const existing = byEmail.get(email)
    if (!existing) { byEmail.set(email, row); continue }
    // Prefer active over non-active
    if (row['Status'] === 'active' && existing['Status'] !== 'active') {
      byEmail.set(email, row)
    }
    // Among same status, prefer later period end
    else if (row['Status'] === existing['Status']) {
      const newEnd = new Date(row['Current Period End (UTC)']).getTime()
      const oldEnd = new Date(existing['Current Period End (UTC)']).getTime()
      if (newEnd > oldEnd) byEmail.set(email, row)
    }
  }
  return [...byEmail.values()]
}

async function main() {
  // Read and merge all CSVs
  let allRows = []
  for (const file of CSV_FILES) {
    try {
      const content = readFileSync(file, 'utf8')
      const rows = parseCSV(content)
      console.log(`Loaded ${rows.length} rows from ${file}`)
      allRows.push(...rows)
    } catch (e) {
      console.error(`Failed to read ${file}:`, e.message)
    }
  }

  // Only active subscriptions
  const active = allRows.filter(r => r['Status'] === 'active')
  console.log(`\nTotal active rows: ${active.length}`)

  // Deduplicate by email — one provision call per subscriber
  const unique = dedup(active)
  console.log(`Unique subscribers to provision: ${unique.length}\n`)

  let ok = 0
  let failed = 0

  for (const row of unique) {
    const email = row['Customer Email']?.toLowerCase()
    const name = row['Customer Name'] ?? ''
    const stripeCustomerId = row['Customer ID']
    const stripeSubscriptionId = row['id']
    const stripePriceId = row['Plan']
    const periodEndStr = row['Current Period End (UTC)']
    const currentPeriodEnd = new Date(periodEndStr + ' UTC').getTime()

    if (!email || !stripeSubscriptionId || !stripePriceId) {
      console.warn(`Skipping incomplete row: ${JSON.stringify(row)}`)
      continue
    }

    const args = JSON.stringify({
      email,
      name,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      currentPeriodEnd,
    })

    try {
      execSync(
        `npx convex run --prod seedNewSuppliers:provisionSubscriberByEmail '${args}'`,
        { cwd: join(__dirname, '..'), stdio: 'pipe', timeout: 30000 }
      )
      console.log(`✓ ${email}`)
      ok++
    } catch (e) {
      const out = e.stderr?.toString() ?? e.stdout?.toString() ?? e.message
      console.error(`✗ ${email} — ${out.split('\n')[0]}`)
      failed++
    }
  }

  console.log(`\nDone: ${ok} provisioned, ${failed} failed`)
}

main().catch(err => { console.error(err); process.exit(1) })
