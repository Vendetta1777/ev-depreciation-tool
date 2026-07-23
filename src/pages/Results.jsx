import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import useProjection from '../hooks/useProjection'
import { usd } from '../utils/format'

/**
 * Results dashboard.
 * Phase 2: reads the vehicle passed via router state and renders the
 * recommendation + headline NPV figures. Charts + full breakdown land in a
 * later phase.
 */
export default function Results() {
  const { state } = useLocation()
  const vehicle = state?.vehicle
  const projection = useProjection(vehicle)

  if (!vehicle || !projection) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-3xl font-bold text-ink">No projection yet</h1>
        <p className="mt-3 text-ink-muted">
          Enter your vehicle details to see depreciation and buy-vs-lease
          results.
        </p>
        <Link
          to="/estimate"
          className="mt-8 inline-block rounded-lg bg-teal px-6 py-3 font-semibold text-navy transition hover:bg-teal-400"
        >
          Start a projection
        </Link>
      </section>
    )
  }

  const { breakdown, recommendation, tier } = projection
  const leaseWins = recommendation.verdict === 'LEASE'

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm uppercase tracking-widest text-teal">Projection</p>
        <h1 className="mt-1 text-3xl font-bold text-ink sm:text-4xl">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h1>
        <p className="mt-2 text-ink-muted">
          {tier.label} · {(tier.retention5 * 100).toFixed(1)}% projected 5-year
          retention · {vehicle.milesPerYear.toLocaleString()} mi/yr
        </p>
      </motion.div>

      {/* Recommendation callout */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 rounded-2xl border border-teal/40 bg-gradient-to-br from-navy-700 to-navy-800 p-8"
      >
        <p className="text-sm font-medium uppercase tracking-widest text-ink-muted">
          Recommendation
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-5xl font-bold text-teal">{recommendation.verdict}</span>
          <span className="tabular text-2xl font-semibold text-ink">
            {usd(recommendation.advantage)} advantage
          </span>
        </div>
        <p className="mt-4 max-w-2xl text-ink-muted">{recommendation.reasoning}</p>
      </motion.div>

      {/* Headline numbers */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <StatCard
          title="Buy — 5-yr cost (NPV)"
          value={usd(breakdown.buyNPV)}
          highlight={!leaseWins}
          sub={`Resale recovered: ${usd(breakdown.resaleValue)}`}
        />
        <StatCard
          title="Lease — 5-yr cost (NPV)"
          value={usd(breakdown.leaseNPV)}
          highlight={leaseWins}
          sub={`${usd(breakdown.monthlyPayment)}/mo payment`}
        />
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface-raised p-6 text-sm text-ink-muted">
        Depreciation curve, driver breakdown, and full financial detail —
        coming in the next phase.
      </div>
    </section>
  )
}

function StatCard({ title, value, sub, highlight }) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        highlight ? 'border-teal/50 bg-navy-700' : 'border-border bg-surface-raised'
      }`}
    >
      <p className="text-sm text-ink-muted">{title}</p>
      <p className="tabular mt-2 text-3xl font-bold text-ink">{value}</p>
      <p className="mt-2 text-sm text-ink-muted">{sub}</p>
    </div>
  )
}
