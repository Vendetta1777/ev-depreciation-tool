import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  motion,
  AnimatePresence,
  useSpring,
  useTransform,
  useAnimationControls,
  useReducedMotion,
} from 'framer-motion'
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
import { Cite, Eyebrow } from '../components/editorial.jsx'

// Motion is contained to /decide. Everything here honours prefers-reduced-motion
// and animates transform/opacity only.

const COUNT = { stiffness: 240, damping: 26 }
const CASCADE_ITEM = { type: 'spring', stiffness: 320, damping: 26 }

// ── A figure that springs from its current value to the new one ───────
function MoneyFig({ value, countUp = false, className }) {
  const reduce = useReducedMotion()
  const mv = useSpring(countUp && !reduce ? 0 : value, COUNT)
  const text = useTransform(mv, (v) => usd(Math.round(v)))
  useEffect(() => {
    mv.set(value)
  }, [value, mv])
  if (reduce) return <span className={className}>{usd(Math.round(value))}</span>
  return <motion.span className={className}>{text}</motion.span>
}

// ── Provenance annotation — fades in just after its figure ────────────
function Chip({ provenance, delay = 0 }) {
  const reduce = useReducedMotion()
  const pub = provenance.evidence === 'published'
  const inner = (
    <>
      <span className={`h-1.5 w-1.5 rounded-full ${pub ? 'bg-teal' : 'bg-warning'}`} aria-hidden />
      {pub ? 'Published' : 'Estimated'}
    </>
  )
  const cls = 'inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-muted'
  if (reduce) return <span className={cls}>{inner}</span>
  return (
    <motion.span className={cls} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay, duration: 0.3 }}>
      {inner}
    </motion.span>
  )
}

// ── Dense figure row (label left, mono spring-figure right) ───────────
function Row({ label, value, strong }) {
  return (
    <div className="rule flex items-baseline justify-between gap-4 border-b py-1.5 last:border-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <MoneyFig value={value} className={`font-mono text-sm tabular-nums ${strong ? 'font-semibold text-teal' : 'text-ink'}`} />
    </div>
  )
}

