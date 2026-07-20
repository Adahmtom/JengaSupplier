#!/usr/bin/env node
/**
 * Provisions the 61 unmatched Stripe subscribers who have no Clerk match.
 * Run: node scripts/provision-unmatched.mjs
 *
 * Requires CONVEX_URL and CONVEX_DEPLOY_KEY in environment or .env.local
 */

import { createReadStream } from 'fs'
import { resolve } from 'path'

const UNMATCHED = [
  { subscriptionId: "sub_1TvNn8CXOL4Vjbnhi2nkLT8N", customerId: "cus_UvEFdLsWX5C9Az", email: "justyle1@hotmail.com" },
  { subscriptionId: "sub_1TvKrOCXOL4VjbnhGGGsxSDy", customerId: "cus_UvBDTz6Ynug5Fk", email: "mariakabiona@gmail.com" },
  { subscriptionId: "sub_1TvI5ECXOL4VjbnhEdytce9s", customerId: "cus_Uv8LsLpOTpcM2i", email: "miwouondiaicha@gmail.com" },
  { subscriptionId: "sub_1TvH7GCXOL4Vjbnh697OpCd0", customerId: "cus_Uv7LEbipiD2ODj", email: "jocelynekoua0912@gmail.com" },
  { subscriptionId: "sub_1TvCG8CXOL4VjbnhgRcdFcGP", customerId: "cus_Uv2KRGK19yx0CP", email: "rosalineayi5@gmail.com" },
  { subscriptionId: "sub_1TvBcQCXOL4VjbnhNuipJ86Z", customerId: "cus_Uv1fih7dvaLtmV", email: "iamimany148@gmail.com" },
  { subscriptionId: "sub_1Tn43qCXOL4VjbnhS5ldUzr3", customerId: "cus_UmdKkprRKTLXzB", email: "dayadamali@gmail.com" },
  { subscriptionId: "sub_1Tn1vXCXOL4VjbnhxrA7UKq1", customerId: "cus_Umb7YpQjKEiwgY", email: "saammiss1@gmail.com" },
  { subscriptionId: "sub_1Tn1ruCXOL4Vjbnh26oKsVsR", customerId: "cus_Umb4LP4zBYVsyC", email: "diallorima212@gmail.com" },
  { subscriptionId: "sub_1Tn1oPCXOL4VjbnhFBNzwMql", customerId: "cus_Umb0ZcdmMIowH1", email: "guedenonflorence5@gmail.com" },
  { subscriptionId: "sub_1Tn1l7CXOL4VjbnhG1iKWUyg", customerId: "cus_UmaxvMQYnJJjpG", email: "irenemotso@yahoo.com" },
  { subscriptionId: "sub_1Tn1kcCXOL4VjbnhCRWDBXWQ", customerId: "cus_Umaw8fPgAsyTfy", email: "barfama@yahoo.fr" },
  { subscriptionId: "sub_1Tn1hdCXOL4VjbnhmNHNu7cX", customerId: "cus_UmatcEiJhOrS7Q", email: "elomjer31@gmail.com" },
  { subscriptionId: "sub_1Tn1hECXOL4VjbnhrvaSt7Cz", customerId: "cus_UmasehRJRpC67a", email: "wandjiandree1@gmail.com" },
  { subscriptionId: "sub_1Tn1avCXOL4VjbnhWLycYmLo", customerId: "cus_Umam7KKHlhyZ8Z", email: "gafouratoukabore@gmail.com" },
  { subscriptionId: "sub_1Tn1JNCXOL4VjbnhkCZCh6HB", customerId: "cus_UmaUZBYjAldXp0", email: "kaniebianco@gmail.com" },
  { subscriptionId: "sub_1Tmia3CXOL4Vjbnhgi8LbzlN", customerId: "cus_UmH8Qf0pi9lNcw", email: "ingabireastridcelia@icloud.com" },
  { subscriptionId: "sub_1TcZbSCXOL4Vjbnh8UQ0s8f6", customerId: "cus_UbnB6pfgg7E4Q9", email: "maidial224@gmail.com" },
  { subscriptionId: "sub_1TS20uCXOL4VjbnhIR810zDd", customerId: "cus_PmV1yMPugmaL5g", email: "billymelissa84@gmail.com" },
  { subscriptionId: "sub_1TS1zICXOL4VjbnhvXXZ8AZF", customerId: "cus_UQtmP6wsCUb4oF", email: "saratapro@yahoo.com" },
  { subscriptionId: "sub_1T340CCXOL4VjbnhyBNaNDQW", customerId: "cus_QD24BjEdOcT7uK", email: "titiab51@gmail.com" },
  { subscriptionId: "sub_1T2qGzCXOL4VjbnhiHKjbAmc", customerId: "cus_U0s1dRKUlUCWRj", email: "capturemailhabsa@gmail.com" },
  { subscriptionId: "sub_1SuY3eCXOL4VjbnhiDJ3Jrke", customerId: "cus_NnvOgHHmh6pBuy", email: "viangambi@gmail.com" },
  { subscriptionId: "sub_1SuIxkCXOL4VjbnhuYI6MSQw", customerId: "cus_NnvEMM6E1n1NYl", email: "amake1992@yahoo.fr" },
  { subscriptionId: "sub_1StRVwCXOL4VjbnhjRZD68u2", customerId: "cus_PH9lIjPH9kpmnj", email: "divinemudes@gmail.com" },
  { subscriptionId: "sub_1SpBHBCXOL4VjbnhblMbmphQ", customerId: "cus_TmkmRuRBTIh9vv", email: "shabine97100@gmail.com" },
  { subscriptionId: "sub_1SoyveCXOL4Vjbnh3miOcfAg", customerId: "cus_TmY1DH5g0MWUv3", email: "fabiolaedouard576@gmail.com" },
  { subscriptionId: "sub_1SovRuCXOL4Vjbnh89E361gL", customerId: "cus_TmUQLTzKqn2IBg", email: "yannickchimene.ngomanda@gmail.com" },
  { subscriptionId: "sub_1SojlDCXOL4Vjbnhb9TGRr7i", customerId: "cus_TmILwKEFgSN7JC", email: "dondybis@hotmail.com" },
  { subscriptionId: "sub_1SoKV9CXOL4VjbnhzqyHpGzi", customerId: "cus_TlsF1d1LRum3u2", email: "a.mickaella@gmail.com" },
  { subscriptionId: "sub_1SoDccCXOL4Vjbnh7kGXhTIA", customerId: "cus_RM9wtoLdQoDvEL", email: "haloua@live.fr" },
  { subscriptionId: "sub_1SoARuCXOL4VjbnhBfSwX8Qs", customerId: "cus_TlhrFnLrXcTOeJ", email: "clemyza@yahoo.fr" },
  { subscriptionId: "sub_1SoAFKCXOL4VjbnhwrQXcGvO", customerId: "cus_TlhedNd3NLpfFo", email: "acajou1980@hotmail.con" },
  { subscriptionId: "sub_1So9pfCXOL4Vjbnh8nKzZPKs", customerId: "cus_TlhEDkXAlvky7V", email: "971ddinga@gmail.com" },
  { subscriptionId: "sub_1So9i0CXOL4Vjbnhbj4nXMg7", customerId: "cus_Tlh6bN9pghvVpK", email: "christ2chance@gmail.com" },
  { subscriptionId: "sub_1So9edCXOL4VjbnhMP8bmW1h", customerId: "cus_Tlh2dN9A2oKlli", email: "madeleinepounde@yahoo.fr" },
  { subscriptionId: "sub_1So9QsCXOL4VjbnhWcTE2D0s", customerId: "cus_Tlgojmu6CGDtK7", email: "gaellefokam942@yahoo.com" },
  { subscriptionId: "sub_1So9QnCXOL4VjbnhoglQ5dV4", customerId: "cus_TlgoOOfYvRSmJC", email: "ompoumacretty@yahoo.fr" },
  { subscriptionId: "sub_1SmLTeCXOL4VjbnhRjHNkY2E", customerId: "cus_NnvLqMwbveij6S", email: "ernaamijekori@yahoo.fr" },
  { subscriptionId: "sub_1SmJTZCXOL4Vjbnhj1teYxCQ", customerId: "cus_Nqaav5UI0J4L3v", email: "jemlo.muhizi@gmail.com" },
  { subscriptionId: "sub_1SmJKbCXOL4Vjbnh78MxHe0S", customerId: "cus_NnvMDuCz0AZS95", email: "haliceba@gmail.com" },
  { subscriptionId: "sub_1SliTACXOL4VjbnhjDXoymgT", customerId: "cus_OCoTu3sRcJqwui", email: "naicha98@yahoo.com" },
  { subscriptionId: "sub_1SlhaACXOL4VjbnhKVMyOI8C", customerId: "cus_Tj9tWxjpN7KPRK", email: "hdelices@yahoo.com" },
  { subscriptionId: "sub_1SlbwyCXOL4VjbnhO323w9c9", customerId: "cus_SxkAOM1mOf5qQc", email: "hfbmarket@gmail.com" },
  { subscriptionId: "sub_1SlZWGCXOL4Vjbnh0zurFrTH", customerId: "cus_TioPsCabxFCeqx", email: "regine@maquelin.com" },
  { subscriptionId: "sub_1SlMpZCXOL4VjbnhJOjNAslN", customerId: "cus_TioSGHeiTfHXJW", email: "diawara.aisseta01@gmail.com" },
  // Note: regine@maquelin.com appears twice (two subscriptions) — second one skipped
  { subscriptionId: "sub_1SlMbTCXOL4Vjbnh6TOppU91", customerId: "cus_TioDipNh5NWPaT", email: "audreymegheu@gmail.com" },
  { subscriptionId: "sub_1SlMb9CXOL4VjbnhVWIbd3HU", customerId: "cus_NnvjyAdiUzDhZG", email: "delmagnifico03@gmail.com" },
  { subscriptionId: "sub_1SlLx2CXOL4VjbnhmrFMFyvz", customerId: "cus_TinYTZarYi5ONU", email: "pngominyem@gmail.com" },
  { subscriptionId: "sub_1SlLqCCXOL4Vjbnhn02sjzi2", customerId: "cus_TinR7dKnmoagq7", email: "panourolande@gmail.com" },
  { subscriptionId: "sub_1SlLm7CXOL4Vjbnhr3jAndJd", customerId: "cus_TinMc8up7eROMH", email: "aminabarry5285@gmail.com" },
  { subscriptionId: "sub_1SlLlaCXOL4VjbnhQxjbZItM", customerId: "cus_TinMLzpeORhbO2", email: "inoussaboubakari@outlook.com" },
  { subscriptionId: "sub_1SkC7LCXOL4VjbnhwHLmZAd1", customerId: "cus_Obi3enzkJOsKrD", email: "deroastou@gmail.com" },
  { subscriptionId: "sub_1SjpE6CXOL4VjbnhiYgwtDru", customerId: "cus_ThDfNrcuF9Lrnu", email: "carolekoumbil@yahoo.com" },
  { subscriptionId: "sub_1SjnszCXOL4Vjbnhr2avqCSb", customerId: "cus_ThCHnf4ZUeNPdH", email: "mabelle2e@gmail.com" },
  { subscriptionId: "sub_1SjnqFCXOL4VjbnhYsOkMFSI", customerId: "cus_ThCEE93W7NoNrI", email: "berthely.alexia@gmail.com" },
  { subscriptionId: "sub_1SjnTgCXOL4Vjbnh36U0aP4n", customerId: "cus_NnvK7qT158EewQ", email: "mymymutondo@gmail.com" },
  { subscriptionId: "sub_1Sj5M3CXOL4Vjbnh7lasGRcG", customerId: "cus_TgSG1ipwNV69Yl", email: "manizegwladys@yahoo.fr" },
  { subscriptionId: "sub_1NOVRHCXOL4VjbnhHZWYYy3B", customerId: "cus_OAr9omYgJCmvkv", email: "atchagny@gmail.com" },
  { subscriptionId: "sub_1NO6IICXOL4VjbnhWbU4uRME", customerId: "cus_NnzItzCHjXANpH", email: "eluxes.2022@gmail.com" },
]

