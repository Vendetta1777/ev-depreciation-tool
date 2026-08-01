/**
 * Phase C — finance engine tests with hand-computed fixtures.
 * Run: npm test  (node --test, native TS type-stripping)
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  npvBuyVsLease,
  tco,
  band,
  breakeven,
  presentVerdict,
  compute,
  compareVehicles,
  provenanceOf,
  assertComputable,
  annuityFactor,
  monthlyAnnuityFactor,
  type ResolvedCurve,
  type CurveRow,
} from '../src/lib/finance.ts'

const near = (a: number, b: number, tol = 1) => Math.abs(a - b) <= tol

// ── Fixtures ─────────────────────────────────────────────────────────

/** Clean round-number curve for hand computation. y5 = 0.40. spread 10%. */
const derivedCurve: CurveRow = {
  key: 'seg-test',
  powertrain: 'ICE',
  body_class: 'sedan',
  price_band: 'mid',
  retention: [0.8, 0.7, 0.6, 0.5, 0.4],
  spread_pct: 10,
  source: 'Test Study',
  source_year: 2025,
  source_url: 'https://example.com',
  evidence: 'derived',
  shape_assumption: 'test shape',
  source_note: 'test note',
  status: 'ready',
}

const resolved: ResolvedCurve = { curve: derivedCurve, matchLevel: 'segment', note: 'No X curve — using segment.' }

const publishedResolved: ResolvedCurve = {
  curve: { ...derivedCurve, key: 'seg-pub', evidence: 'published' },
  matchLevel: 'exact',
  note: null,
}

const todoResolved: ResolvedCurve = {
  curve: { ...derivedCurve, key: 'seg-todo', retention: [null, null, null, null, null], status: 'todo' },
  matchLevel: 'segment',
  note: 'No X curve — using segment (todo).',
}

const refuseResolved: ResolvedCurve = { curve: null, matchLevel: 'refuse', note: 'Commercial vehicles not covered.' }

const input = {
  msrp: 40000,
  milesPerYear: 12000,
  years: 5,
  discountRate: 0.1,
  incentive: 0,
  mpg: 20,
  fuelPricePerGallon: 4,
  insurancePerYear: 1500,
  maintenancePerYear: 1000,
  registrationPerYear: 200,
  leaseMileageCap: 12000,
  leaseOveragePerMile: 0.25,
  // Fair, fee-free lease so the hand-computed identity fixtures stay exact.
  acquisitionFee: 0,
  dispositionFee: 0,
}

// ── PV helpers ───────────────────────────────────────────────────────

test('annuityFactor matches closed form (10%, 5yr ≈ 3.7908)', () => {
  assert.ok(near(annuityFactor(0.1, 5), 3.7908, 0.001))
  assert.equal(annuityFactor(0, 5), 5)
})

test('monthlyAnnuityFactor (10% APR, 60mo ≈ 47.0654)', () => {
  assert.ok(near(monthlyAnnuityFactor(0.1, 60), 47.0654, 0.01))
})

// ── NPV ──────────────────────────────────────────────────────────────

test('npvBuyVsLease hand-computed figures', () => {
  const r = npvBuyVsLease(input, resolved)
  // resale = 40000*0.4 = 16000; resalePV = 16000/1.1^5 = 9934.13
  assert.equal(r.resaleValue, 16000)
  // ops = 12000*(4/20) + 1500 + 1000 + 200 = 5100; opsPV = 5100*3.7908 = 19333.1
  assert.ok(near(r.operatingPV, 19333.1, 1))
  // monthly lease: dep=(40000-16000)/60=400; finance=(56000)*(0.1/24)=233.33; total=633.33
  assert.ok(near(r.monthlyLease, 633.33, 0.1))
  // buyNPV = (40000 - 9934.13) + 19333.1 = 49398.97
  assert.ok(near(r.buyNPV, 49398.97, 2))
  // leaseNPV = 633.33*47.0654 + 0 + 19333.1 = 49141.6
  assert.ok(near(r.leaseNPV, 49141.6, 3))
  assert.equal(r.verdict, 'LEASE') // leaseNPV < buyNPV
  assert.ok(near(r.advantage, 257.4, 3))
  assert.equal(r.leaseOverageAnnual, 0)
})

test('mileage overage raises lease cost and can flip to BUY', () => {
  const heavy = npvBuyVsLease({ ...input, milesPerYear: 20000 }, resolved)
  assert.equal(heavy.leaseOverageAnnual, (20000 - 12000) * 0.25) // 2000/yr
  assert.equal(heavy.verdict, 'BUY')
})

// ── TCO ──────────────────────────────────────────────────────────────

