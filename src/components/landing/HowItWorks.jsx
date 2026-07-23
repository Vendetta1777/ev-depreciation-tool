import { motion } from 'framer-motion'

/* Simple inline icons (stroke = currentColor) so they inherit the teal accent. */
const CarIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
    <path d="M3 11h18v5a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1v-5z" />
  </svg>
)
const ChartIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <path d="M7 15l4-5 3 3 5-7" />
  </svg>
)
const CheckIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </svg>
)

const STEPS = [
  { icon: CarIcon, title: '1. Enter Your Vehicle', desc: 'Fuel type, make, model, year, mileage, and price. Takes 30 seconds.' },
  { icon: ChartIcon, title: '2. We Run The Numbers', desc: 'Research-derived depreciation curves and a 5-year NPV analysis, instantly.' },
  { icon: CheckIcon, title: '3. Get Your Recommendation', desc: 'A clear buy-vs-lease verdict with the dollar advantage spelled out.' },
]

export default function HowItWorks() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {STEPS.map((s, i) => (
        <motion.div
          key={s.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.45, delay: i * 0.12 }}
          className="relative rounded-2xl border border-border bg-surface-raised/60 p-7"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal/10 text-teal">
            <s.icon className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-ink">{s.title}</h3>
          <p className="mt-2 text-sm text-ink-muted">{s.desc}</p>

          {/* connecting arrow to the next step (md+) */}
          {i < STEPS.length - 1 && (
            <span className="absolute right-[-20px] top-1/2 hidden -translate-y-1/2 text-2xl text-border md:block">
              →
            </span>
          )}
        </motion.div>
      ))}
    </div>
  )
}
