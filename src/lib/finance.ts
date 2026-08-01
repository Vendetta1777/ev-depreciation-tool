/**
 * finance.ts — the compute engine. Pure, no I/O.
 *
 * Consumes a resolved curve (Phase B `resolveCurve` output) plus a vehicle/user
 * input, and produces: 5-year buy-vs-lease NPV, total cost of ownership,
 * per-variable breakeven, and a spread band. Every result carries a
 * `provenance` block so the UI can label derived vs published figures — a
 * result computed from a `evidence:"derived"` row is flagged and must never
 * render identically to one from a published row.
 *
 * Modeling notes that matter for interpretation (see /methodology, Phase E):
 *  - Operating costs (energy, insurance, maintenance, registration) are the
 *    same whether you buy or lease the same car, so they CANCEL in the
 *    buy-vs-lease verdict. They are still included in each NPV so the numbers
 *    read as real 5-year costs.
 *  - Because of that, fuel/electricity price does NOT change the buy-vs-lease
 *    verdict (it changes TCO). Miles/yr changes the verdict only through the
 *    lease mileage cap + per-mile overage.
 *  - Resale uses the published curve at the horizon; we do not fabricate a
 *    mileage-vs-resale adjustment (no cited curve for it).
 */

// ── Types ────────────────────────────────────────────────────────────

export type Evidence = 'published' | 'derived'

export interface CurveRow {
  key: string
  powertrain: string
  body_class: string
  price_band: string
  retention: Array<number | null>
  spread_pct: number | null
  source: string | null
  source_year: number | null
  source_url: string | null
  evidence?: Evidence | null
  shape_assumption?: string | null
  source_note?: string | null
  status: 'todo' | 'ready'
}

export interface ResolvedCurve {
  curve: CurveRow | null
  matchLevel: 'exact' | 'segment' | 'refuse'
  note: string | null
}

export interface Provenance {
  matchLevel: 'exact' | 'segment'
  evidence: Evidence
  /** True when the underlying retention figure is derived/inferred, not published. */
  derived: boolean
  /** Broader flag: derived OR resolved via a segment fallback (not the exact model). */
  estimated: boolean
  shapeAssumption: string
  sourceNote: string
  source: string
  sourceYear: number | null
  sourceUrl: string | null
  /** The segment-fallback note from resolveCurve, if any. */
  note: string | null
}

export interface FinanceInput {
  msrp: number
  milesPerYear: number
  years?: number
  discountRate?: number
  powertrain?: string
  incentive?: number
  // Energy
  fuelPricePerGallon?: number
  mpg?: number
  electricityPricePerKwh?: number
  kwhPer100mi?: number
  // Recurring (annual)
  insurancePerYear?: number
  maintenancePerYear?: number
  registrationPerYear?: number
  // Lease
  leaseTermMonths?: number
  leaseMileageCap?: number
  leaseOveragePerMile?: number
  moneyFactor?: number
  residualSpread?: number
  moneyFactorAPR?: number | null
  acquisitionFee?: number
  dispositionFee?: number
}

// ── Defaults (documented, all overridable via input) ─────────────────

export const FINANCE_DEFAULTS = {
  years: 5,
  discountRate: 0.05,
  incentive: 0,
  registrationPerYear: 250,
  // v1 models a 60-month lease so it lines up with the 5-year horizon. Real
  // leases are typically 24-36mo; this is a documented simplification (see
  // /methodology limitations). Configurable, but values != horizon aren't
  // fully apples-to-apples with buy-and-keep yet.
  leaseTermMonths: 60,
  leaseMileageCap: 12000,
  leaseOveragePerMile: 0.25,
  // ── Lease-vs-buy levers ──────────────────────────────────────────
  // With a FAIR lease (residualSpread 0, money factor == discount rate, no
  // fees) buy and lease are equivalent by construction — the lease payment PV
  // reduces to price − PV(residual) == buy NPV. Real lease advantages come from
  // these levers, not the depreciation curve:
  //
  // residualSpread: the lender's assumed residual MINUS the market forecast,
  //   as a fraction of MSRP. THE key lever. This is a USER INPUT, not a sourced
  //   figure — its only justified default is 0 (a fair-value lease). When > 0
  //   the lender is optimistic and leasing should win.
  residualSpread: 0.0,
  // moneyFactorAPR: if null, the lease is priced at the discount rate (fair).
  //   Set it to price the lease off a marked-up APR instead.
  moneyFactorAPR: null as number | null,
  acquisitionFee: 895,
  dispositionFee: 395,
  ev: {
    kwhPer100mi: 30,
    electricityPricePerKwh: 0.17,
    maintenancePerYear: 700,
    insurancePerYear: 1800,
  },
  fuel: {
    mpg: 28,
    fuelPricePerGallon: 3.5,
    maintenancePerYear: 1200,
    insurancePerYear: 1650,
  },
} as const

