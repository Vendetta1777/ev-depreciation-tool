import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadCurves, resolveCurve } from '../lib/curves.js'
import { compareVehicles } from '../lib/finance.ts'
import { CURVE_VEHICLES, DEFAULT_YEAR } from '../data/curveVehicles.js'
import { usd } from '../utils/format.js'
import { ProvenanceChip, Citation, Slider, StatRow } from '../components/uiBits.jsx'

const label = (v) => `${DEFAULT_YEAR} ${v.make} ${v.model}`

/** Opposite powertrain class, closest MSRP — a suggestion, not an equivalence claim. */
function suggestEquivalent(aIdx) {
  const a = CURVE_VEHICLES[aIdx]
  const aIsEv = a.powertrain === 'EV'
  let best = -1
  let bestDiff = Infinity
  CURVE_VEHICLES.forEach((v, i) => {
    if ((v.powertrain === 'EV') === aIsEv) return
    const diff = Math.abs(v.msrp - a.msrp)
    if (diff < bestDiff) {
      bestDiff = diff
      best = i
    }
  })
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

function VehiclePicker({ title, idx, msrp, onPick, onMsrp, extra }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised/60 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</span>
        {extra}
      </div>
      <select
        value={idx}
        onChange={(e) => onPick(Number(e.target.value))}
        className="mb-3 w-full rounded-lg border border-border bg-navy px-3 py-2.5 text-ink"
      >
        {CURVE_VEHICLES.map((v, i) => (
          <option key={`${v.make}-${v.model}`} value={i}>
            {label(v)} · {v.powertrain}
          </option>
        ))}
      </select>
      <label className="block">
        <span className="mb-1 block text-xs text-ink-muted">MSRP</span>
        <input
          type="number"
          value={msrp}
          min={10000}
          max={250000}
          step={500}
          onChange={(e) => onMsrp(Number(e.target.value))}
          className="tabular w-full rounded-lg border border-border bg-navy px-3 py-2 text-ink"
        />
      </label>
    </div>
  )
}

function TcoPanel({ side }) {
  if (!side.ready) {
    return (
      <div className="rounded-2xl border border-warning/40 bg-warning/5 p-4">
        <h3 className="text-sm font-bold text-warning">{side.label} — figures pending</h3>
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

export default function Compare() {
  const [doc, setDoc] = useState(null)
  const [idxA, setIdxA] = useState(0) // Model 3
  const [idxB, setIdxB] = useState(() => CURVE_VEHICLES.findIndex((v) => v.make === 'Honda' && v.model === 'Accord'))
  const [msrpA, setMsrpA] = useState(CURVE_VEHICLES[0].msrp)
  const [msrpB, setMsrpB] = useState(
    CURVE_VEHICLES[CURVE_VEHICLES.findIndex((v) => v.make === 'Honda' && v.model === 'Accord')].msrp,
  )
  const [milesPerYear, setMiles] = useState(12000)
  const [fuelPricePerGallon, setFuel] = useState(3.5)
  const [electricityPricePerKwh, setElec] = useState(0.17)
  const [incentiveA, setIncA] = useState(0)
  const [incentiveB, setIncB] = useState(0)

  useEffect(() => {
    loadCurves().then(setDoc)
  }, [])

  const pickA = (i) => {
    setIdxA(i)
    setMsrpA(CURVE_VEHICLES[i].msrp)
  }
  const pickB = (i) => {
    setIdxB(i)
    setMsrpB(CURVE_VEHICLES[i].msrp)
  }

  const result = useMemo(() => {
    if (!doc) return null
    const va = CURVE_VEHICLES[idxA]
    const vb = CURVE_VEHICLES[idxB]
    const sideA = {
      label: label(va),
      resolved: resolveCurve({ ...va, year: DEFAULT_YEAR }, doc),
      msrp: msrpA,
      powertrain: va.powertrain,
      incentive: incentiveA,
    }
    const sideB = {
      label: label(vb),
      resolved: resolveCurve({ ...vb, year: DEFAULT_YEAR }, doc),
      msrp: msrpB,
      powertrain: vb.powertrain,
      incentive: incentiveB,
    }
    return compareVehicles(sideA, sideB, { milesPerYear, years: 5, fuelPricePerGallon, electricityPricePerKwh })
  }, [doc, idxA, idxB, msrpA, msrpB, milesPerYear, fuelPricePerGallon, electricityPricePerKwh, incentiveA, incentiveB])

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
      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <VehiclePicker title="Vehicle A" idx={idxA} msrp={msrpA} onPick={pickA} onMsrp={setMsrpA} />
        <VehiclePicker
          title="Vehicle B"
          idx={idxB}
          msrp={msrpB}
          onPick={pickB}
          onMsrp={setMsrpB}
          extra={
            <button
              type="button"
              onClick={() => pickB(suggestEquivalent(idxA))}
              className="text-xs font-medium text-teal-400 hover:text-teal"
            >
              ↺ Suggest an equivalent
            </button>
          }
        />
      </section>
      <p className="-mt-4 mb-6 text-xs text-ink-muted">
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