test('tco hand-computed 5-year totals', () => {
  const t = tco(input, resolved)
  assert.equal(t.depreciation, 24000) // 40000*(1-0.4)
  assert.equal(t.energy, 12000) // 5*12000*0.2
  assert.equal(t.insurance, 7500)
  assert.equal(t.maintenance, 5000)
  assert.equal(t.registration, 1000)
  assert.equal(t.incentives, 0)
  assert.equal(t.total, 49500)
  assert.equal(t.perYearCumulative.length, 5)
  // last cumulative = total depreciation + 5*annualOps(5100) = 24000 + 25500 = 49500
  assert.ok(near(t.perYearCumulative[4], 49500, 1))
})

test('incentive reduces TCO total dollar-for-dollar', () => {
  const t = tco({ ...input, incentive: 7500 }, resolved)
  assert.equal(t.incentives, -7500)
  assert.equal(t.total, 49500 - 7500)
})

// ── Band ─────────────────────────────────────────────────────────────

test('band applies spread_pct symmetrically', () => {
  const b = band(input, resolved)
  assert.equal(b.spreadPct, 10)
  assert.equal(b.flat, false)
  assert.equal(b.years[0].mid, 0.8)
  assert.ok(near(b.years[0].low, 0.72, 1e-9))
  assert.ok(near(b.years[0].high, 0.88, 1e-9))
  assert.equal(b.years[0].value, 32000)
  assert.ok(near(b.years[0].valueHigh, 35200, 1e-6))
})

test('band is flat when spread_pct is 0 (the current segment rows)', () => {
  const flatResolved: ResolvedCurve = { ...resolved, curve: { ...derivedCurve, spread_pct: 0 } }
  const b = band(input, flatResolved)
  assert.equal(b.flat, true)
  assert.equal(b.years[2].low, b.years[2].high)
})

// ── Breakeven ────────────────────────────────────────────────────────

test('breakeven: fuel never flips the verdict (identical for buy and lease)', () => {
  const be = breakeven(input, resolved)
  assert.equal(be.fuelPricePerGallon.flipsAt, null)
  assert.match(be.fuelPricePerGallon.note!, /identical/)
})

test('breakeven: miles flip-point actually equalizes buy and lease', () => {
  const be = breakeven(input, resolved)
  assert.notEqual(be.milesPerYear.flipsAt, null)
  const atFlip = npvBuyVsLease({ ...input, milesPerYear: be.milesPerYear.flipsAt! }, resolved)
  assert.ok(near(atFlip.buyNPV, atFlip.leaseNPV, 1)) // verdict boundary
})

test('breakeven: incentive flip-point equalizes buy and lease', () => {
  const be = breakeven(input, resolved)
  assert.notEqual(be.incentive.flipsAt, null)
  const atFlip = npvBuyVsLease({ ...input, incentive: be.incentive.flipsAt! }, resolved)
  assert.ok(near(atFlip.buyNPV, atFlip.leaseNPV, 1))
})

// ── Lease-vs-buy is fair by construction; levers create the divergence ─

test('fair lease (spread 0, MF=discount rate, no fees) ≈ buy by construction', () => {
  // The whole point: with a fair-value lease the sides cannot meaningfully
  // diverge — any gap is money-factor-formula approximation, not signal.
  const r = npvBuyVsLease(input, resolved)
  assert.ok(Math.abs(r.buyNPV - r.leaseNPV) < input.msrp * 0.01, `delta ${r.buyNPV - r.leaseNPV}`)
})

test('acquisition + disposition fees raise lease NPV and tilt toward buy', () => {
  const base = npvBuyVsLease(input, resolved)
  const withFees = npvBuyVsLease({ ...input, acquisitionFee: 895, dispositionFee: 395 }, resolved)
  const expected = base.leaseNPV + 895 + 395 / Math.pow(1.1, 5)
  assert.ok(near(withFees.leaseNPV, expected, 0.5))
  assert.ok(near(withFees.leaseFeesPV, 895 + 395 / Math.pow(1.1, 5), 0.5))
  assert.equal(withFees.verdict, 'BUY')
})

test('positive residualSpread makes leasing cheaper and can flip a buy verdict', () => {
  const feeCase = { ...input, acquisitionFee: 895, dispositionFee: 395 }
  const before = npvBuyVsLease(feeCase, resolved)
  assert.equal(before.verdict, 'BUY')
  const optimistic = npvBuyVsLease({ ...feeCase, residualSpread: 0.1 }, resolved)
  assert.ok(optimistic.leaseNPV < before.leaseNPV) // cheaper lease
  assert.equal(optimistic.verdict, 'LEASE') // the real EV-lease mechanism
  // Lender residual sits above the market resale by exactly spread × MSRP.
  assert.ok(near(optimistic.leaseResidual - before.resaleValue, 0.1 * input.msrp, 1e-6))
})

test('money-factor markup (moneyFactorAPR > discount rate) raises lease cost', () => {
  const marked = npvBuyVsLease({ ...input, moneyFactorAPR: 0.2 }, resolved)
  const fair = npvBuyVsLease(input, resolved)
  assert.ok(marked.leaseNPV > fair.leaseNPV)
})