const CONVEX_URL = 'https://coordinated-alpaca-421.convex.cloud'

// Call a Convex internal action via the HTTP API using the deploy token
async function runConvexAction(name, args) {
  const token = process.env.CONVEX_DEPLOY_TOKEN
  if (!token) throw new Error('Set CONVEX_DEPLOY_TOKEN env var (from Convex dashboard → Settings → Deploy key)')

  const res = await fetch(`${CONVEX_URL}/api/run/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Convex ${token}`,
    },
    body: JSON.stringify({ args }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Convex API error ${res.status}: ${text}`)
  }
  return res.json()
}

// Batch into chunks of 20 to avoid function timeout
function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

const chunks = chunk(UNMATCHED, 20)
let totalProvisioned = []
let totalPending = []
let totalFailed = []

for (let i = 0; i < chunks.length; i++) {
  console.log(`\nBatch ${i + 1}/${chunks.length} (${chunks[i].length} entries)…`)
  try {
    const result = await runConvexAction('backfill:provisionUnmatchedUsers', {
      unmatched: chunks[i],
    })
    console.log(`  provisioned: ${result.provisioned?.length ?? 0}`)
    console.log(`  pending (not yet in Clerk): ${result.pending?.length ?? 0}`)
    if (result.failed?.length) console.warn(`  FAILED: ${JSON.stringify(result.failed)}`)
    totalProvisioned.push(...(result.provisioned ?? []))
    totalPending.push(...(result.pending ?? []))
    totalFailed.push(...(result.failed ?? []))
  } catch (err) {
    console.error(`  Batch ${i + 1} error:`, err.message)
  }
}

console.log('\n═══════════════════════════════════════════════════════')
console.log(`TOTAL provisioned (immediate access): ${totalProvisioned.length}`)
console.log(`TOTAL pending (will self-heal on sign-in): ${totalPending.length}`)
console.log(`TOTAL failed (review manually): ${totalFailed.length}`)
if (totalProvisioned.length) console.log('\nProvisioned:', totalProvisioned.join(', '))
if (totalPending.length) console.log('\nPending:', totalPending.join(', '))
if (totalFailed.length) console.log('\nFailed:', JSON.stringify(totalFailed, null, 2))
