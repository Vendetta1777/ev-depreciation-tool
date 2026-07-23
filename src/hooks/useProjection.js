import { useMemo } from 'react'
import { priceTier, retentionCurve } from '../utils/projections'
import { VALUE_RETENTION } from '../data/constants'

/**
 * useProjection — Phase 1 stub.
 *
 * Given basic vehicle inputs, returns the retention curve + tier. Phase 2
 * expands this to full resale + buy-vs-lease NPV, optionally delegating the
 * heavy calc to the FastAPI backend via axios.
 *
 * @param {{ msrp?: number, powertrain?: 'ev' | 'ice' }} input
 */
export default function useProjection(input = {}) {
  const { msrp = 0, powertrain = 'ev' } = input

  return useMemo(() => {
    const tier = powertrain === 'ice' ? 'ice' : priceTier(msrp)
    const retentionAtHorizon = VALUE_RETENTION[tier] ?? VALUE_RETENTION.ev
    return {
      tier,
      retentionAtHorizon,
      curve: retentionCurve(retentionAtHorizon),
    }
  }, [msrp, powertrain])
}
