import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { loadCurves, resolveCurve } from '../lib/curves.js'
import { compute } from '../lib/finance.ts'
import { CURVE_VEHICLES, DEFAULT_VEHICLE_INDEX, DEFAULT_YEAR } from '../data/curveVehicles.js'
import { usd, pct } from '../utils/format.js'

// ── Provenance chip: derived and published must NOT look the same ─────
function ProvenanceChip({ provenance }) {
  const published = provenance.evidence === 'published'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        published ? 'bg-teal/15 text-teal-400' : 'bg-warning/15 text-warning'
      }`}
      title={
        published
          ? 'Published segment figure'
          : 'Derived / inferred figure — not a published segment average'
      }
    >
      <span aria-hidden>{published ? '✓' : '≈'}</span>
      {published ? 'Published data' : 'Estimated (derived)'}
    </span>
  )
}

// ── Citation shown under every figure block ───────────────────────────
function Citation({ provenance }) {
  return (
    <p className="mt-3 text-xs leading-relaxed text-ink-muted">
      Source:{' '}
      {provenance.sourceUrl ? (
        <a
          href={provenance.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-teal-400 underline decoration-dotted underline-offset-2 hover:text-teal"
        >
          {provenance.source}
        </a>
      ) : (
        provenance.source
      )}
      {provenance.sourceYear ? ` (${provenance.sourceYear}).` : '.'}{' '}
      {provenance.note && <span className="text-warning">{provenance.note} </span>}
      {provenance.sourceNote}
    </p>
  )
}

function Slider({ label, help, live, value, min, max, step, onChange, format }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="tabular text-sm font-semibold text-teal-400">{format(value)}</span>
      </div>
      {help && <p className="mb-1.5 text-xs text-ink-muted">{help}</p>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-teal"
      />
      <span
        className={`mt-1 inline-block text-[11px] font-medium ${
          live ? 'text-positive' : 'text-ink-muted'
        }`}
      >
        {live ? 'can flip the verdict' : 'affects cost, not the verdict'}
      </span>
    </label>
  )
}

function StatRow({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2 last:border-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className={`tabular text-sm ${strong ? 'font-bold text-ink' : 'text-ink'}`}>{value}</span>
    </div>
  )
}

// ── One readable breakeven sentence per live variable ─────────────────
function breakevenSentence(name, be, verdict) {
  const v = be[name]
  if (v.flipsAt === null) return null
  const loser = verdict.loserLabel
  switch (name) {
    case 'milesPerYear':
      return `Switches to ${loser} above ${Math.round(v.flipsAt).toLocaleString()} mi/yr.`
    case 'discountRate':
      return `Switches to ${loser} above a ${pct(v.flipsAt, 1)} discount rate.`
    case 'incentive':
      return `Switches to ${loser} with an incentive above ${usd(v.flipsAt)}.`
    case 'residualSpread':
      return `Switches to ${loser} once the lender's residual runs ${(v.flipsAt * 100).toFixed(1)}% of MSRP above market.`
    default:
      return null
  }
}

