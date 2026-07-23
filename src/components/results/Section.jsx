import { motion } from 'framer-motion'

/**
 * Scroll-triggered fade-in wrapper. Fades + rises into view once, when ~20% of
 * the section enters the viewport.
 */
export default function Section({ children, className = '', delay = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

/** Consistent section heading + optional caption. */
export function SectionHeader({ title, caption }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-semibold text-ink sm:text-2xl">{title}</h2>
      {caption && <p className="mt-1 text-sm text-ink-muted">{caption}</p>}
    </div>
  )
}
