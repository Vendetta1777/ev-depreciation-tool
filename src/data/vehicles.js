/**
 * Vehicle catalog powering the chained Fuel Type → Make → Model dropdowns.
 *
 * `msrp` is a representative base price used to pre-fill the price field; users
 * can override it. Fuel type is explicit (a "BMW" can be an EV i4 or an ICE
 * 3 Series), so the projection logic never has to guess a powertrain from a make.
 */
export const VEHICLES = [
  // ── Electric ──────────────────────────────────────────────
  { make: 'Tesla', model: 'Model 3', fuelType: 'EV', msrp: 40000 },
  { make: 'Tesla', model: 'Model Y', fuelType: 'EV', msrp: 47000 },
  { make: 'Tesla', model: 'Model S', fuelType: 'EV', msrp: 80000 },
  { make: 'Nissan', model: 'Leaf', fuelType: 'EV', msrp: 28000 },
  { make: 'BMW', model: 'i4', fuelType: 'EV', msrp: 52000 },
  { make: 'Rivian', model: 'R1T', fuelType: 'EV', msrp: 73000 },

  // ── Internal combustion ───────────────────────────────────
  { make: 'Toyota', model: 'Camry', fuelType: 'ICE', msrp: 28000 },
  { make: 'BMW', model: '3 Series', fuelType: 'ICE', msrp: 44000 },
  { make: 'Honda', model: 'Accord', fuelType: 'ICE', msrp: 29000 },
  { make: 'Ford', model: 'F-150', fuelType: 'ICE', msrp: 38000 },
]

export const FUEL_TYPES = [
  { value: 'EV', label: 'Electric (EV)' },
  { value: 'ICE', label: 'Gas / Internal Combustion (ICE)' },
]

export const MODEL_YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018]

/** Makes available for a given fuel type (deduped, in catalog order). */
export function makesFor(fuelType) {
  const seen = new Set()
  return VEHICLES.filter((v) => v.fuelType === fuelType && !seen.has(v.make) && seen.add(v.make)).map(
    (v) => v.make,
  )
}

/** Models available for a given fuel type + make. */
export function modelsFor(fuelType, make) {
  return VEHICLES.filter((v) => v.fuelType === fuelType && v.make === make)
}

/** Look up the catalog entry for a fuel/make/model triple. */
export function findVehicle(fuelType, make, model) {
  return VEHICLES.find(
    (v) => v.fuelType === fuelType && v.make === make && v.model === model,
  )
}