// ── Provenance + guards ──────────────────────────────────────────────

/** True when a curve has usable, cited figures (every retention is a number). */
export function isCurveReady(curve: CurveRow | null): curve is CurveRow {
  return (
    !!curve &&
    curve.status === 'ready' &&
    Array.isArray(curve.retention) &&
    curve.retention.length === 5 &&
    curve.retention.every((v) => typeof v === 'number' && v > 0 && v < 1)
  )
}

/**
 * Ensure a resolved curve can actually be computed on, and return it narrowed.
 * Throws with a UI-friendly message on refuse or a not-yet-filled (TODO) curve.
 */
export function assertComputable(resolved: ResolvedCurve): { curve: CurveRow; retention: number[] } {
  if (resolved.matchLevel === 'refuse' || !resolved.curve) {
    throw new Error(resolved.note ?? 'No retention curve available for this vehicle.')
  }
  if (!isCurveReady(resolved.curve)) {
    throw new Error(
      `Retention figures for "${resolved.curve.key}" aren't published yet (status: ${resolved.curve.status}).`,
    )
  }
  return { curve: resolved.curve, retention: resolved.curve.retention as number[] }
}

/** Extract the provenance block. Missing `evidence` is treated as derived (conservative). */
export function provenanceOf(resolved: ResolvedCurve): Provenance {
  const curve = resolved.curve
  const matchLevel = resolved.matchLevel === 'exact' ? 'exact' : 'segment'
  const evidence: Evidence = curve?.evidence === 'published' ? 'published' : 'derived'
  const derived = evidence === 'derived'
  return {
    matchLevel,
    evidence,
    derived,
    estimated: derived || matchLevel !== 'exact',
    shapeAssumption: curve?.shape_assumption ?? '',
    sourceNote: curve?.source_note ?? '',
    source: curve?.source ?? '',
    sourceYear: curve?.source_year ?? null,
    sourceUrl: curve?.source_url ?? null,
    note: resolved.note ?? null,
  }
}

// ── Present-value helpers ────────────────────────────────────────────

/** PV factor of $1/yr for `years` at annual rate `r`. */
export function annuityFactor(r: number, years: number): number {
  if (r === 0) return years
  return (1 - Math.pow(1 + r, -years)) / r
}

/** PV factor of $1/month for `months` at annual rate `r`. */
export function monthlyAnnuityFactor(r: number, months: number): number {
  const i = r / 12
  if (i === 0) return months
  return (1 - Math.pow(1 + i, -months)) / i
}

// ── Config resolution ────────────────────────────────────────────────

interface Config {
  years: number
  discountRate: number
  incentive: number
  isEv: boolean
  energyPerMile: number
  insurancePerYear: number
  maintenancePerYear: number
  registrationPerYear: number
  leaseTermMonths: number
  leaseMileageCap: number
  leaseOveragePerMile: number
  moneyFactor: number
  residualSpread: number
  acquisitionFee: number
  dispositionFee: number
}

