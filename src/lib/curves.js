/**
 * Loader + lookup primitives for public/data/curves.json — the published
 * value-retention curves that replace the cancelled ML model.
 *
 * This module is intentionally thin: it fetches the data once, indexes it, and
 * exposes the *pure* key/price-band helpers that resolution is built on. The
 * actual `resolveCurve(vehicle)` matcher (exact → segment → refuse) lands in
 * Phase B and will import these helpers.
 *
 * @typedef {Object} CurveRow
 * @property {string}  key
 * @property {string}  powertrain              One of meta.powertrains.
 * @property {string}  body_class              Coarse class, one of meta.body_classes.
 * @property {string}  price_band              One of meta.price_bands.
 * @property {Array<number|null>} retention    y1..y5 fraction of MSRP (null = TODO).
 * @property {number|null} spread_pct          Cross-source variation (%), null = TODO.
 * @property {string|null} source
 * @property {number|null} source_year
 * @property {string|null} source_url
 * @property {'todo'|'ready'} status
 *
 * @typedef {Object} CurvesDoc
 * @property {Object} meta
 * @property {CurveRow[]} models
 * @property {CurveRow[]} segments
 */

/** @type {Promise<CurvesDoc>|null} Cached so the fetch happens at most once. */
let _cache = null

/**
 * Fetch and cache the curves document. Safe to call repeatedly — the network
 * request runs only on the first call.
 * @param {typeof fetch} [fetchImpl] Injectable for tests.
 * @returns {Promise<CurvesDoc>}
 */
export function loadCurves(fetchImpl = fetch) {
  if (!_cache) {
    _cache = fetchImpl('/data/curves.json').then((res) => {
      if (!res.ok) throw new Error(`Failed to load curves.json: ${res.status}`)
      return res.json()
    })
  }
  return _cache
}

/** Reset the module cache (tests only). */
export function _resetCurvesCache() {
  _cache = null
}

/**
 * Build fast lookup structures over a curves document:
 *   - byKey:   key → CurveRow (models and segments together)
 *   - segments: only the segment fallback rows
 *   - meta:    the document metadata (band bounds, allowed vocab)
 * @param {CurvesDoc} doc
 */
export function indexCurves(doc) {
  const byKey = new Map()
  for (const row of [...doc.models, ...doc.segments]) byKey.set(row.key, row)
  return { byKey, models: doc.models, segments: doc.segments, meta: doc.meta }
}

/**
 * Slugify a string the same way keys are minted in curves.json:
 * lowercase, non-alphanumeric runs → "-", trimmed.
 * @param {string} s
 */
export function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * The named-model curve key for a make/model pair. Mirrors meta.model_key_convention.
 * @param {string} make
 * @param {string} model
 */
export function curveKey(make, model) {
  return `${slug(make)}-${slug(model)}`
}

/**
 * The segment fallback key for a (powertrain, body_class, price_band) triple.
 * Mirrors meta.segment_key_convention.
 * @param {string} powertrain
 * @param {string} bodyClass
 * @param {string} priceBand
 */
export function segmentKey(powertrain, bodyClass, priceBand) {
  return `seg-${String(powertrain).toLowerCase()}-${bodyClass}-${priceBand}`
}

/**
 * Map an MSRP to a price band using the document's own bounds (single source
 * of truth — no thresholds are hard-coded here).
 * @param {number} msrp
 * @param {{budget_max:number, premium_min:number}} bounds meta.price_band_bounds
 * @returns {'budget'|'mid'|'premium'}
 */
export function priceBand(msrp, bounds) {
  if (msrp < bounds.budget_max) return 'budget'
  if (msrp >= bounds.premium_min) return 'premium'
  return 'mid'
}

/** True when a row has real, cited figures (not a TODO placeholder). */
export function isReady(row) {
  return row.status === 'ready' && row.retention.every((v) => typeof v === 'number')
}

// ── Resolution (Phase B) ─────────────────────────────────────────────

const COARSE = new Set(['sedan', 'hatchback', 'suv', 'truck', 'minivan', 'sports'])

/**
 * Collapse a body class into the coarse taxonomy the segment fallbacks use.
 * Accepts NHTSA/fueleconomy strings (as carried by the Phase 0 catalog) or an
 * already-coarse value. Returns a coarse class, the sentinel `'commercial'`,
 * or `null` when the class can't be resolved.
 * @param {string} bodyClass
 * @returns {'sedan'|'hatchback'|'suv'|'truck'|'minivan'|'sports'|'commercial'|null}
 */
export function coarseBodyClass(bodyClass) {
  if (!bodyClass) return null
  const s = String(bodyClass).toLowerCase().trim()
  if (COARSE.has(s)) return s
  if (s.includes('cargo') || s.includes('commercial') || s.includes('incomplete')) return 'commercial'
  if (s.includes('pickup') || s.includes('truck')) return 'truck'
  if (s.includes('minivan') || s.includes('van')) return 'minivan' // passenger vans → minivan
  if (s.includes('sport utility') || s.includes('suv') || s.includes('special purpose')) return 'suv'
  if (s.includes('wagon') || s.includes('hatchback')) return 'hatchback'
  if (s.includes('two seater') || s.includes('coupe') || s.includes('convertible') || s.includes('roadster'))
    return 'sports'
  if (s.includes('car') || s.includes('sedan')) return 'sedan' // mini/sub/compact/midsize/large "Cars"
  return null
}

