/**
 * Client-side projection helpers.
 *
 * Phase 1: stubs + the shared math the UI and the FastAPI backend agree on.
 * Phase 2 wires these into the results dashboard (and/or calls the API).
 */
import {
  NPV,
  VALUE_RETENTION,
  PRICE_TIERS,
} from '../data/constants'

/** Bucket an EV by MSRP into 'budgetEv' | 'luxuryEv' | 'ev'. */
export function priceTier(msrp) {
  if (msrp < PRICE_TIERS.budgetMax) return 'budgetEv'
  if (msrp > PRICE_TIERS.luxuryMin) return 'luxuryEv'
  return 'ev'
}

/**
 * Retention curve: fraction of MSRP retained at year 0..horizon.
 * Uses a constant annual rate implied by the tier's 5-year retention.
 */
export function retentionCurve(retentionAtHorizon, horizon = NPV.horizonYears) {
  const annual = Math.pow(retentionAtHorizon, 1 / horizon)
  return Array.from({ length: horizon + 1 }, (_, year) => ({
    year,
    retained: Math.pow(annual, year),
  }))
}

/** Discount a nominal future amount to present value. */
export function presentValue(amount, year, rate = NPV.discountRate) {
  return amount / Math.pow(1 + rate, year)
}

export { VALUE_RETENTION }