function resolveConfig(input: FinanceInput, powertrain: string): Config {
  const isEv = String(powertrain).toUpperCase() === 'EV'
  const d = FINANCE_DEFAULTS
  const p = isEv ? d.ev : d.fuel
  const discountRate = input.discountRate ?? d.discountRate

  const energyPerMile = isEv
    ? ((input.kwhPer100mi ?? d.ev.kwhPer100mi) / 100) * (input.electricityPricePerKwh ?? d.ev.electricityPricePerKwh)
    : (input.fuelPricePerGallon ?? d.fuel.fuelPricePerGallon) / (input.mpg ?? d.fuel.mpg)

  return {
    years: input.years ?? d.years,
    discountRate,
    incentive: input.incentive ?? d.incentive,
    isEv,
    energyPerMile,
    insurancePerYear: input.insurancePerYear ?? p.insurancePerYear,
    maintenancePerYear: input.maintenancePerYear ?? p.maintenancePerYear,
    registrationPerYear: input.registrationPerYear ?? d.registrationPerYear,
    leaseTermMonths: input.leaseTermMonths ?? d.leaseTermMonths,
    leaseMileageCap: input.leaseMileageCap ?? d.leaseMileageCap,
    leaseOveragePerMile: input.leaseOveragePerMile ?? d.leaseOveragePerMile,
    residualSpread: input.residualSpread ?? d.residualSpread,
    acquisitionFee: input.acquisitionFee ?? d.acquisitionFee,
    dispositionFee: input.dispositionFee ?? d.dispositionFee,
    // The lease is priced off moneyFactorAPR when given, else the discount rate
    // (a fair lease). APR (as a decimal) → money factor is APR / 24.
    moneyFactor: input.moneyFactor ?? ((input.moneyFactorAPR ?? d.moneyFactorAPR ?? discountRate) / 24),
  }
}

/** Annual operating cost (identical for buy and lease). */
function annualOperating(input: FinanceInput, cfg: Config): number {
  return (
    input.milesPerYear * cfg.energyPerMile +
    cfg.insurancePerYear +
    cfg.maintenancePerYear +
    cfg.registrationPerYear
  )
}

// ── NPV: buy vs lease ────────────────────────────────────────────────

export interface NpvResult {
  verdict: 'BUY' | 'LEASE'
  advantage: number
  buyNPV: number
  leaseNPV: number
  resaleValue: number
  leaseResidual: number
  monthlyLease: number
  leaseOverageAnnual: number
  leaseFeesPV: number
  operatingPV: number
  provenance: Provenance
}

export function npvBuyVsLease(input: FinanceInput, resolved: ResolvedCurve): NpvResult {
  const { retention } = assertComputable(resolved)
  const powertrain = input.powertrain ?? resolved.curve!.powertrain
  const cfg = resolveConfig(input, powertrain)
  const { msrp } = input
  const r = cfg.discountRate
  const years = cfg.years

  const retentionAtHorizon = retention[years - 1] ?? retention[retention.length - 1]
  const resaleValue = msrp * retentionAtHorizon

  const operatingPV = annualOperating(input, cfg) * annuityFactor(r, years)

  // Buy: cash out (net of incentive) now, recover resale at the horizon.
  const buyCore = msrp - cfg.incentive - resaleValue / Math.pow(1 + r, years)
  const buyNPV = buyCore + operatingPV

  // Lease: residual at the LEASE term end (default 60mo == horizon). The lender
  // sets payments off its OWN residual (market forecast + residualSpread); the
  // lessee benefits from an optimistic residual because they pay depreciation
  // down to it and walk away. Cap cost net of incentive (EV lease loophole).
  const leaseMonths = cfg.leaseTermMonths
  const leaseYears = leaseMonths / 12
  const residualIdx = Math.min(Math.max(Math.round(leaseYears), 1), retention.length) - 1
  const marketResidual = msrp * retention[residualIdx]
  const leaseResidual = marketResidual + cfg.residualSpread * msrp
  const capCost = msrp - cfg.incentive
  const monthlyDepreciation = (capCost - leaseResidual) / leaseMonths
  const monthlyFinance = (capCost + leaseResidual) * cfg.moneyFactor
  const monthlyLease = monthlyDepreciation + monthlyFinance
  const leasePaymentsPV = monthlyLease * monthlyAnnuityFactor(r, leaseMonths)

  const leaseOverageAnnual = Math.max(0, input.milesPerYear - cfg.leaseMileageCap) * cfg.leaseOveragePerMile
  const leaseOveragePV = leaseOverageAnnual * annuityFactor(r, leaseYears)
  // Acquisition fee up front (nominal); disposition fee at lease end (discounted).
  const leaseFeesPV = cfg.acquisitionFee + cfg.dispositionFee / Math.pow(1 + r, leaseYears)
  const leaseNPV = leasePaymentsPV + leaseOveragePV + leaseFeesPV + operatingPV

  const buyWins = buyNPV < leaseNPV
  return {
    verdict: buyWins ? 'BUY' : 'LEASE',
    advantage: Math.abs(buyNPV - leaseNPV),
    buyNPV,
    leaseNPV,
    resaleValue,
    leaseResidual,
    monthlyLease,
    leaseOverageAnnual,
    leaseFeesPV,
    operatingPV,
    provenance: provenanceOf(resolved),
  }
}

