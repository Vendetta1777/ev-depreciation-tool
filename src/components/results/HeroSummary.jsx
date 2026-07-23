import { motion } from 'framer-motion'
import { usd } from '../../utils/format'

/**
 * Section 1 — Hero verdict banner with the dollar advantage and vehicle specs.
 */
export default function HeroSummary({ vehicle, recommendation, tier }) {
  const leaseWins = recommendation.verdict === 'LEASE'
  const accent = leaseWins ? 'text-teal' : 'text-positive'
  const ring = leaseWins ? 'border-teal/40' : 'border-positive/40'

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`rounded-3xl border ${ring} bg-gradient-to-br from-navy-700 to-navy-800 p-8 sm:p-10`}
    >
      <p className="text-sm font-medium uppercase tracking-widest text-ink-muted">
        {vehicle.year} {vehicle.make} {vehicle.model} · {tier.label} ·{' '}
        {vehicle.milesPerYear.toLocaleString()} mi/yr
      </p>

      <motion.h1
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className={`mt-3 text-4xl font-extrabold tracking-tight sm:text-6xl ${accent}`}
      >
        {leaseWins ? 'LEASE' : 'BUY'} RECOMMENDED
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="tabular mt-4 text-2xl font-semibold text-ink sm:text-3xl"
      >
        {usd(recommendation.advantage)} advantage over 5 years
      </motion.p>

      <p className="mt-4 max-w-2xl text-ink-muted">{recommendation.reasoning}</p>
    </motion.div>
  )
}
