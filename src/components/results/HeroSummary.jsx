import { motion } from 'framer-motion'
import { usd } from '../../utils/format'

/**
 * Section 1 — verdict banner with a gently pulsing gradient, the dollar
 * advantage, and the vehicle specs.
 */
export default function HeroSummary({ vehicle, recommendation, tier }) {
  const leaseWins = recommendation.verdict === 'LEASE'
  const accent = leaseWins ? 'text-teal' : 'text-positive'
  const ring = leaseWins ? 'border-teal/40' : 'border-positive/40'
  // Teal-tinted gradient for lease, green-tinted for buy; animated via CSS.
  const gradient = leaseWins
    ? 'linear-gradient(120deg, #11223a, #16304d, #0e3a49, #16304d, #11223a)'
    : 'linear-gradient(120deg, #11223a, #16304d, #12402f, #16304d, #11223a)'

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`verdict-pulse rounded-3xl border ${ring} p-6 sm:p-10`}
      style={{ backgroundImage: gradient }}
    >
      <p className="text-xs font-medium uppercase tracking-widest text-ink-muted sm:text-sm">
        {vehicle.year} {vehicle.make} {vehicle.model} · {tier.label} ·{' '}
        {vehicle.milesPerYear.toLocaleString()} mi/yr
      </p>

      <motion.h1
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className={`mt-3 text-4xl font-extrabold tracking-tight sm:text-6xl ${accent}`}
      >
        {leaseWins ? 'LEASE' : 'BUY'} IT
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="tabular mt-4 text-2xl font-semibold text-ink sm:text-3xl"
      >
        {usd(recommendation.advantage)} better over 5 years
      </motion.p>

      <p className="mt-4 max-w-2xl text-ink-muted">{recommendation.reasoning}</p>
    </motion.div>
  )
}
