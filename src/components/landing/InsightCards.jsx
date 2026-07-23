import { motion } from 'framer-motion'
import { VALUE_RETENTION, DEPRECIATION_DRIVERS, RESEARCH } from '../../data/constants'

const evDelta = ((VALUE_RETENTION.tesla - VALUE_RETENTION.ev) * 100).toFixed(0)
const ageImportance = (DEPRECIATION_DRIVERS[0].importance * 100).toFixed(0)
const mileageImportance = (RESEARCH.mileageImportance * 100).toFixed(1)

const INSIGHTS = [
  {
    stat: `${(VALUE_RETENTION.tesla * 100).toFixed(1)}%`,
    body: `A Tesla still holds ${(VALUE_RETENTION.tesla * 100).toFixed(1)}% of its value after five years. That is about ${evDelta} points above the average EV.`,
  },
  {
    stat: `${(VALUE_RETENTION.budgetEv * 100).toFixed(1)}%`,
    body: `Budget EVs under $35k keep just ${(VALUE_RETENTION.budgetEv * 100).toFixed(1)}%. Less than half of what a Tesla hangs onto.`,
  },
  {
    stat: `${ageImportance}%`,
    body: `Age is what really moves the needle, about ${ageImportance}% of the drop. Mileage barely registers at ${mileageImportance}%.`,
  },
]

export default function InsightCards() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {INSIGHTS.map((c, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.45, delay: i * 0.1 }}
          whileHover={{ y: -6 }}
          className="group relative overflow-hidden rounded-2xl border border-border bg-surface-raised/60 p-7 transition-colors duration-300 hover:border-teal/50"
        >
          {/* shimmer sheen that sweeps across on hover */}
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-teal/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <div className="relative">
            <div className="mb-4 border-l-2 border-teal pl-3">
              <span className="tabular text-3xl font-bold text-teal">{c.stat}</span>
            </div>
            <p className="text-ink-muted">{c.body}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