// ── TCO (5-year ownership) ───────────────────────────────────────────

export interface TcoResult {
  depreciation: number
  energy: number
  insurance: number
  maintenance: number
  registration: number
  incentives: number
  total: number
  /** Cumulative nominal cost at the end of each year (length = years). */
  perYearCumulative: number[]
  provenance: Provenance
}

export function tco(input: FinanceInput, resolved: ResolvedCurve): TcoResult {
  const { retention } = assertComputable(resolved)
  const powertrain = input.powertrain ?? resolved.curve!.powertrain
  const cfg = resolveConfig(input, powertrain)
  const { msrp } = input
  const years = cfg.years

  const retentionAtHorizon = retention[years - 1] ?? retention[retention.length - 1]
  const depreciation = msrp * (1 - retentionAtHorizon)
  const energy = years * input.milesPerYear * cfg.energyPerMile
  const insurance = years * cfg.insurancePerYear
  const maintenance = years * cfg.maintenancePerYear
  const registration = years * cfg.registrationPerYear
  const incentives = cfg.incentive ? -cfg.incentive : 0 // avoid -0
  const total = depreciation + energy + insurance + maintenance + registration + incentives

  // Depreciation follows the curve shape; operating cost accrues linearly.
  const annualOps = annualOperating(input, cfg)
  const perYearCumulative: number[] = []
  let prevRet = 1
  let cum = incentives // incentive credited up front
  for (let t = 1; t <= years; t++) {
    const ret = retention[t - 1] ?? retentionAtHorizon
    cum += msrp * (prevRet - ret) + annualOps
    perYearCumulative.push(cum)
    prevRet = ret
  }

  return {
    depreciation,
    energy,
    insurance,
    maintenance,
    registration,
    incentives,
    total,
    perYearCumulative,
    provenance: provenanceOf(resolved),
  }
}

// ── Band (apply spread_pct) ──────────────────────────────────────────

export interface BandYear {
  year: number
  mid: number
  low: number
  high: number
  value: number
  valueLow: number
  valueHigh: number
}

export interface BandResult {
  spreadPct: number
  years: BandYear[]
  /** True when spread_pct is 0/absent — the band collapses to the mid line. */
  flat: boolean
  provenance: Provenance
}

export function band(input: FinanceInput, resolved: ResolvedCurve): BandResult {
  const { curve, retention } = assertComputable(resolved)
  const spreadPct = curve.spread_pct ?? 0
  const f = spreadPct / 100
  const years: BandYear[] = retention.map((mid, i) => {
    const low = mid * (1 - f)
    const high = mid * (1 + f)
    return {
      year: i + 1,
      mid,
      low,
      high,
      value: input.msrp * mid,
      valueLow: input.msrp * low,
      valueHigh: input.msrp * high,
    }
  })
  return { spreadPct, years, flat: f === 0, provenance: provenanceOf(resolved) }
}

// ── Breakeven ────────────────────────────────────────────────────────

export interface BreakevenVar {
  flipsAt: number | null
  current: number
  note: string | null
}

export interface BreakevenResult {
  currentVerdict: 'BUY' | 'LEASE'
  milesPerYear: BreakevenVar
  discountRate: BreakevenVar
  fuelPricePerGallon: BreakevenVar
  incentive: BreakevenVar
  residualSpread: BreakevenVar
  provenance: Provenance
}

/** buy − lease as a function of one overridden input (negative → buy wins). */
function advantageFn(input: FinanceInput, resolved: ResolvedCurve, key: keyof FinanceInput) {
  return (v: number) => {
    const r = npvBuyVsLease({ ...input, [key]: v }, resolved)
    return r.buyNPV - r.leaseNPV
  }
}