const PT_NORMALIZE = {
  ev: 'EV',
  electric: 'EV',
  ice: 'ICE',
  gas: 'ICE',
  gasoline: 'ICE',
  petrol: 'ICE',
  hybrid: 'Hybrid',
  phev: 'PHEV',
  'plug-in hybrid': 'PHEV',
  diesel: 'Diesel',
  fcv: 'FCV',
  'fuel cell': 'FCV',
  hydrogen: 'FCV',
}

/**
 * Normalize a vehicle's powertrain to the curves vocab. Accepts `powertrain`
 * (preferred) or the app's legacy `fuelType` ('EV'/'ICE'). Unknown values pass
 * through unchanged so a later lookup simply misses (→ refuse) rather than guessing.
 * @param {{powertrain?:string, fuelType?:string}} vehicle
 */
export function powertrainOf(vehicle) {
  const raw = vehicle.powertrain ?? vehicle.fuelType ?? ''
  return PT_NORMALIZE[String(raw).toLowerCase().trim()] ?? raw
}

const PT_LABEL = { EV: 'EV', ICE: 'gas', Hybrid: 'hybrid', PHEV: 'plug-in hybrid', Diesel: 'diesel', FCV: 'hydrogen' }
const BODY_LABEL = { sedan: 'sedan', hatchback: 'hatchback', suv: 'SUV', truck: 'truck', minivan: 'minivan', sports: 'sports car' }
const BAND_LABEL = { budget: 'budget', mid: 'mid-priced', premium: 'premium' }

/** Human label for a segment, e.g. "mid-priced EV sedan". */
export function segmentLabel(powertrain, bodyClass, band) {
  return `${BAND_LABEL[band] ?? band} ${PT_LABEL[powertrain] ?? powertrain} ${BODY_LABEL[bodyClass] ?? bodyClass}`
}

/**
 * Resolve a vehicle to a retention curve.
 *
 * Order: hard refuse gates (pre-2012, commercial) → exact named-model curve
 * (ONLY when it is ready; a TODO named row is treated as absent) → segment
 * fallback → refuse. Never silently falls back — every non-exact result carries
 * a `note`, and the caller surfaces `matchLevel` in the UI (Phase D).
 *
 * @param {Object} vehicle
 * @param {string} vehicle.make
 * @param {string} vehicle.model
 * @param {number} [vehicle.year]          Model year (refuses < 2012).
 * @param {string} [vehicle.powertrain]    Or legacy `fuelType`.
 * @param {string} [vehicle.body_class]    NHTSA or coarse class.
 * @param {number} [vehicle.msrp]          Drives the price band.
 * @param {CurvesDoc} doc                  Loaded curves.json.
 * @returns {{curve: CurveRow|null, matchLevel:'exact'|'segment'|'refuse', note: string|null}}
 */
export function resolveCurve(vehicle, doc) {
  const { byKey, meta } = indexCurves(doc)
  const make = vehicle.make ?? ''
  const model = vehicle.model ?? ''
  const year = vehicle.year ?? vehicle.modelYear
  const refuse = (note) => ({ curve: null, matchLevel: 'refuse', note })

  // ── Hard vehicle-level refuse gates ──────────────────────────────
  if (typeof year === 'number' && year < 2012) {
    return refuse(`Retention data starts at model year 2012 — ${year} is out of range.`)
  }
  const coarse = coarseBodyClass(vehicle.body_class)
  if (coarse === 'commercial') {
    return refuse(`Commercial vehicles aren't covered by this tool.`)
  }

  // ── Exact named-model curve (TODO rows are treated as absent) ─────
  const exact = byKey.get(curveKey(make, model))
  if (exact && isReady(exact)) {
    return { curve: exact, matchLevel: 'exact', note: null }
  }

  // ── Segment fallback ─────────────────────────────────────────────
  if (!coarse) {
    return refuse(
      vehicle.body_class
        ? `Can't classify this vehicle's body type (${vehicle.body_class}) into a supported segment.`
        : `Need a body type to choose a segment curve.`,
    )
  }
  const powertrain = powertrainOf(vehicle)
  const band = priceBand(vehicle.msrp ?? 0, meta.price_band_bounds)
  const label = segmentLabel(powertrain, coarse, band)
  const seg = byKey.get(segmentKey(powertrain, coarse, band))
  if (!seg) {
    return refuse(`No published curve for ${label} vehicles yet.`)
  }
  const name = [make, model].filter(Boolean).join(' ').trim() || 'this vehicle'
  return {
    curve: seg,
    matchLevel: 'segment',
    note: `No ${name} curve available — using the ${label} average.`,
  }
}
