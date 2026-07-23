import { useMemo } from 'react'
import { runProjection } from '../utils/projections'

/**
 * useProjection — memoized full projection for a vehicle.
 *
 * @param {object|null} vehicleData { make, model, fuelType, msrp, age, milesPerYear }
 * @returns projection ({ breakdown, curve, recommendation, tier }) or null.
 */
export default function useProjection(vehicleData) {
  return useMemo(() => {
    if (!vehicleData || !vehicleData.msrp) return null
    return runProjection(vehicleData)
  }, [vehicleData])
}
