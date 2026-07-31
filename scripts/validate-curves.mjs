/**
 * Validates public/data/curves.json — the published retention-curve table.
 *
 * Structural + per-row rules (from the Phase A spec):
 *   - key present, matches /^[a-z0-9-]+$/, unique across models + segments
 *   - powertrain / body_class / price_band drawn from meta vocab
 *   - retention is exactly 5 entries
 *   - segment keys match the seg-{powertrain}-{body}-{band} convention
 *   - READY rows (status:"ready") must be fully cited & numerically sane:
 *       every retention in (0,1), strictly decreasing, source + source_url set,
 *       source_year set, spread_pct >= 0
 *   - TODO rows are reported as pending (not failures) — the scaffold is all TODO
 *
 * Exit non-zero on any structural error or invalid READY row.
 * Pass --strict to also fail while any TODO rows remain (the "done" gate).
 *
 * Run: node scripts/validate-curves.mjs [--strict]
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { segmentKey } from '../src/lib/curves.js'

const strict = process.argv.includes('--strict')
const here = dirname(fileURLToPath(import.meta.url))
const FILE = resolve(here, '../public/data/curves.json')

let errors = 0
let pending = 0
const fail = (msg) => {
  errors++
  console.log(`✗ ${msg}`)
}

const doc = JSON.parse(readFileSync(FILE, 'utf8'))

// ── Structure ──────────────────────────────────────────────────────
if (!doc.meta) fail('missing top-level "meta"')
if (!Array.isArray(doc.models)) fail('"models" must be an array')
if (!Array.isArray(doc.segments)) fail('"segments" must be an array')

const meta = doc.meta ?? {}
const powertrains = new Set(meta.powertrains ?? [])
const bodyClasses = new Set(meta.body_classes ?? [])
const priceBands = new Set(meta.price_bands ?? [])
const bounds = meta.price_band_bounds ?? {}
if (!powertrains.size) fail('meta.powertrains is empty')
if (!bodyClasses.size) fail('meta.body_classes is empty')
if (!priceBands.size) fail('meta.price_bands is empty')
if (typeof bounds.budget_max !== 'number' || typeof bounds.premium_min !== 'number') {
  fail('meta.price_band_bounds must set numeric budget_max and premium_min')
}

const KEY_RE = /^[a-z0-9-]+$/
const seen = new Set()

/** @param {'model'|'segment'} kind */
function validateRow(row, kind, i) {
  const where = `${kind}[${i}] (${row?.key ?? '?'})`

  // key
  if (typeof row.key !== 'string' || !KEY_RE.test(row.key)) {
    fail(`${where}: key missing or not /^[a-z0-9-]+$/`)
  } else if (seen.has(row.key)) {
    fail(`${where}: duplicate key`)
  } else {
    seen.add(row.key)
  }

  // vocab
  if (!powertrains.has(row.powertrain)) fail(`${where}: powertrain "${row.powertrain}" not in meta.powertrains`)
  if (!bodyClasses.has(row.body_class)) fail(`${where}: body_class "${row.body_class}" not in meta.body_classes`)
  if (!priceBands.has(row.price_band)) fail(`${where}: price_band "${row.price_band}" not in meta.price_bands`)

  // segment key convention
  if (kind === 'segment') {
    const expected = segmentKey(row.powertrain, row.body_class, row.price_band)
    if (row.key !== expected) fail(`${where}: segment key should be "${expected}"`)
  }

  // retention shape
  if (!Array.isArray(row.retention) || row.retention.length !== 5) {
    fail(`${where}: retention must be an array of exactly 5 entries`)
    return
  }

  // status
  if (row.status !== 'todo' && row.status !== 'ready') {
    fail(`${where}: status must be "todo" or "ready"`)
  }

  const hasFigures = row.retention.some((v) => v !== null)
  if (row.status === 'ready' || hasFigures) {
    validateReady(row, where)
  } else {
    pending++
  }
}

function validateReady(row, where) {
  if (row.status !== 'ready') {
    fail(`${where}: has figures but status is not "ready" (set it once cited)`)
  }
  const r = row.retention
  if (!r.every((v) => typeof v === 'number')) {
    fail(`${where}: ready row has null retention entries`)
    return
  }
  for (const v of r) {
    if (!(v > 0 && v < 1)) fail(`${where}: retention ${v} not in (0,1)`)
  }
  for (let k = 1; k < r.length; k++) {
    if (!(r[k] < r[k - 1])) fail(`${where}: retention not strictly decreasing at year ${k + 1} (${r[k - 1]} → ${r[k]})`)
  }
  if (typeof row.spread_pct !== 'number' || row.spread_pct < 0) {
    fail(`${where}: spread_pct must be a number >= 0`)
  }
  if (typeof row.source !== 'string' || !row.source.trim()) fail(`${where}: source required`)
  if (typeof row.source_url !== 'string' || !/^https?:\/\//.test(row.source_url)) {
    fail(`${where}: source_url must be an http(s) URL`)
  }
  if (typeof row.source_year !== 'number') fail(`${where}: source_year required`)
  if (row.evidence !== 'published' && row.evidence !== 'derived') {
    fail(`${where}: evidence must be "published" or "derived"`)
  }
  if (typeof row.shape_assumption !== 'string' || !row.shape_assumption.trim()) {
    fail(`${where}: shape_assumption required`)
  }
  if (typeof row.source_note !== 'string' || !row.source_note.trim()) {
    fail(`${where}: source_note required`)
  }
}

if (Array.isArray(doc.models)) doc.models.forEach((r, i) => validateRow(r, 'model', i))
if (Array.isArray(doc.segments)) doc.segments.forEach((r, i) => validateRow(r, 'segment', i))

const total = (doc.models?.length ?? 0) + (doc.segments?.length ?? 0)
const ready = total - pending
console.log(
  `\n${total} rows — ${ready} ready, ${pending} pending TODO (${doc.models?.length ?? 0} models, ${doc.segments?.length ?? 0} segments)`,
)

if (strict && pending > 0) {
  fail(`--strict: ${pending} row(s) still TODO`)
}

if (errors === 0) {
  console.log(pending > 0 && !strict ? '✅ STRUCTURE VALID (figures still pending)' : '✅ ALL CHECKS PASSED')
  process.exit(0)
} else {
  console.log(`❌ ${errors} ERROR(S)`)
  process.exit(1)
}
