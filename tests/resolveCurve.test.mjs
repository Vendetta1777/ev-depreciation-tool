/**
 * Phase B — resolveCurve resolution tests.
 * Run: npm test  (node --test)
 *
 * The "TODO named model → segment" case runs against the REAL curves.json,
 * where every row is currently status:"todo". That proves the production
 * contract: a TODO named row must NOT return a null curve — it degrades to the
 * segment fallback with a note.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { resolveCurve, priceBand } from '../src/lib/curves.js'

const here = dirname(fileURLToPath(import.meta.url))
const realDoc = JSON.parse(readFileSync(resolve(here, '../public/data/curves.json'), 'utf8'))

// A fixture doc with ONE ready named model, reusing the real meta + segments.
const readyDoc = {
  meta: realDoc.meta,
  models: [
    {
      key: 'acme-bolt',
      powertrain: 'EV',
      body_class: 'sedan',
      price_band: 'mid',
      retention: [0.7, 0.6, 0.52, 0.46, 0.41],
      spread_pct: 5,
      source: 'Test source',
      source_year: 2024,
      source_url: 'https://example.com',
      status: 'ready',
    },
  ],
  segments: realDoc.segments,
}

test('named model exists but is TODO → falls through to segment (never a null curve)', () => {
  // BMW i4's named row is still TODO; it must degrade to the EV-sedan-mid segment.
  const v = { make: 'BMW', model: 'i4', powertrain: 'EV', body_class: 'Midsize Cars', msrp: 52000, year: 2022 }
  const r = resolveCurve(v, realDoc)
  assert.equal(r.matchLevel, 'segment')
  assert.notEqual(r.curve, null)
  assert.equal(r.curve.key, 'seg-ev-sedan-mid')
  assert.match(r.note, /No BMW i4 curve available/)
  assert.match(r.note, /mid-priced EV sedan average/)
})

test('a filled named model resolves EXACT (Model 3 now has a per-model curve)', () => {
  const v = { make: 'Tesla', model: 'Model 3', powertrain: 'EV', body_class: 'Midsize Cars', msrp: 40000, year: 2022 }
  const r = resolveCurve(v, realDoc)
  assert.equal(r.matchLevel, 'exact')
  assert.equal(r.curve.key, 'tesla-model-3')
  assert.equal(r.curve.status, 'ready')
  assert.equal(r.note, null)
})

test('ready named model → exact match, no note', () => {
  const v = { make: 'Acme', model: 'Bolt', powertrain: 'EV', body_class: 'sedan', msrp: 40000, year: 2022 }
  const r = resolveCurve(v, readyDoc)
  assert.equal(r.matchLevel, 'exact')
  assert.equal(r.curve.key, 'acme-bolt')
  assert.equal(r.note, null)
})

test('ready named model that is pre-2012 → refuse (year gate beats exact)', () => {
  const v = { make: 'Acme', model: 'Bolt', powertrain: 'EV', body_class: 'sedan', msrp: 40000, year: 2010 }
  const r = resolveCurve(v, readyDoc)
  assert.equal(r.matchLevel, 'refuse')
  assert.equal(r.curve, null)
  assert.match(r.note, /2012/)
})

test('commercial body class → refuse', () => {
  const v = { make: 'Ford', model: 'Transit', powertrain: 'ICE', body_class: 'Vans, Cargo Type', msrp: 45000, year: 2022 }
  const r = resolveCurve(v, realDoc)
  assert.equal(r.matchLevel, 'refuse')
  assert.match(r.note, /[Cc]ommercial/)
})

test('unresolvable body class → refuse', () => {
  const v = { make: 'Weird', model: 'Thing', powertrain: 'ICE', body_class: 'Autocycle', msrp: 30000, year: 2022 }
  const r = resolveCurve(v, realDoc)
  assert.equal(r.matchLevel, 'refuse')
  assert.match(r.note, /body type/)
})

test('missing body class (needed for segment) → refuse', () => {
  const v = { make: 'Nissan', model: 'Frontier', powertrain: 'ICE', msrp: 31000, year: 2022 }
  const r = resolveCurve(v, realDoc)
  assert.equal(r.matchLevel, 'refuse')
  assert.match(r.note, /body type/)
})

test('NHTSA SUV class maps to suv segment', () => {
  const v = {
    make: 'Rivian',
    model: 'R1S',
    powertrain: 'EV',
    body_class: 'Standard Sport Utility Vehicle 4WD',
    msrp: 76000,
    year: 2023,
  }
  const r = resolveCurve(v, realDoc)
  assert.equal(r.matchLevel, 'segment')
  assert.equal(r.curve.key, 'seg-ev-suv-premium')
})

test('powertrain with no segment (PHEV) → refuse, not a wrong fallback', () => {
  const v = { make: 'Some', model: 'Plugin', powertrain: 'PHEV', body_class: 'Midsize Cars', msrp: 45000, year: 2022 }
  const r = resolveCurve(v, realDoc)
  assert.equal(r.matchLevel, 'refuse')
  assert.match(r.note, /No published curve/)
})

test('legacy fuelType is accepted in place of powertrain', () => {
  // Subaru Outback has no named curve → segment path exercises the fuelType map.
  const v = { make: 'Subaru', model: 'Outback', fuelType: 'ICE', body_class: 'Small Sport Utility Vehicle 4WD', msrp: 29000, year: 2022 }
  const r = resolveCurve(v, realDoc)
  assert.equal(r.matchLevel, 'segment')
  assert.equal(r.curve.key, 'seg-ice-suv-budget')
})

test('priceBand honors the document bounds', () => {
  const b = realDoc.meta.price_band_bounds
  assert.equal(priceBand(20000, b), 'budget')
  assert.equal(priceBand(b.budget_max - 1, b), 'budget')
  assert.equal(priceBand(b.budget_max, b), 'mid')
  assert.equal(priceBand(b.premium_min - 1, b), 'mid')
  assert.equal(priceBand(b.premium_min, b), 'premium')
})
