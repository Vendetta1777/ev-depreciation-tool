/**
 * Curated vehicles for the buy-vs-lease decision tool. Each carries the fields
 * resolveCurve needs (powertrain, body_class, price via msrp, year). body_class
 * is the coarse taxonomy — resolveCurve accepts it directly.
 *
 * The list spans every populated segment plus a couple that intentionally land
 * on a still-pending bucket (EV pickups), so the honest "figures pending" path
 * is reachable from the picker.
 */
export const CURVE_VEHICLES = [
  // ── Electric ──────────────────────────────────────────────
  { make: 'Tesla', model: 'Model 3', powertrain: 'EV', body_class: 'sedan', msrp: 40000 },
  { make: 'Tesla', model: 'Model Y', powertrain: 'EV', body_class: 'suv', msrp: 45000 },
  { make: 'Tesla', model: 'Model S', powertrain: 'EV', body_class: 'sedan', msrp: 90000 },
  { make: 'Ford', model: 'Mustang Mach-E', powertrain: 'EV', body_class: 'suv', msrp: 43000 },
  { make: 'Ford', model: 'F-150 Lightning', powertrain: 'EV', body_class: 'truck', msrp: 55000 },
  { make: 'Chevrolet', model: 'Bolt EV', powertrain: 'EV', body_class: 'hatchback', msrp: 27000 },
  { make: 'Hyundai', model: 'Ioniq 5', powertrain: 'EV', body_class: 'suv', msrp: 42000 },
  { make: 'Nissan', model: 'Leaf', powertrain: 'EV', body_class: 'hatchback', msrp: 28000 },
  { make: 'BMW', model: 'iX', powertrain: 'EV', body_class: 'suv', msrp: 87000 },
  { make: 'Rivian', model: 'R1S', powertrain: 'EV', body_class: 'suv', msrp: 76000 },

  // ── Gas / ICE ─────────────────────────────────────────────
  { make: 'Toyota', model: 'Camry', powertrain: 'ICE', body_class: 'sedan', msrp: 28000 },
  { make: 'Honda', model: 'Civic', powertrain: 'ICE', body_class: 'sedan', msrp: 25000 },
  { make: 'Honda', model: 'Accord', powertrain: 'ICE', body_class: 'sedan', msrp: 29000 },
  { make: 'BMW', model: '3 Series', powertrain: 'ICE', body_class: 'sedan', msrp: 44000 },
  { make: 'BMW', model: '7 Series', powertrain: 'ICE', body_class: 'sedan', msrp: 95000 },
  { make: 'Toyota', model: 'RAV4', powertrain: 'ICE', body_class: 'suv', msrp: 29000 },
  { make: 'Toyota', model: 'Highlander', powertrain: 'ICE', body_class: 'suv', msrp: 40000 },
  { make: 'BMW', model: 'X5', powertrain: 'ICE', body_class: 'suv', msrp: 66000 },
  { make: 'Toyota', model: 'Tacoma', powertrain: 'ICE', body_class: 'truck', msrp: 32000 },
  { make: 'Ford', model: 'F-150', powertrain: 'ICE', body_class: 'truck', msrp: 45000 },
  { make: 'Chevrolet', model: 'Silverado', powertrain: 'ICE', body_class: 'truck', msrp: 65000 },

  // ── Hybrid ────────────────────────────────────────────────
  { make: 'Toyota', model: 'Prius', powertrain: 'Hybrid', body_class: 'sedan', msrp: 27000 },
  { make: 'Toyota', model: 'RAV4 Hybrid', powertrain: 'Hybrid', body_class: 'suv', msrp: 33000 },
  { make: 'Honda', model: 'Accord Hybrid', powertrain: 'Hybrid', body_class: 'sedan', msrp: 34000 },
]

/** The prefilled example on load: 2022 Model 3. */
export const DEFAULT_VEHICLE_INDEX = 0
export const DEFAULT_YEAR = 2022