test('breakeven finds the residualSpread that flips a fee-laden lease', () => {
  const feeCase = { ...input, acquisitionFee: 895, dispositionFee: 395 }
  const be = breakeven(feeCase, resolved)
  assert.notEqual(be.residualSpread.flipsAt, null)
  const atFlip = npvBuyVsLease({ ...feeCase, residualSpread: be.residualSpread.flipsAt! }, resolved)
  assert.ok(near(atFlip.buyNPV, atFlip.leaseNPV, 1))
})

// ── Lease term ───────────────────────────────────────────────────────

test('default leaseTermMonths (60) leaves the lease figures unchanged', () => {
  const a = npvBuyVsLease(input, resolved)
  const b = npvBuyVsLease({ ...input, leaseTermMonths: 60 }, resolved)
  assert.ok(near(a.monthlyLease, b.monthlyLease, 1e-9))
  assert.ok(near(a.leaseNPV, b.leaseNPV, 1e-9))
})

test('shorter lease term uses an earlier residual and higher monthly', () => {
  // 36mo → residual at year 3 = 0.6*40000 = 24000; dep=(40000-24000)/36=444.4
  const r = npvBuyVsLease({ ...input, leaseTermMonths: 36 }, resolved)
  const monthlyDep = (40000 - 0.6 * 40000) / 36
  const monthlyFin = (40000 + 0.6 * 40000) * (0.1 / 24)
  assert.ok(near(r.monthlyLease, monthlyDep + monthlyFin, 0.1))
})

// ── Verdict presentation ─────────────────────────────────────────────

test('presentVerdict is self-describing and lists only live breakevens', () => {
  const npv = npvBuyVsLease(input, resolved)
  const be = breakeven(input, resolved)
  const v = presentVerdict(input, npv, be)
  assert.equal(v.kind, 'buy-vs-lease')
  assert.deepEqual(v.pair, { a: 'Buy', b: 'Lease' })
  assert.equal(v.winner, 'b') // lease wins
  assert.equal(v.winnerLabel, 'Lease it.')
  assert.match(v.headline, /^Lease it\. You save \$\d[\d,]* over 5 years\.$/)
  // fuel can't flip the verdict, so it must NOT be a live slider
  assert.ok(!v.liveVariables.includes('fuelPricePerGallon'))
  assert.ok(v.liveVariables.includes('milesPerYear'))
  assert.ok(v.liveVariables.includes('incentive'))
})

test('compute() bundles the verdict descriptor', () => {
  const c = compute(input, resolved)
  assert.equal(c.verdict.headline, presentVerdict(input, c.npv, c.breakeven).headline)
})

// ── Provenance ───────────────────────────────────────────────────────

test('provenance flags derived vs published distinctly', () => {
  const d = provenanceOf(resolved)
  assert.equal(d.evidence, 'derived')
  assert.equal(d.derived, true)
  assert.equal(d.estimated, true)
  assert.equal(d.shapeAssumption, 'test shape')

  const p = provenanceOf(publishedResolved)
  assert.equal(p.evidence, 'published')
  assert.equal(p.derived, false)
  assert.equal(p.matchLevel, 'exact')
  assert.equal(p.estimated, false) // published + exact → not estimated
})

test('every result object carries provenance', () => {
  assert.ok(npvBuyVsLease(input, resolved).provenance.derived)
  assert.ok(tco(input, resolved).provenance.derived)
  assert.ok(band(input, resolved).provenance.derived)
  assert.ok(breakeven(input, resolved).provenance.derived)
})

test('missing evidence is treated as derived (conservative)', () => {
  const noEvidence: ResolvedCurve = { curve: { ...derivedCurve, evidence: null }, matchLevel: 'segment', note: null }
  assert.equal(provenanceOf(noEvidence).derived, true)
})

// ── EV vs ICE compare (Phase F) ──────────────────────────────────────

const evCurve = {
  ...derivedCurve,
  key: 'ev',
  powertrain: 'EV',
  retention: [0.8, 0.7, 0.6, 0.5, 0.45],
  evidence: 'published',
  source_year: 2026,
}
const iceCurve = {
  ...derivedCurve,
  key: 'ice',
  powertrain: 'ICE',
  retention: [0.85, 0.78, 0.72, 0.66, 0.6],
  evidence: 'published',
  source_year: 2025,
}
const evSide = (over = {}) => ({
  label: 'EV Car',
  resolved: { curve: evCurve, matchLevel: 'exact', note: null },
  msrp: 40000,
  powertrain: 'EV',
  kwhPer100mi: 30,
  ...over,
})
const iceSide = (over = {}) => ({
  label: 'Gas Car',
  resolved: { curve: iceCurve, matchLevel: 'segment', note: 'segment average' },
  msrp: 30000,
  powertrain: 'ICE',
  mpg: 30,
  ...over,
})
const cp = { milesPerYear: 12000, years: 5, fuelPricePerGallon: 3.5, electricityPricePerKwh: 0.17 }

