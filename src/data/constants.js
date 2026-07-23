/**
 * Research constants — derived from the IEEE paper analyzing 15,000 vehicles
 * with Random Forest + XGBoost models.
 *
 * These are the single source of truth for the projection logic. The FastAPI
 * backend mirrors these values; keep the two in sync.
 */

// EVs depreciate ~3.6 percentage points faster per year than comparable ICE.
export const EV_ANNUAL_DEPRECIATION_PREMIUM = 0.036;

// 5-year value retention (fraction of original MSRP retained).
export const VALUE_RETENTION = {
  ev: 0.303, // all EVs, blended
  ice: 0.339, // internal-combustion baseline
  tesla: 0.414, // Tesla-specific
  budgetEv: 0.179, // EVs under $35k
  luxuryEv: 0.356, // EVs over $50k
};

// MSRP thresholds used to bucket an EV into budget / standard / luxury.
export const PRICE_TIERS = {
  budgetMax: 35000,
  luxuryMin: 50000,
};

// Feature importances from the ML models (sum ≈ 1.0 across top drivers).
export const DEPRECIATION_DRIVERS = [
  { key: 'vehicleAge', label: 'Vehicle Age', importance: 0.403 },
  { key: 'modelYear', label: 'Model Year', importance: 0.354 },
  { key: 'msrp', label: 'MSRP', importance: 0.21 },
];

// NPV / financing assumptions.
export const NPV = {
  discountRate: 0.07, // 7% annual discount rate
  horizonYears: 5,
};

// Monthly lease rate as a fraction of MSRP.
export const LEASE_RATE = {
  ev: 0.012, // 1.2% of MSRP / month
  ice: 0.015, // 1.5% of MSRP / month
};

// Annual maintenance cost (USD).
export const MAINTENANCE_PER_YEAR = {
  ev: 500,
  ice: 1200,
};

// Energy / fuel cost per mile (USD).
export const FUEL_COST_PER_MILE = {
  ev: 0.04,
  ice: 0.12,
};

// Sensible default the input form can seed.
export const DEFAULT_ANNUAL_MILES = 12000;
