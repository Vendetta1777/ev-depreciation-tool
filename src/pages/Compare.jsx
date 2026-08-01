import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadCurves, resolveCurve } from '../lib/curves.js'
import { compareVehicles } from '../lib/finance.ts'
import { CURVE_VEHICLES, DEFAULT_YEAR } from '../data/curveVehicles.js'
import { usd } from '../utils/format.js'
import { ProvenanceChip, Citation, Slider, StatRow } from '../components/uiBits.jsx'
import VehicleSelect from '../components/VehicleSelect.jsx'

const label = (v, year) => `${year} ${v.make} ${v.model}`

/** Opposite powertrain class, closest MSRP — a suggestion, not an equivalence claim. */
function suggestEquivalent(vehicle, msrp) {
  const aIsEv = vehicle.powertrain === 'EV'
  let best = null
  let bestDiff = Infinity
  for (const v of CURVE_VEHICLES) {
    if ((v.powertrain === 'EV') === aIsEv) continue
    const diff = Math.abs(v.msrp - msrp)
    if (diff < bestDiff) {
      bestDiff = diff
      best = v
    }
  }
  return best
}

function breakevenSentence(name, value, loser) {
  if (value == null) return null
  switch (name) {
    case 'milesPerYear':
      return `Switches to the ${loser} above ${Math.round(value).toLocaleString()} mi/yr.`
    case 'fuelPricePerGallon':
      return `Switches to the ${loser} when gas passes $${value.toFixed(2)}/gal.`
    case 'electricityPricePerKwh':
      return `Switches to the ${loser} when electricity passes $${value.toFixed(2)}/kWh.`
    case 'incentive':
      return `Switches to the ${loser} with an EV incentive above ${usd(value)}.`
    default:
      return null
  }
}

function TcoPanel({ side }) {
  if (!side.ready) {
    const heading = side.reason === 'refuse' ? 'not covered' : 'figures pending'
    return (
      <div className="rounded-2xl border border-warning/40 bg-warning/5 p-4">
        <h3 className="text-sm font-bold text-warning">
          {side.label} — {heading}
        </h3>
        <p className="mt-1 text-xs text-ink">{side.note}</p>
      </div>
    )
  }
  const t = side.tco
  return (
    <div className="rounded-2xl border border-border bg-surface-raised/60 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{side.label}</h3>
        <ProvenanceChip provenance={side.provenance} />
      </div>
      <StatRow label="Depreciation" value={usd(t.depreciation)} />
      <StatRow label="Energy" value={usd(t.energy)} />
      <StatRow label="Insurance" value={usd(t.insurance)} />
      <StatRow label="Maintenance" value={usd(t.maintenance)} />
      <StatRow label="Registration" value={usd(t.registration)} />
      <StatRow label="Incentives" value={usd(t.incentives)} />
      <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
        <span className="text-sm font-semibold text-ink">5-year total</span>
        <span className="tabular text-lg font-bold text-ink">{usd(t.total)}</span>
      </div>
      <Citation provenance={side.provenance} />
    </div>
  )
}

const ACCORD = CURVE_VEHICLES.find((v) => v.make === 'Honda' && v.model === 'Accord')

