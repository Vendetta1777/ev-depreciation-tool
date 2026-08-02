import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadCurves, resolveCurve } from '../lib/curves.js'
import { compareVehicles } from '../lib/finance.ts'
import { CURVE_VEHICLES, DEFAULT_YEAR } from '../data/curveVehicles.js'
import { usd } from '../utils/format.js'
import VehicleSelect from '../components/VehicleSelect.jsx'
import { Figure, Chip, Cite, Row, Rail, Eyebrow } from '../components/editorial.jsx'

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
      <div className="rule border-l-2 border-warning/50 py-1 pl-4">
        <h3 className="font-serif text-2xl text-warning">
          {side.label} — {heading}
        </h3>
        <p className="mt-1 text-xs text-ink-muted">{side.note}</p>
      </div>
    )
  }
  const t = side.tco
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-ink">{side.label}</h3>
        <Chip provenance={side.provenance} />
      </div>
      <Row label="Depreciation" value={t.depreciation} />
      <Row label="Energy" value={t.energy} />
      <Row label="Insurance" value={t.insurance} />
      <Row label="Maintenance" value={t.maintenance} />
      <Row label="Registration" value={t.registration} />
      <Row label="Incentives" value={t.incentives} />
      <div className="rule mt-2 flex items-baseline justify-between border-t pt-2">
        <span className="text-sm font-medium text-ink">5-year total</span>
        <Figure value={t.total} className="font-mono text-lg tabular-nums font-semibold text-ink" />
      </div>
      <Cite provenance={side.provenance} />
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
    verdict && be ? live.map((n) => breakevenSentence(n, be[n], verdict.loserLabel)).filter(Boolean) : []

  return (
    <div className="editorial">
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-6 sm:py-16">
        <header className="mb-8">
          <h1 className="font-serif text-4xl leading-none text-ink sm:text-5xl">EV vs. gas</h1>
          <p className="mt-3 text-sm text-ink-muted">
            Total five-year cost of ownership for two vehicles you choose.{' '}
            <Link
              to="/methodology"
              className="text-teal underline decoration-dotted underline-offset-2 hover:text-teal-400"
            >
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
                className="text-xs font-medium text-teal hover:text-teal-400"
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
        <p className="mb-10 text-xs text-ink-muted">
          Pick any two vehicles. &ldquo;Suggest an equivalent&rdquo; picks an opposite-powertrain match by price —
          it&rsquo;s a suggestion, not a claim the two are equivalent.
        </p>

        {/* Verdict — dominant serif */}
        {verdict ? (
          <section>
            <h2 className="font-serif text-[2.25rem] leading-[1.08] text-ink sm:text-5xl">
              <span className="text-teal">{verdict.winnerLabel}</span>{' '}
              <span className="text-ink-muted">costs</span>{' '}
              <Figure value={verdict.amount} from0 className="tabular-nums text-ink" />{' '}
              <span className="text-ink-muted">less over {verdict.horizonYears} years.</span>
            </h2>
            {sentences.length > 0 ? (
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-muted">
                <span className="font-medium text-ink">Breakeven — </span>
                {sentences.join(' ')}
              </p>
            ) : (
              <p className="mt-5 text-sm text-ink-muted">No single assumption flips this in a realistic range.</p>
            )}
            {result.provenanceComparison?.note && (
              <p className="rule mt-5 max-w-2xl border-l-2 border-warning/60 pl-3 text-xs leading-relaxed text-warning">
                {result.provenanceComparison.note}
              </p>
            )}
          </section>
        ) : (
          <section className="rule border-y py-8 text-sm text-ink-muted">
            No verdict — one vehicle&rsquo;s figures are still pending (see below). The tool won&rsquo;t compare against
            a number it doesn&rsquo;t have.
          </section>
        )}

        {/* Two TCO breakdowns */}
        {result && (
          <>
            <hr className="rule my-10 border-t" />
            <section className="grid gap-10 sm:grid-cols-2">
              <TcoPanel side={result.a} />
              <TcoPanel side={result.b} />
            </section>
          </>
        )}

        {/* Sliders */}
        <section className="mt-12">
          <Eyebrow>Adjust the assumptions</Eyebrow>
          <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            <Rail
              label="Miles per year"
              live={live.includes('milesPerYear')}
              value={milesPerYear}
              min={0}
              max={30000}
              step={500}
              onChange={setMiles}
              format={(v) => `${v.toLocaleString()} mi`}
            />
            <Rail
              label="Gas price"
              live={live.includes('fuelPricePerGallon')}
              value={fuelPricePerGallon}
              min={2}
              max={7}
              step={0.1}
              onChange={setFuel}
              format={(v) => `$${v.toFixed(2)}/gal`}
            />
            <Rail
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
            <Rail
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
            <Rail
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
    </div>
  )
}
