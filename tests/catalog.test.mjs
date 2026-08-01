/**
 * Catalog search: dedup to make+model, modal powertrain, and only
 * resolvable entries (has powertrain+body_class OR matches a named-ready curve).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadCatalog, _resetCatalogCache } from '../src/lib/catalog.js'
import { _resetCurvesCache } from '../src/lib/curves.js'

const catalogRows = [
  { make: 'Toyota', model: 'RAV4', year: 2022, powertrain: 'ICE', body_class: 'Small Sport Utility Vehicle 4WD' },
  { make: 'Toyota', model: 'RAV4', year: 2023, powertrain: 'ICE', body_class: 'Small Sport Utility Vehicle 4WD' },
  { make: 'Toyota', model: 'RAV4', year: 2023, powertrain: 'Hybrid', body_class: 'Small Sport Utility Vehicle 4WD' },
  { make: 'Ford', model: 'F-150', year: 2022 }, // bare, but named → included
  { make: 'Obscure', model: 'Thingamajig', year: 2022 }, // bare, not named → excluded
  { make: 'BMW', model: 'X5', year: 2022, powertrain: 'ICE', body_class: 'Standard Sport Utility Vehicle 4WD' },
]
const curvesDoc = {
  meta: {},
  models: [{ key: 'ford-f-150', retention: [0.8, 0.7, 0.6, 0.5, 0.4], status: 'ready' }],
  segments: [],
}
const fakeFetch = (url) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(String(url).includes('catalog') ? catalogRows : curvesDoc) })

test('dedups to make+model and picks the modal powertrain', async () => {
  _resetCurvesCache()
  _resetCatalogCache()
  const search = await loadCatalog(fakeFetch)
  const rav = search('rav4', 8)
  assert.equal(rav.length, 1) // deduped across years/variants
  assert.equal(rav[0].model, 'RAV4')
  assert.equal(rav[0].powertrain, 'ICE') // 2 ICE rows vs 1 Hybrid → ICE modal
})

test('a bare but named model is searchable (resolves by key)', async () => {
  _resetCurvesCache()
  _resetCatalogCache()
  const search = await loadCatalog(fakeFetch)
  const f = search('f-150', 8)
  assert.ok(f.some((v) => v.make === 'Ford' && v.model === 'F-150'))
})

test('a bare non-named model is excluded (would only refuse)', async () => {
  _resetCurvesCache()
  _resetCatalogCache()
  const search = await loadCatalog(fakeFetch)
  assert.equal(search('thingamajig', 8).length, 0)
})

test('fuzzy + prefix search works', async () => {
  _resetCurvesCache()
  _resetCatalogCache()
  const search = await loadCatalog(fakeFetch)
  assert.ok(search('rav', 8).some((v) => v.model === 'RAV4')) // prefix
})
