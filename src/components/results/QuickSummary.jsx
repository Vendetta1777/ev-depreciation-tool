import { motion } from 'framer-motion'
import { summaryBullets } from '../../utils/summary'

/**
 * Three plain-English takeaways right under the verdict, so people get the gist
 * without reading a single chart.
 */
export default function QuickSummary({ vehicle, projection }) {
  const bullets = summaryBullets(vehicle, projection)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl border border-border bg-surface-raised/60 p-6 sm:p-7"
    >
      <p className="text-sm font-medium uppercase tracking-widest text-teal">The short version</p>
      <ul className="mt-4 space-y-3">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-3 text-ink">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
