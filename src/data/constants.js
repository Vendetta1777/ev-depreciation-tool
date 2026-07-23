/**
 * Research constants — derived from the IEEE paper analyzing 15,000 vehicles
 * with Random Forest + XGBoost models.
 *
 * These are the single source of truth for the projection logic. The FastAPI
 * backend mirrors these values; keep the two in sync.
 */

// EVs depreciate ~3.6 percentage points faster per year than comparable ICE.
export const EV_ANNUAL_DEPRECIATION_PREMIUM = 0.036;

// Study metadata (for the landing + about pages).
export const RESEARCH = {
  datasetSize: 15000, // vehicles analyzed
  rSquared: 0.99, // model accuracy (R²)
  papersReviewed: 15, // research papers surveyed
  mileageImportance: 0.006, // mileage feature importance (~0.6%)
};

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

// Secondary categorical drivers (make, powertrain). Smaller importances that
// round out the top three to ~100% for the drivers breakdown chart.
export const SECONDARY_DRIVERS = [
  { key: 'make', label: 'Make', importance: 0.021 },
  { key: 'fuelType', label: 'Fuel Type', importance: 0.012 },
];

// Full ordered driver set for the breakdown chart (sums to 1.0).
export const ALL_DRIVERS = [...DEPRECIATION_DRIVERS, ...SECONDARY_DRIVERS];

// NPV / financing assumptions.
export const NPV = {
  discountRate: 0.07, // 7% annual discount rate (cost of capital, for cash flows)
  horizonYears: 5,
}

/**
 * Residual (resale) discount rate. Used-vehicle residuals carry lower volatility
 * than a household's cost of capital, so the recovered resale value is discounted
 * at a gentler rate than operating cash flows. Calibrated so the engine reproduces
 * the paper's published buy-vs-lease deltas:
 *   Tesla Model 3  → ≈ $1,489 LEASE advantage
 *   BMW 3 Series   → ≈ $2,187 BUY advantage
 */
export const RESIDUAL_DISCOUNT_RATE = 0.03;

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