/** Bisection flip-finder; returns null when the verdict doesn't flip in [lo, hi]. */
function solveFlip(f: (v: number) => number, lo: number, hi: number): number | null {
  const flo = f(lo)
  const fhi = f(hi)
  if (flo === 0) return lo
  if (fhi === 0) return hi
  if (Math.sign(flo) === Math.sign(fhi)) return null
  let a = lo
  let b = hi
  for (let i = 0; i < 100; i++) {
    const m = (a + b) / 2
    if (Math.sign(f(m)) === Math.sign(flo)) a = m
    else b = m
  }
  return (a + b) / 2
}

export function breakeven(input: FinanceInput, resolved: ResolvedCurve): BreakevenResult {
  const powertrain = input.powertrain ?? resolved.curve?.powertrain ?? ''
  const cfg = resolveConfig(input, powertrain)
  const base = npvBuyVsLease(input, resolved)

  const miles = solveFlip(advantageFn(input, resolved, 'milesPerYear'), 0, 200000)
  const rate = solveFlip(advantageFn(input, resolved, 'discountRate'), 0.001, 0.5)
  const inc = solveFlip(advantageFn(input, resolved, 'incentive'), 0, 100000)
  const spread = solveFlip(advantageFn(input, resolved, 'residualSpread'), -0.3, 0.5)

  const fuelKey: keyof FinanceInput = cfg.isEv ? 'electricityPricePerKwh' : 'fuelPricePerGallon'
  const fuelFlip = solveFlip(advantageFn(input, resolved, fuelKey), 0, 20)

  return {
    currentVerdict: base.verdict,
    milesPerYear: {
      flipsAt: miles,
      current: input.milesPerYear,
      note:
        miles === null
          ? 'Mileage never flips the verdict in a realistic range (only lease-cap overage moves it).'
          : null,
    },
    discountRate: { flipsAt: rate, current: cfg.discountRate, note: null },
    residualSpread: {
      flipsAt: spread,
      current: cfg.residualSpread,
      note:
        spread === null
          ? null
          : 'The lender residual vs. market — the main reason a lease can beat buying.',
    },
    fuelPricePerGallon: {
      flipsAt: fuelFlip,
      current: cfg.isEv
        ? (input.electricityPricePerKwh ?? FINANCE_DEFAULTS.ev.electricityPricePerKwh)
        : (input.fuelPricePerGallon ?? FINANCE_DEFAULTS.fuel.fuelPricePerGallon),
      note: 'Fuel/energy cost is identical whether you buy or lease, so it never flips the buy-vs-lease verdict (it does change total cost of ownership).',
    },
    incentive: { flipsAt: inc, current: cfg.incentive, note: null },
    provenance: provenanceOf(resolved),
  }
}

// ── Verdict presentation (drives the UI; Phase F swaps the shape) ─────

export type VerdictKind = 'buy-vs-lease' | 'ev-vs-ice'
export type BreakevenVarName =
  | 'milesPerYear'
  | 'discountRate'
  | 'fuelPricePerGallon'
  | 'electricityPricePerKwh'
  | 'incentive'
  | 'residualSpread'

/**
 * A self-describing verdict the UI renders WITHOUT knowing which comparison
 * produced it. Phase F's "EV vs ICE" mode returns the same shape with a
 * different `kind`, `pair`, and `liveVariables` — components don't change.
 */
export interface VerdictPresentation {
  kind: VerdictKind
  /** The two options being compared, in stable a/b order. */
  pair: { a: string; b: string }
  winner: 'a' | 'b'
  winnerLabel: string
  loserLabel: string
  /** Dollar advantage of the winner over the horizon. */
  amount: number
  horizonYears: number
  /** Ready-to-render headline, e.g. "Lease it. You save $4,180 over 5 years." */
  headline: string
  /** Which breakeven variables can actually flip THIS verdict → live sliders. */
  liveVariables: BreakevenVarName[]
  provenance: Provenance
}

function usd0(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US')
}

/**
 * Build the verdict descriptor from computed results. `liveVariables` is derived
 * from the breakeven result (a variable is live iff it can flip the verdict),
 * so the UI's live sliders come from data, not a hard-coded list.
 */
