import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

function Block({ children, delay = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5, delay }}
      className="mt-12"
    >
      {children}
    </motion.section>
  )
}

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm font-medium uppercase tracking-widest text-teal">About</p>
        <h1 className="mt-2 text-4xl font-bold text-ink sm:text-5xl">What this tool does</h1>
        <p className="mt-5 text-lg text-ink-muted">
          It answers two money questions about a specific car over five years: is it cheaper to{' '}
          <span className="text-ink">buy or lease</span>, and does an{' '}
          <span className="text-ink">EV or a comparable gas car</span> cost less to own. Pick a
          vehicle, adjust the assumptions, and get a verdict with the dollar difference.
        </p>
      </motion.div>

      <Block>
        <h2 className="text-2xl font-semibold text-ink">Where the data comes from</h2>
        <p className="mt-3 text-ink-muted">
          Depreciation comes from{' '}
          <span className="text-ink">published five-year retention figures</span> (iSeeCars), matched
          to your vehicle by exact model where one exists, and by a powertrain × body × price-band
          segment average otherwise. There is{' '}
          <span className="text-ink">no trained model and no private dataset</span> — just cited
          numbers. Every figure on a result links back to its source.
        </p>
      </Block>

      <Block>
        <h2 className="text-2xl font-semibold text-ink">What it doesn&rsquo;t do</h2>
        <ul className="mt-3 space-y-2 text-ink-muted">
          <li>
            It doesn&rsquo;t predict your car&rsquo;s exact resale — it shows a{' '}
            <span className="text-ink">sourced estimate</span> and says so.
          </li>
          <li>
            It doesn&rsquo;t hide uncertainty: <span className="text-ink">derived figures</span> and{' '}
            <span className="text-ink">segment fallbacks</span> are flagged, never shown as exact.
          </li>
          <li>
            It doesn&rsquo;t give financial advice, and it doesn&rsquo;t model your taxes, credit, or
            local market.
          </li>
          <li>
            It doesn&rsquo;t invent numbers — where a curve isn&rsquo;t published yet, it says{' '}
            <span className="text-ink">&ldquo;figures pending&rdquo;</span> instead of guessing.
          </li>
        </ul>
      </Block>

      <Block>
        <Link
          to="/methodology"
          className="inline-flex items-center gap-2 rounded-lg border border-teal/50 px-5 py-3 font-medium text-teal transition hover:bg-teal/10"
        >
          Read the full methodology →
        </Link>
      </Block>
    </div>
  )
}