test('compare returns an ev-vs-ice verdict; lower TCO wins', () => {
  const r = compareVehicles(evSide(), iceSide(), cp)
  assert.equal(r.verdict.kind, 'ev-vs-ice')
  assert.deepEqual(r.verdict.pair, { a: 'EV Car', b: 'Gas Car' })
  assert.equal(r.verdict.winner, 'b') // gas cheaper at $3.50/gal here
  assert.equal(r.verdict.winnerLabel, 'Gas Car')
  assert.match(r.verdict.headline, /Gas Car costs \$[\d,]+ less to own over 5 years/)
  assert.ok(r.a.tco.total > r.b.tco.total)
})

test('fuel price is live and flips the verdict', () => {
  const cheap = compareVehicles(evSide(), iceSide(), { ...cp, fuelPricePerGallon: 2 })
  const dear = compareVehicles(evSide(), iceSide(), { ...cp, fuelPricePerGallon: 12 })
  assert.equal(cheap.verdict.winner, 'b') // cheap gas → gas wins
  assert.equal(dear.verdict.winner, 'a') // expensive gas → EV wins
  const r = compareVehicles(evSide(), iceSide(), cp)
  assert.ok(r.verdict.liveVariables.includes('fuelPricePerGallon'))
  assert.notEqual(r.breakeven.fuelPricePerGallon, null)
})

test('incentive defaults to 0 (federal credit expired) and is a live lever', () => {
  const base = compareVehicles(evSide(), iceSide(), cp)
  // No incentive baked in: EV side TCO has incentives line 0.
  assert.equal(base.a.tco.incentives, 0)
  // A state/local EV incentive lowers EV cost and can flip toward the EV.
  const withInc = compareVehicles(evSide({ incentive: 12000 }), iceSide(), cp)
  assert.ok(withInc.a.tco.total < base.a.tco.total)
  assert.notEqual(base.breakeven.incentive, null)
})

test('two EVs → fuel price is not a live lever', () => {
  const r = compareVehicles(evSide(), evSide({ label: 'EV Two', msrp: 35000 }), cp)
  assert.ok(!r.verdict.liveVariables.includes('fuelPricePerGallon'))
  assert.equal(r.breakeven.fuelPricePerGallon, null)
})

test('a TODO side yields no verdict and a per-side pending note', () => {
  const todoSide = evSide({
    resolved: {
      curve: { ...evCurve, retention: [null, null, null, null, null], status: 'todo' },
      matchLevel: 'segment',
      note: 'No EV Car curve — using segment (pending).',
    },
  })
  const r = compareVehicles(todoSide, iceSide(), cp)
  assert.equal(r.verdict, null)
  assert.equal(r.a.ready, false)
  assert.equal(r.a.reason, 'pending')
  assert.match(r.a.note, /published yet|todo/)
  assert.equal(r.b.ready, true)
})

test('a pre-2012 side is a clean refuse (not a crash) with reason refuse', () => {
  const refused = evSide({ resolved: { curve: null, matchLevel: 'refuse', note: 'Retention data starts at model year 2012 — 2010 is out of range.' } })
  const r = compareVehicles(refused, iceSide(), cp)
  assert.equal(r.verdict, null)
  assert.equal(r.a.ready, false)
  assert.equal(r.a.reason, 'refuse')
  assert.match(r.a.note, /2012/)
})

test('asymmetric provenance (exact 2026 vs segment 2025) is reported', () => {
  const r = compareVehicles(evSide(), iceSide(), cp)
  assert.equal(r.provenanceComparison.matchLevelDiffers, true)
  assert.equal(r.provenanceComparison.sourceYearDiffers, true)
  assert.match(r.provenanceComparison.note, /sourced/)
})

test('symmetric provenance (both exact 2026) → no asymmetry note', () => {
  const r = compareVehicles(evSide(), evSide({ label: 'EV Two', msrp: 36000 }), cp)
  assert.equal(r.provenanceComparison.matchLevelDiffers, false)
  assert.equal(r.provenanceComparison.note, null)
})

// ── Guards ───────────────────────────────────────────────────────────

test('refuse to compute on a TODO (not-ready) curve', () => {
  assert.throws(() => assertComputable(todoResolved), /aren't published yet|status: todo/)
  assert.throws(() => npvBuyVsLease(input, todoResolved), /published yet|todo/)
})

test('refuse to compute on a refused vehicle, surfacing the note', () => {
  assert.throws(() => npvBuyVsLease(input, refuseResolved), /Commercial vehicles not covered/)
})
