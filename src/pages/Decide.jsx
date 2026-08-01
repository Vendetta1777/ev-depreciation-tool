import { useEffect, useMemo, useRef, useState } from 'react'
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
import VehicleSelect from '../components/VehicleSelect.jsx'

// ── A figure that counts up on mount and tweens on change ─────────────
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
function Figure({ value, from0 = false, className }) {
  const [display, setDisplay] = useState(from0 ? 0 : value)
  const cur = useRef(from0 ? 0 : value)
  useEffect(() => {
    const start = cur.current
    const end = value
    if (start === end) return
    let raf
    let t0 = null
    const dur = 550
    const step = (ts) => {
      if (t0 === null) t0 = ts
      const p = Math.min((ts - t0) / dur, 1)
      const v = start + (end - start) * easeOutCubic(p)
      cur.current = v
      setDisplay(v)
      if (p < 1) raf = requestAnimationFrame(step)
      else cur.current = end
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span className={className}>{usd(Math.round(display))}</span>
}

// ── Provenance as a quiet annotation, not a badge ─────────────────────
function Chip({ provenance }) {
  const pub = provenance.evidence === 'published'
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-muted">
      <span className={`h-1.5 w-1.5 rounded-full ${pub ? 'bg-teal' : 'bg-warning'}`} aria-hidden />
      {pub ? 'Published' : 'Estimated'}
    </span>
  )
}

function Cite({ provenance }) {
  return (
    <p className="rule mt-5 border-t pt-3 text-xs leading-relaxed text-ink-muted">
      Source:{' '}
      {provenance.sourceUrl ? (
        <a
          href={provenance.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-teal underline decoration-dotted underline-offset-2 hover:text-teal-400"
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

// ── Dense, aligned figure row (label left, mono number right) ─────────
function Row({ label, value, strong }) {
  return (
    <div className="rule flex items-baseline justify-between gap-4 border-b py-1.5 last:border-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <Figure
        value={value}
        className={`font-mono text-sm tabular-nums ${strong ? 'font-semibold text-teal' : 'text-ink'}`}
      />
    </div>
  )
}

function Rail({ label, help, live, value, min, max, step, onChange, format }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-ink">{label}</span>
        <span className="font-mono text-sm tabular-nums text-teal">{format(value)}</span>
      </div>
      {help && <p className="mt-1 text-xs leading-relaxed text-ink-muted">{help}</p>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-teal"
      />
      <span className={`mt-1 block text-[11px] tracking-wide ${live ? 'text-teal' : 'text-ink-muted'}`}>
        {live ? 'can flip the verdict' : 'affects cost, not the verdict'}
      </span>
    </label>
  )
}

const Eyebrow = ({ children }) => (
  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{children}</p>
)

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
  const [vehicle, setVehicle] = useState(CURVE_VEHICLES[DEFAULT_VEHICLE_INDEX])
  const [year, setYear] = useState(DEFAULT_YEAR)
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

  const isEv = vehicle.powertrain === 'EV'

  const selectVehicle = (v) => {
    setVehicle(v)
    if (typeof v.msrp === 'number') setMsrp(v.msrp)
  }

  const { result, resolved, error } = useMemo(() => {
    if (!doc) return { result: null, resolved: null, error: null }
    const resolvedCurve = resolveCurve({ ...vehicle, year }, doc)
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
  }, [doc, vehicle, year, msrp, milesPerYear, discountRate, incentive, residualSpread, fuelPricePerGallon, electricityPricePerKwh]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="decide">
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-6 sm:py-16">
        <header className="mb-9">
          <h1 className="font-serif text-4xl leading-none text-ink sm:text-5xl">Buy or lease?</h1>
          <p className="mt-3 text-sm text-ink-muted">
            Five-year cost, from published depreciation data — every figure cited.{' '}
            <Link
              to="/methodology"
              className="text-teal underline decoration-dotted underline-offset-2 hover:text-teal-400"
            >
              How this is computed →
            </Link>
          </p>
        </header>

        <div className="mb-10">
          <VehicleSelect
            vehicle={vehicle}
            year={year}
            msrp={msrp}
            onVehicle={selectVehicle}
            onYear={setYear}
            onMsrp={setMsrp}
            chips={CURVE_VEHICLES}
          />
        </div>

        {result ? (
          <VerdictBlock result={result} isEv={isEv} residualSpread={residualSpread} />
        ) : (
          <UnavailableBlock resolved={resolved} error={error} />
        )}

        {/* Sliders */}
        <section className="mt-12">
          <Eyebrow>Adjust the assumptions</Eyebrow>
          <div className="mb-8 rounded-sm border border-teal/30 bg-teal/[0.05] p-4 sm:p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal">
              The lever that decides it
            </p>
            <Rail
              label="Lender's residual optimism"
              help="How optimistic is the lender's assumed resale value vs. the market forecast? A subvented residual is the main reason a lease wins — this is your assumption, not sourced data."
              live={!!result?.verdict.liveVariables.includes('residualSpread')}
              value={residualSpread}
              min={0}
              max={0.15}
              step={0.01}
              onChange={setSpread}
              format={(v) => `+${(v * 100).toFixed(0)}% of MSRP`}
            />
          </div>
          <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            <Rail
              label="Miles per year"
              live={!!result?.verdict.liveVariables.includes('milesPerYear')}
              value={milesPerYear}
              min={0}
              max={30000}
              step={500}
              onChange={setMiles}
              format={(v) => `${v.toLocaleString()} mi`}
            />
            <Rail
              label="Discount rate"
              live={!!result?.verdict.liveVariables.includes('discountRate')}
              value={discountRate}
              min={0}
              max={0.15}
              step={0.005}
              onChange={setRate}
              format={(v) => pct(v, 1)}
            />
            <Rail
              label={isEv ? 'Electricity ($/kWh)' : 'Fuel ($/gal)'}
              live={!!result?.verdict.liveVariables.includes('fuelPricePerGallon')}
              value={isEv ? electricityPricePerKwh : fuelPricePerGallon}
              min={isEv ? 0.05 : 2}
              max={isEv ? 0.4 : 7}
              step={isEv ? 0.01 : 0.1}
              onChange={isEv ? setElec : setFuel}
              format={(v) => `$${v.toFixed(2)}`}
            />
            <Rail
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
    </div>
  )
}

function VerdictBlock({ result, isEv, residualSpread }) {
  const { verdict, npv, tco, breakeven, band } = result
  const sentences = verdict.liveVariables.map((n) => breakevenSentence(n, breakeven, verdict)).filter(Boolean)
  const sig = band.years.map((y) => y.value).join(',')
  const chartData = useMemo(() => chartDataOf(result), [sig]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Verdict — dominant, full width, no card */}
      <section>
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1">
          <Chip provenance={verdict.provenance} />
          {verdict.provenance.matchLevel === 'segment' && (
            <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Segment average</span>
          )}
        </div>
        <h2 className="font-serif text-[2.5rem] leading-[1.06] text-ink sm:text-6xl">
          <span className="text-teal">{verdict.winnerLabel}</span>{' '}
          <span className="text-ink-muted">You save</span>{' '}
          <Figure value={verdict.amount} from0 className="tabular-nums text-ink" />{' '}
          <span className="text-ink-muted">over {verdict.horizonYears} years.</span>
        </h2>

        {/* The verdict is only as real as its assumptions — say so plainly. */}
        {residualSpread === 0 ? (
          <p className="mt-5 max-w-2xl border-l-2 border-teal/60 pl-3 text-sm leading-relaxed text-ink-muted">
            <span className="text-ink">This is the fair-lease default.</span> With no residual spread, buying and
            leasing are equal by construction — so this gap is essentially the lease fees ({usd(npv.leaseFeesPV)}),
            an assumption baked in, not a finding about the car. <span className="text-ink">The residual-spread
            slider below is what actually decides it.</span>
          </p>
        ) : (
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Reflects your assumed residual spread of{' '}
            <span className="text-ink">+{(residualSpread * 100).toFixed(0)}% of MSRP</span> — your input, not
            sourced data.
          </p>
        )}

        {sentences.length > 0 ? (
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-muted">
            <span className="font-medium text-ink">Breakeven — </span>
            {sentences.join(' ')}
          </p>
        ) : (
          <p className="mt-6 text-sm text-ink-muted">No single assumption flips this verdict in a realistic range.</p>
        )}
        <Cite provenance={verdict.provenance} />
      </section>

      <hr className="rule my-10 border-t" />

      {/* Supporting: chart + present-value table, denser */}
      <div className="grid gap-10 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Projected resale value</Eyebrow>
            {band.flat && <span className="text-[11px] text-ink-muted">spread unavailable — line only</span>}
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer>
              <ComposedChart data={chartData} margin={{ top: 6, right: 6, left: 6, bottom: 0 }}>
                <CartesianGrid stroke="#2c2619" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="year" stroke="#5f584a" fontSize={11} tickFormatter={(y) => `Y${y}`} />
                <YAxis stroke="#5f584a" fontSize={11} width={48} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                <Tooltip
                  contentStyle={{ background: '#1b1710', border: '1px solid #2c2619', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#9a9081' }}
                  itemStyle={{ color: '#ece6da' }}
                  formatter={(val, name) => [usd(val), name === 'mid' ? 'Value' : name]}
                  labelFormatter={(y) => `Year ${y}`}
                />
                <Area dataKey="low" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} />
                <Area dataKey="band" stackId="band" stroke="none" fill="#c8873e" fillOpacity={0.13} isAnimationActive={false} />
                <Line
                  dataKey="mid"
                  stroke="#d3a05a"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="lg:col-span-2">
          <Eyebrow>Five-year present value</Eyebrow>
          <Row label="Buy" value={npv.buyNPV} strong={verdict.winner === 'a'} />
          <Row label="Lease" value={npv.leaseNPV} strong={verdict.winner === 'b'} />
          <Row label="Resale at year 5" value={npv.resaleValue} />
          <Row label="Monthly lease" value={npv.monthlyLease} />
        </section>
      </div>

      <hr className="rule my-10 border-t" />

      {/* TCO */}
      <section>
        <Eyebrow>Total cost of ownership · 5 years</Eyebrow>
        <div className="grid gap-x-10 sm:grid-cols-2">
          <div>
            <Row label="Depreciation" value={tco.depreciation} />
            <Row label={isEv ? 'Charging' : 'Fuel'} value={tco.energy} />
            <Row label="Insurance" value={tco.insurance} />
          </div>
          <div>
            <Row label="Maintenance" value={tco.maintenance} />
            <Row label="Registration" value={tco.registration} />
            <Row label="Incentives" value={tco.incentives} />
          </div>
        </div>
        <div className="rule mt-3 flex items-baseline justify-between border-t pt-3">
          <span className="text-sm font-medium text-ink">Total</span>
          <Figure value={tco.total} className="font-mono text-xl tabular-nums font-semibold text-ink" />
        </div>
        <Cite provenance={tco.provenance} />
      </section>
    </>
  )
}

function UnavailableBlock({ resolved, error }) {
  const pending = resolved && resolved.matchLevel !== 'refuse'
  return (
    <section className="rule border-y py-10">
      <h2 className="font-serif text-3xl text-ink">{pending ? 'Figures pending' : 'Not covered'}</h2>
      <p className="mt-3 text-sm text-ink">{resolved?.note ?? error}</p>
      <p className="mt-2 text-xs text-ink-muted">
        {pending
          ? "This segment exists but its retention figures aren't published yet, so the tool won't guess."
          : 'This vehicle falls outside what published data covers.'}
      </p>
    </section>
  )
}

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