export default function Decide() {
  const [doc, setDoc] = useState(null)
  const [idx, setIdx] = useState(DEFAULT_VEHICLE_INDEX)
  const [msrp, setMsrp] = useState(CURVE_VEHICLES[DEFAULT_VEHICLE_INDEX].msrp)
  const [milesPerYear, setMiles] = useState(12000)
  const [discountRate, setRate] = useState(0.05)
  const [incentive, setIncentive] = useState(0)
  const [fuelPricePerGallon, setFuel] = useState(3.5)
  const [electricityPricePerKwh, setElec] = useState(0.17)
  const [residualSpread, setSpread] = useState(0)

  useEffect(() => {
    loadCurves().then(setDoc)
  }, [])

  const vehicle = CURVE_VEHICLES[idx]
  const isEv = vehicle.powertrain === 'EV'

  // Switching vehicles refills MSRP with that model's representative price.
  function pickVehicle(nextIdx) {
    setIdx(nextIdx)
    setMsrp(CURVE_VEHICLES[nextIdx].msrp)
  }

  const { result, resolved, error } = useMemo(() => {
    if (!doc) return { result: null, resolved: null, error: null }
    const resolvedCurve = resolveCurve({ ...vehicle, year: DEFAULT_YEAR }, doc)
    const input = {
      msrp,
      milesPerYear,
      discountRate,
      incentive,
      residualSpread,
      powertrain: vehicle.powertrain,
      ...(isEv ? { electricityPricePerKwh } : { fuelPricePerGallon }),
    }
    try {
      return { result: compute(input, resolvedCurve), resolved: resolvedCurve, error: null }
    } catch (e) {
      return { result: null, resolved: resolvedCurve, error: e.message }
    }
  }, [doc, idx, msrp, milesPerYear, discountRate, incentive, residualSpread, fuelPricePerGallon, electricityPricePerKwh]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Buy or lease?</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Five-year cost, from published depreciation data. Every figure is cited.{' '}
          <Link to="/methodology" className="text-teal-400 underline decoration-dotted underline-offset-2 hover:text-teal">
            How this is computed →
          </Link>
        </p>
      </header>

      {/* Vehicle + price */}
      <section className="mb-6 grid gap-4 rounded-2xl border border-border bg-surface-raised/60 p-4 sm:grid-cols-2 sm:p-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Vehicle</span>
          <select
            value={idx}
            onChange={(e) => pickVehicle(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-navy px-3 py-2.5 text-ink"
          >
            {CURVE_VEHICLES.map((v, i) => (
              <option key={`${v.make}-${v.model}`} value={i}>
                {DEFAULT_YEAR} {v.make} {v.model} · {v.powertrain}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">MSRP</span>
          <input
            type="number"
            value={msrp}
            min={10000}
            max={250000}
            step={500}
            onChange={(e) => setMsrp(Number(e.target.value))}
            className="tabular w-full rounded-lg border border-border bg-navy px-3 py-2.5 text-ink"
          />
        </label>
      </section>

      {/* Verdict — shape comes entirely from result.verdict */}
      {result ? (
        <VerdictBlock result={result} isEv={isEv} />
      ) : (
        <UnavailableBlock resolved={resolved} error={error} />
      )}

      {/* Sliders */}
      <section className="mt-6 rounded-2xl border border-border bg-surface-raised/60 p-4 sm:p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Adjust the assumptions
        </h2>
        {/* The key lever: with a fair lease, buy and lease are equal by
            construction — this spread is what actually makes a lease win. */}
        <div className="mb-5 rounded-xl border border-teal/25 bg-teal/5 p-4">
          <Slider
            label="Lender's residual optimism"
            help="How optimistic is the lender's assumed resale value vs. the market forecast? (a subvented residual is the main reason a lease wins — this is your assumption, not sourced data)"
            live={!!result?.verdict.liveVariables.includes('residualSpread')}
            value={residualSpread}
            min={0}
            max={0.15}
            step={0.01}
            onChange={setSpread}
            format={(v) => `+${(v * 100).toFixed(0)}% of MSRP`}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Slider
            label="Miles per year"
            live={!!result?.verdict.liveVariables.includes('milesPerYear')}
            value={milesPerYear}
            min={0}
            max={30000}
            step={500}
            onChange={setMiles}
            format={(v) => `${v.toLocaleString()} mi`}
          />
          <Slider
            label="Discount rate"
            live={!!result?.verdict.liveVariables.includes('discountRate')}
            value={discountRate}
            min={0}
            max={0.15}
            step={0.005}
            onChange={setRate}
            format={(v) => pct(v, 1)}
          />
          <Slider
            label={isEv ? 'Electricity ($/kWh)' : 'Fuel ($/gal)'}
            live={!!result?.verdict.liveVariables.includes('fuelPricePerGallon')}
            value={isEv ? electricityPricePerKwh : fuelPricePerGallon}
            min={isEv ? 0.05 : 2}
            max={isEv ? 0.4 : 7}
            step={isEv ? 0.01 : 0.1}
            onChange={isEv ? setElec : setFuel}
            format={(v) => `$${v.toFixed(2)}`}
          />
          <Slider
            label="Upfront incentive"
            live={!!result?.verdict.liveVariables.includes('incentive')}
            value={incentive}
            min={0}
            max={15000}
            step={250}
            onChange={setIncentive}
            format={(v) => usd(v)}
          />
        </div>
      </section>
    </div>
  )
}

function VerdictBlock({ result, isEv }) {
  const { verdict, npv, tco, breakeven, band } = result
  const winnerTeal = verdict.winnerLabel.startsWith('Lease')
  const sentences = verdict.liveVariables
    .map((n) => breakevenSentence(n, breakeven, verdict))
    .filter(Boolean)

  return (
    <>
      {/* Headline */}
      <section className="rounded-2xl border border-border bg-surface-raised p-5 sm:p-7">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <ProvenanceChip provenance={verdict.provenance} />
          {verdict.provenance.matchLevel === 'segment' && (
            <span className="rounded-full bg-navy px-2.5 py-1 text-xs text-ink-muted">
              segment average
            </span>
          )}
        </div>
        <p className="text-2xl font-extrabold leading-tight text-ink sm:text-4xl">
          <span className={winnerTeal ? 'text-teal' : 'text-positive'}>{verdict.winnerLabel}</span>{' '}
          You save{' '}
          <span className="tabular">{usd(verdict.amount)}</span> over {verdict.horizonYears} years.
        </p>
        {/* Breakeven line directly under the verdict */}
        {sentences.length > 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            <span className="font-semibold text-ink">Breakeven: </span>
            {sentences[0]}
            {sentences.length > 1 && (
              <span className="ml-1">
                {sentences.slice(1).map((s) => (
                  <span key={s} className="ml-1">
                    {s}
                  </span>
                ))}
              </span>
            )}
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">
            No single assumption flips this verdict in a realistic range.
          </p>
        )}
        <Citation provenance={verdict.provenance} />
      </section>

      {/* Fan chart + NPV */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-border bg-surface-raised/60 p-4 sm:p-5 lg:col-span-3">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Projected resale value</h2>
            {band.flat && <span className="text-xs text-ink-muted">source spread unavailable — shown as a line</span>}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <ComposedChart data={chartDataOf(result)} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid stroke="#1d3c5f" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" stroke="#8ba0b8" fontSize={12} tickFormatter={(y) => `Y${y}`} />
                <YAxis
                  stroke="#8ba0b8"
                  fontSize={12}
                  width={54}
                  tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{ background: '#0d1b2a', border: '1px solid #1d3c5f', borderRadius: 12 }}
                  labelStyle={{ color: '#8ba0b8' }}
                  formatter={(val, name) => [usd(val), name === 'mid' ? 'Value' : name]}
                  labelFormatter={(y) => `Year ${y}`}
                />
                <Area dataKey="low" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} />
                <Area
                  dataKey="band"
                  stackId="band"
                  stroke="none"
                  fill="#00b4d8"
                  fillOpacity={0.18}
                  isAnimationActive={false}
                />
                <Line
                  dataKey="mid"
                  stroke="#38cdf0"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface-raised/60 p-4 sm:p-5 lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold text-ink">5-year present value</h2>
          <StatRow label="Buy" value={usd(npv.buyNPV)} strong={verdict.winner === 'a'} />
          <StatRow label="Lease" value={usd(npv.leaseNPV)} strong={verdict.winner === 'b'} />
          <StatRow label="Resale at year 5" value={usd(npv.resaleValue)} />
          <StatRow label="Monthly lease" value={usd(npv.monthlyLease)} />
        </section>
      </div>

      {/* TCO */}
      <section className="mt-6 rounded-2xl border border-border bg-surface-raised/60 p-4 sm:p-5">
        <h2 className="mb-2 text-sm font-semibold text-ink">Total cost of ownership (5 years)</h2>
        <div className="grid gap-x-8 sm:grid-cols-2">
          <div>
            <StatRow label="Depreciation" value={usd(tco.depreciation)} />
            <StatRow label={isEv ? 'Charging' : 'Fuel'} value={usd(tco.energy)} />
            <StatRow label="Insurance" value={usd(tco.insurance)} />
          </div>
          <div>
            <StatRow label="Maintenance" value={usd(tco.maintenance)} />
            <StatRow label="Registration" value={usd(tco.registration)} />
            <StatRow label="Incentives" value={usd(tco.incentives)} />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-semibold text-ink">Total</span>
          <span className="tabular text-lg font-bold text-ink">{usd(tco.total)}</span>
        </div>
        <Citation provenance={tco.provenance} />
      </section>
    </>
  )
}

function UnavailableBlock({ resolved, error }) {
  const pending = resolved && resolved.matchLevel !== 'refuse'
  return (
    <section className="rounded-2xl border border-warning/40 bg-warning/5 p-5 sm:p-7">
      <h2 className="text-xl font-bold text-warning">
        {pending ? 'Figures pending' : 'Not covered'}
      </h2>
      <p className="mt-2 text-sm text-ink">{resolved?.note ?? error}</p>
      <p className="mt-3 text-xs text-ink-muted">
        {pending
          ? "This segment exists but its retention figures aren't published yet, so the tool won't guess."
          : 'This vehicle falls outside what published data covers.'}
      </p>
    </section>
  )
}

// Rebuild chart data inside VerdictBlock scope.
function chartDataOf(result) {
  const msrp0 = result.band.years.length ? result.band.years[0].value / result.band.years[0].mid : 0
  return [
    { year: 0, low: msrp0, band: 0, mid: msrp0 },
    ...result.band.years.map((y) => ({
      year: y.year,
      low: y.valueLow,
      band: y.valueHigh - y.valueLow,
      mid: y.value,
    })),
  ]
}
