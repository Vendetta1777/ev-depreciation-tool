/**
 * Projection engine — depreciation curves + buy-vs-lease NPV.
 *
 * All rates come from src/data/constants.js (the research-derived source of
 * truth). The engine is pure and framework-free so it can be unit-validated
 * against the paper's published figures (see scripts/validate.mjs).
 */
import {
  NPV,
  RESIDUAL_DISCOUNT_RATE,
  VALUE_RETENTION,
  PRICE_TIERS,
  LEASE_RATE,
  MAINTENANCE_PER_YEAR,
  FUEL_COST_PER_MILE,
  DEFAULT_ANNUAL_MILES,
} from '../data/constants.js'
import { usd } from './format.js'

const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi)

/** Present-value factor of $1/yr for `years` at annual rate `r`. */
function annuityFactor(r, years) {
  return (1 - Math.pow(1 + r, -years)) / r
}

/** Present-value factor of $1/month for `months` at annual rate `r`. */
function monthlyAnnuityFactor(r, months) {
  const i = r / 12
  return (1 - Math.pow(1 + i, -months)) / i
}

/**
 * Resolve the depreciation tier for a vehicle and its 5-year value retention.
 * Tesla wins over the price buckets (a Tesla is a Tesla at any price).
 */
export function resolveTier({ make = '', msrp = 0, fuelType = 'EV' }) {
  if (fuelType === 'ICE') {
    return { key: 'ice', label: 'Gas / ICE', retention5: VALUE_RETENTION.ice }
  }
  if (/tesla/i.test(make)) {
    return { key: 'tesla', label: 'Tesla', retention5: VALUE_RETENTION.tesla }
  }
  if (msrp > PRICE_TIERS.luxuryMin) {
    return { key: 'luxuryEv', label: 'Luxury EV (>$50k)', retention5: VALUE_RETENTION.luxuryEv }
  }
  if (msrp < PRICE_TIERS.budgetMax) {
    return { key: 'budgetEv', label: 'Budget EV (<$35k)', retention5: VALUE_RETENTION.budgetEv }
  }
  return { key: 'ev', label: 'EV (average)', retention5: VALUE_RETENTION.ev }
}

/**
 * calcDepreciationCurve — 10 years of value retention for a vehicle.
 *
 * Uses the tier's 5-year retention to derive a constant annual retention factor,
 * then projects it forward from the vehicle's current age. Higher-than-average
 * annual mileage gently accelerates the decline.
 *
 * @returns {{year:number, retention:number, value:number}[]} 10 entries (years 1–10),
 *   `retention` as a percentage, `value` in dollars off the original MSRP.
 */
export function calcDepreciationCurve(
  make,
  msrp,
  age = 0,
  milesPerYear = DEFAULT_ANNUAL_MILES,
  fuelType = 'EV',
) {
  const { retention5 } = resolveTier({ make, msrp, fuelType })
  const annualFactor = Math.pow(retention5, 1 / NPV.horizonYears)

  // Relative to the 12k-mi/yr baseline, heavier use erodes value faster.
  const mileagePenalty = clamp(
    ((milesPerYear - DEFAULT_ANNUAL_MILES) / DEFAULT_ANNUAL_MILES) * 0.03,
    -0.05,
    0.1,
  )

  return Array.from({ length: 10 }, (_, i) => {
    const year = i + 1
    const base = Math.pow(annualFactor, age + year) // continue from current age
    const retention = Math.max(base * (1 - mileagePenalty * (year / 10)), 0)
    return {
      year,
      retention: +(retention * 100).toFixed(1),
      value: Math.round(msrp * retention),
    }
  })
}

/**
 * Full buy-vs-lease breakdown, all figures as 5-year present values.
 *
 * Operating costs (maintenance + fuel) are identical between buying and leasing
 * the same vehicle, so they cancel in the recommendation — but they're included
 * here so each NPV reads as a real 5-year cost of ownership.
 */
export function calcNPVBreakdown(vehicleData) {
  const {
    fuelType = 'EV',
    msrp = 0,
    milesPerYear = DEFAULT_ANNUAL_MILES,
  } = vehicleData
  const isEv = fuelType !== 'ICE'
  const { retention5 } = resolveTier(vehicleData)
  const r = NPV.discountRate
  const years = NPV.horizonYears

  // Operating costs (present value), shared by both options.
  const maintenance = isEv ? MAINTENANCE_PER_YEAR.ev : MAINTENANCE_PER_YEAR.ice
  const fuelPerMile = isEv ? FUEL_COST_PER_MILE.ev : FUEL_COST_PER_MILE.ice
  const annualFuel = milesPerYear * fuelPerMile
  const annualOps = maintenance + annualFuel
  const opsPV = annualOps * annuityFactor(r, years)

  // Buy: pay MSRP now, recover resale at year 5 (discounted at the residual rate).
  const resaleValue = msrp * retention5
  const resalePV = resaleValue / Math.pow(1 + RESIDUAL_DISCOUNT_RATE, years)
  const buyNPV = msrp - resalePV + opsPV

  // Lease: monthly payment = rate × MSRP, discounted monthly over the term.
  const monthlyRate = isEv ? LEASE_RATE.ev : LEASE_RATE.ice
  const monthlyPayment = msrp * monthlyRate
  const leasePaymentsPV = monthlyPayment * monthlyAnnuityFactor(r, years * 12)
  const leaseNPV = leasePaymentsPV + opsPV

  return {
    buyNPV,
    leaseNPV,
    resaleValue,
    resalePV,
    leasePaymentsPV,
    opsPV,
    annualOps,
    annualFuel,
    maintenance,
    monthlyPayment,
    retention5,
  }
}