export default function Compare() {
  const [doc, setDoc] = useState(null)
  const [vehA, setVehA] = useState(CURVE_VEHICLES[0]) // Model 3
  const [vehB, setVehB] = useState(ACCORD)
  const [yearA, setYearA] = useState(DEFAULT_YEAR)
  const [yearB, setYearB] = useState(DEFAULT_YEAR)
  const [msrpA, setMsrpA] = useState(CURVE_VEHICLES[0].msrp)
  const [msrpB, setMsrpB] = useState(ACCORD.msrp)
  const [milesPerYear, setMiles] = useState(12000)
  const [fuelPricePerGallon, setFuel] = useState(3.5)
  const [electricityPricePerKwh, setElec] = useState(0.17)
  const [incentiveA, setIncA] = useState(0)
  const [incentiveB, setIncB] = useState(0)

  useEffect(() => {
    loadCurves().then(setDoc)
  }, [])

  const selectA = (v) => {
    setVehA(v)
    if (typeof v.msrp === 'number') setMsrpA(v.msrp)
  }
  const selectB = (v) => {
    setVehB(v)
    if (typeof v.msrp === 'number') setMsrpB(v.msrp)
  }

  const result = useMemo(() => {
    if (!doc) return null
    const sideA = {
      label: label(vehA, yearA),
      resolved: resolveCurve({ ...vehA, year: yearA }, doc),
      msrp: msrpA,
      powertrain: vehA.powertrain,
      incentive: incentiveA,
    }
    const sideB = {
      label: label(vehB, yearB),
      resolved: resolveCurve({ ...vehB, year: yearB }, doc),
      msrp: msrpB,
      powertrain: vehB.powertrain,
      incentive: incentiveB,
    }
    return compareVehicles(sideA, sideB, { milesPerYear, years: 5, fuelPricePerGallon, electricityPricePerKwh })
  }, [doc, vehA, vehB, yearA, yearB, msrpA, msrpB, milesPerYear, fuelPricePerGallon, electricityPricePerKwh, incentiveA, incentiveB])

  const verdict = result?.verdict
  const be = result?.breakeven
  const live = verdict?.liveVariables ?? []
  const sentences =
    verdict && be
      ? live.map((n) => breakevenSentence(n, be[n], verdict.loserLabel)).filter(Boolean)
      : []

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">EV vs. gas: which costs less?</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Total 5-year cost of ownership for two vehicles you choose.{' '}
          <Link to="/methodology" className="text-teal-400 underline decoration-dotted underline-offset-2 hover:text-teal">
            How this is computed →
          </Link>
        </p>
      </header>

      {/* Pickers */}
      <section className="mb-3 grid gap-4 sm:grid-cols-2">
        <VehicleSelect
          title="Vehicle A"
          vehicle={vehA}
          year={yearA}
          msrp={msrpA}
          onVehicle={selectA}
          onYear={setYearA}
          onMsrp={setMsrpA}
          chips={CURVE_VEHICLES.filter((v) => v.powertrain === 'EV').slice(0, 6)}
        />
        <div>
          <div className="mb-1 flex items-center justify-end">
            <button
              type="button"
              onClick={() => selectB(suggestEquivalent(vehA, msrpA))}
              className="text-xs font-medium text-teal-400 hover:text-teal"
            >
              ↺ Suggest an equivalent for A
            </button>
          </div>
          <VehicleSelect
            title="Vehicle B"
            vehicle={vehB}
            year={yearB}
            msrp={msrpB}
            onVehicle={selectB}
            onYear={setYearB}
            onMsrp={setMsrpB}
            chips={CURVE_VEHICLES.filter((v) => v.powertrain !== 'EV').slice(0, 6)}
          />
        </div>
      </section>
      <p className="mb-6 text-xs text-ink-muted">
        Pick any two vehicles. &ldquo;Suggest an equivalent&rdquo; picks an opposite-powertrain match by price — it&rsquo;s
        a suggestion, not a claim the two are equivalent.
      </p>

      {/* Verdict */}
      {verdict ? (
        <section className="rounded-2xl border border-border bg-surface-raised p-5 sm:p-7">
          <p className="text-2xl font-extrabold leading-tight text-ink sm:text-3xl">
            <span className="text-teal">{verdict.winnerLabel}</span> costs{' '}
            <span className="tabular">{usd(verdict.amount)}</span> less over {verdict.horizonYears} years.
          </p>
          {sentences.length > 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              <span className="font-semibold text-ink">Breakeven: </span>
              {sentences.join(' ')}
            </p>
          ) : (
            <p className="mt-3 text-sm text-ink-muted">No single assumption flips this in a realistic range.</p>
          )}
          {result.provenanceComparison?.note && (
            <p className="mt-4 rounded-lg border border-warning/40 bg-warning/5 p-3 text-xs text-warning">
              {result.provenanceComparison.note}
            </p>
          )}
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-surface-raised/60 p-5 text-sm text-ink-muted">
          No verdict — one vehicle&rsquo;s figures are still pending (see below). The tool won&rsquo;t compare against a
          number it doesn&rsquo;t have.
        </section>
      )}

      {/* Two TCO breakdowns */}
      {result && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <TcoPanel side={result.a} />
          <TcoPanel side={result.b} />
        </section>
      )}

      {/* Sliders */}
      <section className="mt-6 rounded-2xl border border-border bg-surface-raised/60 p-4 sm:p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">Adjust the assumptions</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Slider
            label="Miles per year"
            live={live.includes('milesPerYear')}
            value={milesPerYear}
            min={0}
            max={30000}
            step={500}
            onChange={setMiles}
            format={(v) => `${v.toLocaleString()} mi`}
          />
          <Slider
            label="Gas price"
            live={live.includes('fuelPricePerGallon')}
            value={fuelPricePerGallon}
            min={2}
            max={7}
            step={0.1}
            onChange={setFuel}
            format={(v) => `$${v.toFixed(2)}/gal`}
          />
          <Slider
            label="Electricity price"
            live={live.includes('electricityPricePerKwh')}
            value={electricityPricePerKwh}
            min={0.05}
            max={0.4}
            step={0.01}
            onChange={setElec}
            format={(v) => `$${v.toFixed(2)}/kWh`}
          />
          <div />
          <Slider
            label="Incentive — Vehicle A"
            help="State/local only. The federal EV tax credit expired Sep 30, 2025."
            live={live.includes('incentive')}
            value={incentiveA}
            min={0}
            max={15000}
            step={250}
            onChange={setIncA}
            format={(v) => usd(v)}
          />
          <Slider
            label="Incentive — Vehicle B"
            help="State/local only. The federal EV tax credit expired Sep 30, 2025."
            live={live.includes('incentive')}
            value={incentiveB}
            min={0}
            max={15000}
            step={250}
            onChange={setIncB}
            format={(v) => usd(v)}
          />
        </div>
      </section>
    </div>
  )
}