// ── Physical slider: pointer/keyboard, amber fill, spring thumb, tooltip
function PhysicalSlider({ label, help, live, value, min, max, step, onChange, format }) {
  const reduce = useReducedMotion()
  const trackRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const p = max > min ? Math.min(Math.max((value - min) / (max - min), 0), 1) : 0
  const fill = useSpring(p, { stiffness: 600, damping: 40 })
  useEffect(() => {
    fill.set(p)
  }, [p, fill])

  const setFromX = (clientX) => {
    const r = trackRef.current.getBoundingClientRect()
    const t = Math.min(Math.max((clientX - r.left) / r.width, 0), 1)
    const raw = min + t * (max - min)
    const snapped = Math.min(Math.max(Math.round(raw / step) * step, min), max)
    onChange(Number(snapped.toPrecision(12)))
  }
  const onDown = (e) => {
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    setFromX(e.clientX)
  }
  const onMove = (e) => {
    if (dragging) setFromX(e.clientX)
  }
  const onUp = (e) => {
    setDragging(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* noop */
    }
  }
  const onKey = (e) => {
    let d = 0
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') d = step
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') d = -step
    else if (e.key === 'Home') return onChange(min)
    else if (e.key === 'End') return onChange(max)
    else if (e.key === 'PageUp') d = step * 10
    else if (e.key === 'PageDown') d = -step * 10
    else return
    e.preventDefault()
    onChange(Number(Math.min(Math.max(value + d, min), max).toPrecision(12)))
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-ink">{label}</span>
        <span className="font-mono text-sm tabular-nums text-teal">{format(value)}</span>
      </div>
      {help && <p className="mt-1 text-xs leading-relaxed text-ink-muted">{help}</p>}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={format(value)}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onKeyDown={onKey}
        className="relative mt-3 h-8 cursor-pointer touch-none select-none outline-none focus-visible:ring-1 focus-visible:ring-teal/60"
      >
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[color:var(--color-border)]" />
        <motion.div
          className="absolute left-0 top-1/2 h-[3px] w-full origin-left -translate-y-1/2 rounded-full bg-teal"
          style={{ scaleX: reduce ? p : fill }}
        />
        <motion.div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
          style={{ left: `${p * 100}%` }}
          animate={reduce ? undefined : { scale: dragging ? 1.4 : 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        />
        <AnimatePresence>
          {dragging && !reduce && (
            <motion.div
              key="tt"
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.9 }}
              transition={{ duration: 0.14 }}
              style={{ left: `${p * 100}%` }}
              className="pointer-events-none absolute -top-6 -translate-x-1/2 whitespace-nowrap rounded-sm bg-surface-raised px-2 py-0.5 font-mono text-xs tabular-nums text-ink shadow"
            >
              {format(value)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <span className={`mt-1 block text-[11px] tracking-wide ${live ? 'text-teal' : 'text-ink-muted'}`}>
        {live ? 'can flip the verdict' : 'affects cost, not the verdict'}
      </span>
    </div>
  )
}

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

  // Remounting (and so replaying the entrance cascade) on vehicle/year change.
  const vehKey = `${vehicle.make}|${vehicle.model}|${year}`

  return (
    <div className="editorial">
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-6 sm:py-16">
        <header className="mb-9">
          <h1 className="font-serif text-4xl leading-none text-ink sm:text-5xl">Buy or lease?</h1>
          <p className="mt-3 text-sm text-ink-muted">
            Five-year cost, from published depreciation data — every figure cited.{' '}
            <Link to="/methodology" className="text-teal underline decoration-dotted underline-offset-2 hover:text-teal-400">
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
            animated
          />
        </div>

        {result ? (
          <VerdictBlock key={vehKey} result={result} isEv={isEv} residualSpread={residualSpread} />
        ) : (
          <UnavailableBlock resolved={resolved} error={error} />
        )}

        {/* Sliders */}
        <section className="mt-12">
          <Eyebrow>Adjust the assumptions</Eyebrow>
          <div className="mb-8 rounded-sm border border-teal/30 bg-teal/[0.05] p-4 sm:p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal">The lever that decides it</p>
            <PhysicalSlider
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
            <PhysicalSlider label="Miles per year" live={!!result?.verdict.liveVariables.includes('milesPerYear')} value={milesPerYear} min={0} max={30000} step={500} onChange={setMiles} format={(v) => `${v.toLocaleString()} mi`} />
            <PhysicalSlider label="Discount rate" live={!!result?.verdict.liveVariables.includes('discountRate')} value={discountRate} min={0} max={0.15} step={0.005} onChange={setRate} format={(v) => pct(v, 1)} />
            <PhysicalSlider label={isEv ? 'Electricity ($/kWh)' : 'Fuel ($/gal)'} live={!!result?.verdict.liveVariables.includes('fuelPricePerGallon')} value={isEv ? electricityPricePerKwh : fuelPricePerGallon} min={isEv ? 0.05 : 2} max={isEv ? 0.4 : 7} step={isEv ? 0.01 : 0.1} onChange={isEv ? setElec : setFuel} format={(v) => `$${v.toFixed(2)}`} />
            <PhysicalSlider label="Upfront incentive" live={!!result?.verdict.liveVariables.includes('incentive')} value={incentive} min={0} max={15000} step={250} onChange={setIncentive} format={(v) => usd(v)} />
          </div>
        </section>
      </div>
    </div>
  )
}

function VerdictBlock({ result, isEv, residualSpread }) {
  const reduce = useReducedMotion()
  const { verdict, npv, tco, breakeven, band } = result
  const sentences = verdict.liveVariables.map((n) => breakevenSentence(n, breakeven, verdict)).filter(Boolean)
  const sig = band.years.map((y) => y.value).join(',')
  const chartData = useMemo(() => chartDataOf(result), [sig]) // eslint-disable-line react-hooks/exhaustive-deps

  // Pulse the verdict + flash the breakeven line when the winner flips.
  const prevWinner = useRef(verdict.winner)
  const [flip, setFlip] = useState(0)
  const pulse = useAnimationControls()
  useEffect(() => {
    if (prevWinner.current !== verdict.winner) {
      prevWinner.current = verdict.winner
      setFlip((f) => f + 1)
      if (!reduce) pulse.start({ scale: [1, 1.035, 1], transition: { duration: 0.32, times: [0, 0.35, 1] } })
    }
  }, [verdict.winner]) // eslint-disable-line react-hooks/exhaustive-deps

  const cascade = reduce
    ? {}
    : { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } } }
  const rise = reduce ? {} : { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: CASCADE_ITEM } }

  return (
    <motion.div variants={cascade} initial="hidden" animate="show">
      {/* Verdict */}
      <motion.section variants={rise}>
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1">
          <Chip provenance={verdict.provenance} delay={0.15} />
          {verdict.provenance.matchLevel === 'segment' && (
            <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Segment average</span>
          )}
        </div>
        <motion.h2 animate={pulse} style={{ transformOrigin: 'left' }} className="font-serif text-[2.5rem] leading-[1.06] text-ink sm:text-6xl">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={verdict.winner}
              initial={reduce ? undefined : { opacity: 0, y: 12, scale: 0.94 }}
              animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              className="inline-block text-teal"
            >
              {verdict.winnerLabel}
            </motion.span>
          </AnimatePresence>{' '}
          <span className="text-ink-muted">You save</span>{' '}
          <MoneyFig value={verdict.amount} countUp className="tabular-nums text-ink" />{' '}
          <span className="text-ink-muted">over {verdict.horizonYears} years.</span>
        </motion.h2>

        {residualSpread === 0 ? (
          <p className="mt-5 max-w-2xl border-l-2 border-teal/60 pl-3 text-sm leading-relaxed text-ink-muted">
            <span className="text-ink">This is the fair-lease default.</span> With no residual spread, buying and
            leasing are equal by construction — so this gap is essentially the lease fees ({usd(npv.leaseFeesPV)}), an
            assumption baked in, not a finding about the car.{' '}
            <span className="text-ink">The residual-spread slider below is what actually decides it.</span>
          </p>
        ) : (
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Reflects your assumed residual spread of{' '}
            <span className="text-ink">+{(residualSpread * 100).toFixed(0)}% of MSRP</span> — your input, not sourced
            data.
          </p>
        )}
      </motion.section>

      {/* Breakeven — briefly re-asserts on each flip */}
      <motion.section variants={rise}>
        <motion.p
          key={`be-${flip}`}
          initial={reduce ? undefined : { opacity: 0.35 }}
          animate={reduce ? undefined : { opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-muted"
        >
          {sentences.length > 0 ? (
            <>
              <span className="font-medium text-ink">Breakeven — </span>
              {sentences.join(' ')}
            </>
          ) : (
            'No single assumption flips this verdict in a realistic range.'
          )}
        </motion.p>
        <Cite provenance={verdict.provenance} />
      </motion.section>

      <hr className="rule my-10 border-t" />

      {/* Chart + present value */}
      <motion.div variants={rise} className="grid gap-10 lg:grid-cols-5">
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
                  cursor={{ stroke: '#c8873e', strokeWidth: 1, strokeDasharray: '3 3' }}
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
                  activeDot={{ r: 5, fill: '#d3a05a', stroke: '#14110c', strokeWidth: 2 }}
                  isAnimationActive={!reduce}
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
      </motion.div>

      <hr className="rule my-10 border-t" />

      {/* TCO */}
      <motion.section variants={rise}>
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
          <MoneyFig value={tco.total} className="font-mono text-xl tabular-nums font-semibold text-ink" />
        </div>
        <Cite provenance={tco.provenance} />
      </motion.section>
    </motion.div>
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
