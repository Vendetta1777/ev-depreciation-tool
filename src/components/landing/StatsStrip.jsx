import { motion } from 'framer-motion'
import CountUp from '../CountUp'
import { RESEARCH, EV_ANNUAL_DEPRECIATION_PREMIUM } from '../../data/constants'

const STATS = [
  { value: RESEARCH.datasetSize, label: 'Vehicles Analyzed' },
  { value: RESEARCH.rSquared, decimals: 3, prefix: 'R² = ', label: 'Model Accuracy' },
  { value: EV_ANNUAL_DEPRECIATION_PREMIUM * 100, decimals: 1, suffix: '%', label: 'Faster EV Depreciation' },
  { value: RESEARCH.papersReviewed, label: 'Research Papers' },
]

/**
 * Stats strip — four research figures with count-up on scroll.
 */
export default function StatsStrip() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {STATS.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          className="rounded-2xl border border-border bg-surface-raised/70 p-6 text-center"
        >
          <CountUp
            value={s.value}
            decimals={s.decimals}
            prefix={s.prefix}
            suffix={s.suffix}
            className="block text-3xl font-bold text-teal sm:text-4xl"
          />
          <p className="mt-2 text-sm text-ink-muted">{s.label}</p>
        </motion.div>
      ))}
    </div>
  )
}
