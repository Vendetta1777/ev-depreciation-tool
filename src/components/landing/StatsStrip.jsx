import { motion } from 'framer-motion'
import CountUp from '../CountUp'
import { RESEARCH, EV_ANNUAL_DEPRECIATION_PREMIUM } from '../../data/constants'

const STATS = [
  { value: RESEARCH.datasetSize, label: 'Cars analyzed' },
  { value: RESEARCH.rSquared, decimals: 3, prefix: 'R² ', label: 'Model accuracy' },
  { value: EV_ANNUAL_DEPRECIATION_PREMIUM * 100, decimals: 1, suffix: '%', label: 'Faster EV drop / yr' },
  { value: RESEARCH.papersReviewed, label: 'Papers reviewed' },
]

/**
 * Stats strip: four big research numbers that count up as they scroll in.
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
            className="block text-4xl font-extrabold tracking-tight text-teal sm:text-5xl"
          />
          <p className="mt-2 text-sm text-ink-muted">{s.label}</p>
        </motion.div>
      ))}
    </div>
  )
}
