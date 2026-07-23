/**
 * Vehicle catalog powering the Fuel Type, Make, Model dropdowns.
 *
 * `msrp` is a representative base price used to pre-fill the price field; users
 * can override it. Fuel type is explicit (a "BMW" can be an electric i4 or a
 * gas 3 Series), so the projection logic never has to guess a powertrain.
 */
export const VEHICLES = [
  // ── Electric ──────────────────────────────────────────────
  { make: 'Tesla', model: 'Model 3', fuelType: 'EV', msrp: 40000 },
  { make: 'Tesla', model: 'Model Y', fuelType: 'EV', msrp: 45000 },
  { make: 'Tesla', model: 'Model S', fuelType: 'EV', msrp: 75000 },
  { make: 'Tesla', model: 'Model X', fuelType: 'EV', msrp: 80000 },
  { make: 'Tesla', model: 'Cybertruck', fuelType: 'EV', msrp: 61000 },
  { make: 'Rivian', model: 'R1T', fuelType: 'EV', msrp: 70000 },
  { make: 'Rivian', model: 'R1S', fuelType: 'EV', msrp: 76000 },
  { make: 'Ford', model: 'Mustang Mach-E', fuelType: 'EV', msrp: 43000 },
  { make: 'Ford', model: 'F-150 Lightning', fuelType: 'EV', msrp: 55000 },
  { make: 'Chevrolet', model: 'Bolt EV', fuelType: 'EV', msrp: 27000 },
  { make: 'Chevrolet', model: 'Bolt EUV', fuelType: 'EV', msrp: 28000 },
  { make: 'Chevrolet', model: 'Silverado EV', fuelType: 'EV', msrp: 75000 },
  { make: 'BMW', model: 'i4', fuelType: 'EV', msrp: 52000 },
  { make: 'BMW', model: 'iX', fuelType: 'EV', msrp: 87000 },
  { make: 'BMW', model: 'i7', fuelType: 'EV', msrp: 106000 },
  { make: 'Mercedes', model: 'EQS', fuelType: 'EV', msrp: 105000 },
  { make: 'Mercedes', model: 'EQE', fuelType: 'EV', msrp: 75000 },
  { make: 'Mercedes', model: 'EQB', fuelType: 'EV', msrp: 53000 },
  { make: 'Audi', model: 'e-tron', fuelType: 'EV', msrp: 66000 },
  { make: 'Audi', model: 'Q4 e-tron', fuelType: 'EV', msrp: 50000 },
  { make: 'Audi', model: 'e-tron GT', fuelType: 'EV', msrp: 107000 },
  { make: 'Hyundai', model: 'Ioniq 5', fuelType: 'EV', msrp: 42000 },
  { make: 'Hyundai', model: 'Ioniq 6', fuelType: 'EV', msrp: 43000 },
  { make: 'Kia', model: 'EV6', fuelType: 'EV', msrp: 43000 },
  { make: 'Kia', model: 'EV9', fuelType: 'EV', msrp: 56000 },
  { make: 'Volkswagen', model: 'ID.4', fuelType: 'EV', msrp: 40000 },
  { make: 'Lucid', model: 'Air', fuelType: 'EV', msrp: 78000 },
  { make: 'Porsche', model: 'Taycan', fuelType: 'EV', msrp: 91000 },
  { make: 'Nissan', model: 'Leaf', fuelType: 'EV', msrp: 28000 },
  { make: 'Nissan', model: 'Ariya', fuelType: 'EV', msrp: 44000 },
  { make: 'Honda', model: 'Prologue', fuelType: 'EV', msrp: 48000 },
  { make: 'Toyota', model: 'bZ4X', fuelType: 'EV', msrp: 43000 },
  { make: 'Jeep', model: 'Wrangler 4xe', fuelType: 'EV', msrp: 51000 },
  { make: 'Jeep', model: 'Grand Cherokee 4xe', fuelType: 'EV', msrp: 62000 },
  { make: 'Volvo', model: 'XC40 Recharge', fuelType: 'EV', msrp: 54000 },
  { make: 'Volvo', model: 'C40 Recharge', fuelType: 'EV', msrp: 56000 },
  { make: 'Polestar', model: '2', fuelType: 'EV', msrp: 50000 },
  { make: 'Polestar', model: '3', fuelType: 'EV', msrp: 74000 },

  // ── Gas / internal combustion ─────────────────────────────
  { make: 'Toyota', model: 'Camry', fuelType: 'ICE', msrp: 28000 },
  { make: 'Toyota', model: 'Corolla', fuelType: 'ICE', msrp: 23000 },
  { make: 'Toyota', model: 'RAV4', fuelType: 'ICE', msrp: 29000 },
  { make: 'Toyota', model: 'Highlander', fuelType: 'ICE', msrp: 40000 },
  { make: 'Toyota', model: 'Tacoma', fuelType: 'ICE', msrp: 32000 },
  { make: 'Toyota', model: 'Tundra', fuelType: 'ICE', msrp: 41000 },
  { make: 'Toyota', model: '4Runner', fuelType: 'ICE', msrp: 42000 },
  { make: 'Honda', model: 'Accord', fuelType: 'ICE', msrp: 29000 },
  { make: 'Honda', model: 'Civic', fuelType: 'ICE', msrp: 25000 },
  { make: 'Honda', model: 'CR-V', fuelType: 'ICE', msrp: 31000 },
  { make: 'Honda', model: 'Pilot', fuelType: 'ICE', msrp: 40000 },
  { make: 'Honda', model: 'Odyssey', fuelType: 'ICE', msrp: 39000 },
  { make: 'Ford', model: 'F-150', fuelType: 'ICE', msrp: 38000 },
  { make: 'Ford', model: 'Mustang', fuelType: 'ICE', msrp: 33000 },
  { make: 'Ford', model: 'Explorer', fuelType: 'ICE', msrp: 39000 },
  { make: 'Ford', model: 'Escape', fuelType: 'ICE', msrp: 30000 },
  { make: 'Ford', model: 'Bronco', fuelType: 'ICE', msrp: 40000 },
  { make: 'Chevrolet', model: 'Silverado', fuelType: 'ICE', msrp: 38000 },
  { make: 'Chevrolet', model: 'Equinox', fuelType: 'ICE', msrp: 28000 },
  { make: 'Chevrolet', model: 'Tahoe', fuelType: 'ICE', msrp: 58000 },
  { make: 'Chevrolet', model: 'Malibu', fuelType: 'ICE', msrp: 27000 },
  { make: 'Chevrolet', model: 'Traverse', fuelType: 'ICE', msrp: 39000 },
  { make: 'BMW', model: '3 Series', fuelType: 'ICE', msrp: 44000 },
  { make: 'BMW', model: '5 Series', fuelType: 'ICE', msrp: 58000 },
  { make: 'BMW', model: 'X3', fuelType: 'ICE', msrp: 47000 },
  { make: 'BMW', model: 'X5', fuelType: 'ICE', msrp: 66000 },
  { make: 'BMW', model: 'M3', fuelType: 'ICE', msrp: 76000 },
  { make: 'BMW', model: 'M5', fuelType: 'ICE', msrp: 111000 },
  { make: 'Mercedes', model: 'C-Class', fuelType: 'ICE', msrp: 46000 },
  { make: 'Mercedes', model: 'E-Class', fuelType: 'ICE', msrp: 62000 },
  { make: 'Mercedes', model: 'GLC', fuelType: 'ICE', msrp: 48000 },
  { make: 'Mercedes', model: 'GLE', fuelType: 'ICE', msrp: 60000 },
  { make: 'Audi', model: 'A4', fuelType: 'ICE', msrp: 41000 },
  { make: 'Audi', model: 'A6', fuelType: 'ICE', msrp: 57000 },
  { make: 'Audi', model: 'Q5', fuelType: 'ICE', msrp: 45000 },
  { make: 'Audi', model: 'Q7', fuelType: 'ICE', msrp: 60000 },
  { make: 'Volkswagen', model: 'Jetta', fuelType: 'ICE', msrp: 22000 },
  { make: 'Volkswagen', model: 'Passat', fuelType: 'ICE', msrp: 28000 },
  { make: 'Volkswagen', model: 'Tiguan', fuelType: 'ICE', msrp: 29000 },
  { make: 'Volkswagen', model: 'Atlas', fuelType: 'ICE', msrp: 38000 },
  { make: 'Nissan', model: 'Altima', fuelType: 'ICE', msrp: 27000 },
  { make: 'Nissan', model: 'Sentra', fuelType: 'ICE', msrp: 22000 },
  { make: 'Nissan', model: 'Rogue', fuelType: 'ICE', msrp: 29000 },
  { make: 'Nissan', model: 'Pathfinder', fuelType: 'ICE', msrp: 37000 },
  { make: 'Nissan', model: 'Frontier', fuelType: 'ICE', msrp: 31000 },
  { make: 'Hyundai', model: 'Elantra', fuelType: 'ICE', msrp: 22000 },
  { make: 'Hyundai', model: 'Sonata', fuelType: 'ICE', msrp: 27000 },
  { make: 'Hyundai', model: 'Tucson', fuelType: 'ICE', msrp: 28000 },
  { make: 'Hyundai', model: 'Santa Fe', fuelType: 'ICE', msrp: 35000 },
  { make: 'Kia', model: 'Forte', fuelType: 'ICE', msrp: 20000 },
  { make: 'Kia', model: 'K5', fuelType: 'ICE', msrp: 27000 },
  { make: 'Kia', model: 'Sportage', fuelType: 'ICE', msrp: 28000 },
  { make: 'Kia', model: 'Telluride', fuelType: 'ICE', msrp: 37000 },
  { make: 'Subaru', model: 'Outback', fuelType: 'ICE', msrp: 29000 },
  { make: 'Subaru', model: 'Forester', fuelType: 'ICE', msrp: 27000 },
  { make: 'Subaru', model: 'Impreza', fuelType: 'ICE', msrp: 24000 },
  { make: 'Subaru', model: 'Crosstrek', fuelType: 'ICE', msrp: 26000 },
  { make: 'Subaru', model: 'WRX', fuelType: 'ICE', msrp: 32000 },
  { make: 'Jeep', model: 'Wrangler', fuelType: 'ICE', msrp: 33000 },
  { make: 'Jeep', model: 'Grand Cherokee', fuelType: 'ICE', msrp: 40000 },
  { make: 'Jeep', model: 'Cherokee', fuelType: 'ICE', msrp: 35000 },
  { make: 'Jeep', model: 'Gladiator', fuelType: 'ICE', msrp: 40000 },
  { make: 'Ram', model: '1500', fuelType: 'ICE', msrp: 40000 },
  { make: 'Ram', model: '2500', fuelType: 'ICE', msrp: 45000 },
  { make: 'GMC', model: 'Sierra', fuelType: 'ICE', msrp: 40000 },
  { make: 'GMC', model: 'Yukon', fuelType: 'ICE', msrp: 60000 },
  { make: 'GMC', model: 'Terrain', fuelType: 'ICE', msrp: 30000 },
  { make: 'Lexus', model: 'ES', fuelType: 'ICE', msrp: 43000 },
  { make: 'Lexus', model: 'IS', fuelType: 'ICE', msrp: 42000 },
  { make: 'Lexus', model: 'RX', fuelType: 'ICE', msrp: 48000 },
  { make: 'Lexus', model: 'GX', fuelType: 'ICE', msrp: 65000 },
  { make: 'Porsche', model: '911', fuelType: 'ICE', msrp: 116000 },
  { make: 'Porsche', model: 'Cayenne', fuelType: 'ICE', msrp: 79000 },
  { make: 'Porsche', model: 'Macan', fuelType: 'ICE', msrp: 61000 },
  { make: 'Land Rover', model: 'Defender', fuelType: 'ICE', msrp: 56000 },
  { make: 'Land Rover', model: 'Discovery', fuelType: 'ICE', msrp: 59000 },
  { make: 'Land Rover', model: 'Range Rover Sport', fuelType: 'ICE', msrp: 83000 },
]

export const FUEL_TYPES = [
  { value: 'EV', label: 'Electric' },
  { value: 'ICE', label: 'Gas' },
]

export const MODEL_YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018]

/** Makes available for a given fuel type (deduped, alphabetical). */
export function makesFor(fuelType) {
  const seen = new Set()
  for (const v of VEHICLES) {
    if (v.fuelType === fuelType) seen.add(v.make)
  }
  return [...seen].sort((a, b) => a.localeCompare(b))
}

/** Models available for a given fuel type and make (alphabetical). */
export function modelsFor(fuelType, make) {
  return VEHICLES.filter((v) => v.fuelType === fuelType && v.make === make).sort((a, b) =>
    a.model.localeCompare(b.model),
  )
}

/** Look up the catalog entry for a fuel/make/model triple. */
export function findVehicle(fuelType, make, model) {
  return VEHICLES.find(
    (v) => v.fuelType === fuelType && v.make === make && v.model === model,
  )
}