/**
 * calcNPV — 5-year present-value cost for a single mode.
 * @param {object} vehicleData
 * @param {'buy'|'lease'} mode
 */
export function calcNPV(vehicleData, mode) {
  const b = calcNPVBreakdown(vehicleData)
  return mode === 'lease' ? b.leaseNPV : b.buyNPV
}

/**
 * getRecommendation — verdict + dollar advantage + reasoning.
 * Lower NPV (cost) wins. First arg is the lease NPV, second the buy NPV.
 */
export function getRecommendation(leaseNPV, buyNPV) {
  const leaseWins = leaseNPV < buyNPV
  const advantage = Math.abs(buyNPV - leaseNPV)
  const verdict = leaseWins ? 'LEASE' : 'BUY'
  const reasoning = leaseWins
    ? `Leasing comes out ${usd(advantage)} cheaper over 5 years in present-value terms. The subsidized lease rate outweighs the resale value you'd keep by owning.`
    : `Buying comes out ${usd(advantage)} cheaper over 5 years in present-value terms. Strong resale value and a pricier lease rate tip the math toward ownership.`

  return { verdict, advantage, leaseNPV, buyNPV, reasoning }
}

/**
 * comparisonCurve — retention (%) from new across `years` for three lines:
 * the vehicle, the EV average, and the ICE average. Includes the vehicle's
 * dollar value at each point (for the tooltip). Year 0 = 100%.
 */
export function comparisonCurve(vehicleData, years = 10) {
  const { msrp = 0 } = vehicleData
  const { retention5 } = resolveTier(vehicleData)
  const aVehicle = Math.pow(retention5, 1 / NPV.horizonYears)
  const aEv = Math.pow(VALUE_RETENTION.ev, 1 / NPV.horizonYears)
  const aIce = Math.pow(VALUE_RETENTION.ice, 1 / NPV.horizonYears)

  return Array.from({ length: years }, (_, y) => ({
    year: y,
    vehicle: +(Math.pow(aVehicle, y) * 100).toFixed(1),
    evAvg: +(Math.pow(aEv, y) * 100).toFixed(1),
    iceAvg: +(Math.pow(aIce, y) * 100).toFixed(1),
    vehicleValue: Math.round(msrp * Math.pow(aVehicle, y)),
  }))
}

/**
 * valueProjection — per-year table rows (years 0..years) for the vehicle:
 * projected value, cumulative value lost, and retention %.
 */
export function valueProjection(vehicleData, years = NPV.horizonYears) {
  const { msrp = 0 } = vehicleData
  const { retention5 } = resolveTier(vehicleData)
  const annual = Math.pow(retention5, 1 / NPV.horizonYears)

  return Array.from({ length: years + 1 }, (_, y) => {
    const retention = Math.pow(annual, y)
    const value = Math.round(msrp * retention)
    return {
      year: y,
      value,
      valueLost: Math.round(msrp - value),
      retention: +(retention * 100).toFixed(1),
    }
  })
}

/**
 * financials — buy/lease card figures plus a year-by-year cumulative cost series.
 * Card values are nominal (out-of-pocket) except `npv`, which is present value.
 */
export function financials(vehicleData) {
  const b = calcNPVBreakdown(vehicleData)
  const years = NPV.horizonYears
  const annualLease = b.monthlyPayment * 12

  // Gross cash outlay (before recovering resale). Buying requires more cash out;
  // the residual is shown separately as a credit, and NPV is the tie-breaker —
  // this keeps every visible cost consistent with the NPV-based verdict rather
  // than netting resale into a total that could undercut it.
  const buyGross = (vehicleData.msrp ?? 0) + b.annualOps * years
  const leaseTotal = annualLease * years + b.annualOps * years

  // Cumulative cash spent by year (gross — resale is credited at sale, shown
  // on the buy card). Buy fronts the MSRP; lease accrues linearly.
  const cumulative = Array.from({ length: years + 1 }, (_, y) => ({
    year: y,
    buy: Math.round((vehicleData.msrp ?? 0) + b.annualOps * y),
    lease: Math.round(annualLease * y + b.annualOps * y),
  }))

  return {
    ...b,
    buy: {
      monthly: buyGross / (years * 12),
      total: buyGross,
      residual: b.resaleValue,
      npv: b.buyNPV,
    },
    lease: {
      monthly: leaseTotal / (years * 12),
      total: leaseTotal,
      residual: 0,
      npv: b.leaseNPV,
    },
    cumulative,
  }
}

/** Convenience: run the whole projection for a vehicle in one call. */
export function runProjection(vehicleData) {
  const breakdown = calcNPVBreakdown(vehicleData)
  const curve = calcDepreciationCurve(
    vehicleData.make,
    vehicleData.msrp,
    vehicleData.age ?? 0,
    vehicleData.milesPerYear ?? DEFAULT_ANNUAL_MILES,
    vehicleData.fuelType ?? 'EV',
  )
  const recommendation = getRecommendation(breakdown.leaseNPV, breakdown.buyNPV)
  return {
    breakdown,
    curve,
    recommendation,
    tier: resolveTier(vehicleData),
    comparison: comparisonCurve(vehicleData),
    projectionTable: valueProjection(vehicleData),
    money: financials(vehicleData),
  }
}