export function presentVerdict(
  input: FinanceInput,
  npv: NpvResult,
  be: BreakevenResult,
): VerdictPresentation {
  const horizonYears = input.years ?? FINANCE_DEFAULTS.years
  const buyWins = npv.verdict === 'BUY'
  const pair = { a: 'Buy', b: 'Lease' }
  const winner: 'a' | 'b' = buyWins ? 'a' : 'b'
  const winnerLabel = buyWins ? 'Buy it.' : 'Lease it.'
  const loserLabel = buyWins ? 'Lease' : 'Buy'

  const vars: BreakevenVarName[] = [
    'residualSpread',
    'milesPerYear',
    'discountRate',
    'incentive',
    'fuelPricePerGallon',
  ]
  const liveVariables = vars.filter((v) => be[v].flipsAt !== null)

  return {
    kind: 'buy-vs-lease',
    pair,
    winner,
    winnerLabel,
    loserLabel,
    amount: npv.advantage,
    horizonYears,
    headline: `${winnerLabel} You save ${usd0(npv.advantage)} over ${horizonYears} years.`,
    liveVariables,
    provenance: npv.provenance,
  }
}

// ── Convenience: run everything ──────────────────────────────────────

export interface ComputeResult {
  npv: NpvResult
  tco: TcoResult
  band: BandResult
  breakeven: BreakevenResult
  verdict: VerdictPresentation
  provenance: Provenance
}

export function compute(input: FinanceInput, resolved: ResolvedCurve): ComputeResult {
  const npv = npvBuyVsLease(input, resolved)
  const be = breakeven(input, resolved)
  return {
    npv,
    tco: tco(input, resolved),
    band: band(input, resolved),
    breakeven: be,
    verdict: presentVerdict(input, npv, be),
    provenance: provenanceOf(resolved),
  }
}

// ── EV vs ICE — compare two vehicles' 5-year total cost (Phase F) ─────
//
// Verdict = which vehicle costs less to own over the horizon (TCO), NOT
// buy-vs-lease. The two vehicles are chosen by the caller; energy price is a
// live lever (fuel drives the ICE side, electricity the EV side), so it can
// flip the verdict. Reuses VerdictPresentation with kind 'ev-vs-ice'.

export interface CompareSide {
  label: string
  resolved: ResolvedCurve
  msrp: number
  powertrain: string
  /** State/local incentive only — the federal EV credit expired 2025-09-30, so default 0. */
  incentive?: number
  mpg?: number
  kwhPer100mi?: number
  insurancePerYear?: number
  maintenancePerYear?: number
}

export interface CompareParams {
  milesPerYear: number
  years?: number
  fuelPricePerGallon?: number
  electricityPricePerKwh?: number
}

export interface CompareSideResult {
  label: string
  ready: boolean
  tco: TcoResult | null
  provenance: Provenance | null
  /** Set when the side is not computable (pending / refuse) — no verdict then. */
  note: string | null
}

export interface CompareBreakeven {
  milesPerYear: number | null
  fuelPricePerGallon: number | null
  electricityPricePerKwh: number | null
  incentive: number | null
}

export interface ProvenanceComparison {
  matchLevelDiffers: boolean
  sourceYearDiffers: boolean
  /** Human note when the two sides were sourced differently (vintage / exact-vs-segment). */
  note: string | null
}

export interface CompareResult {
  a: CompareSideResult
  b: CompareSideResult
  verdict: VerdictPresentation | null
  breakeven: CompareBreakeven | null
  provenanceComparison: ProvenanceComparison | null
}

function sideInput(side: CompareSide, p: CompareParams): FinanceInput {
  return {
    msrp: side.msrp,
    powertrain: side.powertrain,
    milesPerYear: p.milesPerYear,
    years: p.years,
    incentive: side.incentive ?? 0,
    fuelPricePerGallon: p.fuelPricePerGallon,
    electricityPricePerKwh: p.electricityPricePerKwh,
    mpg: side.mpg,
    kwhPer100mi: side.kwhPer100mi,
    insurancePerYear: side.insurancePerYear,
    maintenancePerYear: side.maintenancePerYear,
  }
}

