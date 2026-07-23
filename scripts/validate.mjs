/**
 * Validates the projection engine against the paper's published figures.
 * Run: node scripts/validate.mjs
 */
import {
  calcNPVBreakdown,
  getRecommendation,
  calcDepreciationCurve,
  resolveTier,
} from '../src/utils/projections.js'

let failures = 0
const money = (n) => `$${n.toFixed(2)}`

function check(label, actual, expected, tol) {
  const ok = Math.abs(actual - expected) <= tol
  if (!ok) failures++
  console.log(
    `${ok ? '✓' : '✗'} ${label}: got ${money(actual)}, expected ~${money(expected)} (±${tol})`,
  )
}

// ── Case 1: Tesla Model 3 → LEASE advantage ≈ $1,489 ──────────────
const tesla = { make: 'Tesla', model: 'Model 3', fuelType: 'EV', msrp: 40000, milesPerYear: 12000 }
const t = calcNPVBreakdown(tesla)
const tRec = getRecommendation(t.leaseNPV, t.buyNPV)
console.log('\nTesla Model 3 ($40,000, 12k mi/yr)')
console.log(`  buyNPV=${money(t.buyNPV)}  leaseNPV=${money(t.leaseNPV)}  verdict=${tRec.verdict}`)
check('  lease advantage', tRec.verdict === 'LEASE' ? tRec.advantage : -tRec.advantage, 1489, 100)

// ── Case 2: BMW 3 Series → BUY advantage ≈ $2,187 ─────────────────
const bmw = { make: 'BMW', model: '3 Series', fuelType: 'ICE', msrp: 44000, milesPerYear: 12000 }
const b = calcNPVBreakdown(bmw)
const bRec = getRecommendation(b.leaseNPV, b.buyNPV)
console.log('\nBMW 3 Series ($44,000, 12k mi/yr)')
console.log(`  buyNPV=${money(b.buyNPV)}  leaseNPV=${money(b.leaseNPV)}  verdict=${bRec.verdict}`)
check('  buy advantage', bRec.verdict === 'BUY' ? bRec.advantage : -bRec.advantage, 2187, 100)

// ── Tier + curve sanity ───────────────────────────────────────────
console.log('\nTier resolution')
const tiers = [
  ['Tesla Model 3', tesla, 0.414],
  ['BMW 3 Series', bmw, 0.339],
  ['Nissan Leaf', { make: 'Nissan', fuelType: 'EV', msrp: 28000 }, 0.179],
  ['BMW i4', { make: 'BMW', fuelType: 'EV', msrp: 52000 }, 0.356],
  ['generic EV', { make: 'Kia', fuelType: 'EV', msrp: 40000 }, 0.303],
]
for (const [name, v, exp] of tiers) {
  const r = resolveTier(v)
  const ok = Math.abs(r.retention5 - exp) < 1e-9
  if (!ok) failures++
  console.log(`${ok ? '✓' : '✗'} ${name}: ${r.label} → ${(r.retention5 * 100).toFixed(1)}%`)
}

const curve = calcDepreciationCurve('Tesla', 40000, 0, 12000, 'EV')
console.log(`\nCurve length = ${curve.length} (expect 10); yr5 retention = ${curve[4].retention}%`)
if (curve.length !== 10) failures++

console.log(`\n${failures === 0 ? '✅ ALL CHECKS PASSED' : `❌ ${failures} CHECK(S) FAILED`}`)
process.exit(failures === 0 ? 0 : 1)
