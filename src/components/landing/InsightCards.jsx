import { motion } from 'framer-motion'
import { VALUE_RETENTION, DEPRECIATION_DRIVERS, RESEARCH } from '../../data/constants'

const evDelta = ((VALUE_RETENTION.tesla - VALUE_RETENTION.ev) * 100).toFixed(0)
const ageImportance = (DEPRECIATION_DRIVERS[0].importance * 100).toFixed(0)
const mileageImportance = (RESEARCH.mileageImportance * 100).toFixed(1)

const INSIGHTS = [
  {
    stat: `${(VALUE_RETENTION.tesla * 100).toFixed(1)}%`,
    body: `Tesla retains ${(VALUE_RETENTION.tesla * 100).toFixed(1)}% of its value — about ${evDelta}% above the EV average.`,
  },
  {
    stat: `${(VALUE_RETENTION.budgetEv * 100).toFixed(1)}%`,
    body: `Budget EVs under $35k retain only ${(VALUE_RETENTION.budgetEv * 100).toFixed(1)}% — less than half of Tesla.`,
  },
  {
    stat: `${ageImportance}%`,
    body: `Vehicle age drives ${ageImportance}% of depreciation — mileage only ${mileageImportance}%.`,
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
          className="rounded-2xl border border-border bg-surface-raised/60 p-7 transition-colors hover:border-teal/50"
        >
          <div className="mb-4 border-l-2 border-teal pl-3">
            <span className="tabular text-3xl font-bold text-teal">{c.stat}</span>
          </div>
          <p className="text-ink-muted">{c.body}</p>
        </motion.div>
      ))}
    </div>
  )
}