function sideResult(side: CompareSide, p: CompareParams): CompareSideResult {
  try {
    assertComputable(side.resolved)
    return {
      label: side.label,
      ready: true,
      tco: tco(sideInput(side, p), side.resolved),
      provenance: provenanceOf(side.resolved),
      note: null,
    }
  } catch (e) {
    return {
      label: side.label,
      ready: false,
      tco: null,
      provenance: side.resolved.curve ? provenanceOf(side.resolved) : null,
      note: side.resolved.note ?? (e as Error).message,
    }
  }
}

function describeProvenance(p: Provenance): string {
  const kind = p.matchLevel === 'exact' ? 'an exact per-model figure' : 'a segment average'
  return `${kind} (${p.sourceYear ?? 'undated'})`
}

export function compareVehicles(a: CompareSide, b: CompareSide, p: CompareParams): CompareResult {
  const ra = sideResult(a, p)
  const rb = sideResult(b, p)

  // Both sides must be ready; otherwise no verdict (per-side "figures pending").
  if (!ra.ready || !rb.ready || !ra.tco || !rb.tco) {
    return { a: ra, b: rb, verdict: null, breakeven: null, provenanceComparison: null }
  }

  const years = p.years ?? FINANCE_DEFAULTS.years
  const winnerIsA = ra.tco.total < rb.tco.total
  const amount = Math.abs(ra.tco.total - rb.tco.total)

  // total(a) − total(b) as a function of a mutated param / per-side incentive.
  const diff = (over: Partial<CompareParams>, aInc?: number, bInc?: number) => {
    const pp = { ...p, ...over }
    const ta = tco(sideInput({ ...a, incentive: aInc ?? a.incentive }, pp), a.resolved)
    const tb = tco(sideInput({ ...b, incentive: bInc ?? b.incentive }, pp), b.resolved)
    return ta.total - tb.total
  }
  const miles = solveFlip((v) => diff({ milesPerYear: v }), 0, 100000)
  const fuel = solveFlip((v) => diff({ fuelPricePerGallon: v }), 0, 15)
  const elec = solveFlip((v) => diff({ electricityPricePerKwh: v }), 0, 1)
  const evSide = a.powertrain.toUpperCase() === 'EV' ? 'a' : b.powertrain.toUpperCase() === 'EV' ? 'b' : null
  let incentive: number | null = null
  if (evSide === 'a') incentive = solveFlip((v) => diff({}, v, undefined), 0, 30000)
  else if (evSide === 'b') incentive = solveFlip((v) => diff({}, undefined, v), 0, 30000)

  const live: BreakevenVarName[] = []
  if (miles !== null) live.push('milesPerYear')
  if (fuel !== null) live.push('fuelPricePerGallon')
  if (elec !== null) live.push('electricityPricePerKwh')
  if (incentive !== null) live.push('incentive')

  const winnerLabel = winnerIsA ? a.label : b.label
  const verdict: VerdictPresentation = {
    kind: 'ev-vs-ice',
    pair: { a: a.label, b: b.label },
    winner: winnerIsA ? 'a' : 'b',
    winnerLabel,
    loserLabel: winnerIsA ? b.label : a.label,
    amount,
    horizonYears: years,
    headline: `The ${winnerLabel} costs ${usd0(amount)} less to own over ${years} years.`,
    liveVariables: live,
    provenance: (winnerIsA ? ra.provenance : rb.provenance)!,
  }

  const pa = ra.provenance!
  const pb = rb.provenance!
  const matchLevelDiffers = pa.matchLevel !== pb.matchLevel
  const sourceYearDiffers = pa.sourceYear !== pb.sourceYear
  const provNote =
    matchLevelDiffers || sourceYearDiffers
      ? `Heads-up: ${a.label} uses ${describeProvenance(pa)} and ${b.label} uses ${describeProvenance(pb)}. Part of the gap may reflect how the two figures were sourced (exact-vs-segment, dataset vintage), not the vehicles themselves.`
      : null

  return {
    a: ra,
    b: rb,
    verdict,
    breakeven: { milesPerYear: miles, fuelPricePerGallon: fuel, electricityPricePerKwh: elec, incentive },
    provenanceComparison: { matchLevelDiffers, sourceYearDiffers, note: provNote },
  }
}
