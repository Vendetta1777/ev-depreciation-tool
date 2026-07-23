import { motion } from 'framer-motion'
import {
  VALUE_RETENTION,
  DEPRECIATION_DRIVERS,
  EV_ANNUAL_DEPRECIATION_PREMIUM,
  RESEARCH,
  NPV,
} from '../data/constants'

const pct = (f, d = 1) => `${(f * 100).toFixed(d)}%`

const KEY_FINDINGS = [
  { value: RESEARCH.rSquared.toFixed(3), label: 'Model accuracy (R²)' },
  { value: pct(VALUE_RETENTION.ev), label: 'EV 5-yr retention' },
  { value: pct(VALUE_RETENTION.ice), label: 'ICE 5-yr retention' },
  { value: pct(VALUE_RETENTION.tesla), label: 'Tesla retention' },
  { value: pct(VALUE_RETENTION.budgetEv), label: 'Budget EV (<$35k)' },
  { value: pct(VALUE_RETENTION.luxuryEv), label: 'Luxury EV (>$50k)' },
  { value: `${(EV_ANNUAL_DEPRECIATION_PREMIUM * 100).toFixed(1)}%`, label: 'Faster EV depreciation / yr' },
  { value: RESEARCH.datasetSize.toLocaleString(), label: 'Vehicles analyzed' },
]

function Block({ children, delay = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5, delay }}
      className="mt-14"
    >
      {children}
    </motion.section>
  )
}

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm font-medium uppercase tracking-widest text-teal">The research</p>
        <h1 className="mt-2 text-4xl font-bold text-ink sm:text-5xl">
          The science behind the numbers
        </h1>
        <p className="mt-5 text-lg text-ink-muted">
          EV Depreciation Tool turns an IEEE research paper into a projection you
          can use. Electric vehicles lose value on a different curve than gas
          cars — and that gap changes the buy-vs-lease math. This tool makes that
          concrete for your specific vehicle.
        </p>
      </motion.div>

      {/* Dataset + models */}
      <Block>
        <h2 className="text-2xl font-semibold text-ink">Dataset &amp; models</h2>
        <p className="mt-3 text-ink-muted">
          The study analyzed{' '}
          <span className="font-semibold text-ink">{RESEARCH.datasetSize.toLocaleString()} vehicles</span>{' '}
          using two ensemble machine-learning models — <span className="text-ink">Random Forest</span>{' '}
          and <span className="text-ink">XGBoost</span> — to predict resale value from
          vehicle attributes. The best model reached an accuracy of{' '}
          <span className="font-semibold text-ink">R² = {RESEARCH.rSquared.toFixed(3)}</span>,
          drawing on {RESEARCH.papersReviewed} surveyed research papers.
        </p>
        <p className="mt-3 text-ink-muted">
          The models agree on what matters most:{' '}
          {DEPRECIATION_DRIVERS.map((d, i) => (
            <span key={d.key}>
              {i > 0 && ', '}
              <span className="text-ink">{d.label}</span> ({pct(d.importance)})
            </span>
          ))}{' '}
          dominate the depreciation signal.
        </p>
      </Block>

      {/* Key findings grid */}
      <Block>
        <h2 className="text-2xl font-semibold text-ink">Key findings</h2>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {KEY_FINDINGS.map((f) => (
            <div key={f.label} className="rounded-2xl border border-border bg-surface-raised/60 p-5 text-center">
              <p className="tabular text-2xl font-bold text-teal">{f.value}</p>
              <p className="mt-1 text-xs text-ink-muted">{f.label}</p>
            </div>
          ))}
        </div>
      </Block>

      {/* Methodology */}
      <Block>
        <h2 className="text-2xl font-semibold text-ink">Methodology</h2>
        <dl className="mt-4 space-y-5">
          <div>
            <dt className="font-semibold text-ink">Depreciation curves</dt>
            <dd className="mt-1 text-ink-muted">
              Each vehicle is placed into a retention tier (Tesla, luxury EV,
              budget EV, EV average, or ICE) from the research. That 5-year
              retention implies a constant annual decay rate, which we project
              forward year by year to draw the curve and estimate resale value.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Net present value (NPV)</dt>
            <dd className="mt-1 text-ink-muted">
              Buying and leasing are compared as 5-year costs in <em>today&apos;s</em>{' '}
              dollars. Future cash flows — lease payments, maintenance, fuel, and
              the resale value you recover by owning — are discounted back to the
              present so the two options can be compared on equal footing.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">The {pct(NPV.discountRate, 0)} discount rate</dt>
            <dd className="mt-1 text-ink-muted">
              A {pct(NPV.discountRate, 0)} annual discount rate represents a
              household&apos;s cost of capital — the return money could earn
              elsewhere. It&apos;s why a dollar of resale value five years out is
              worth less than a dollar spent today, and often why a subsidized EV
              lease can edge out buying even when the sticker math looks even.
            </dd>
          </div>
        </dl>
      </Block>

      {/* Paper link */}
      <Block>
        <a
          href="#"
          className="inline-flex items-center gap-2 rounded-lg border border-teal/50 px-5 py-3 font-medium text-teal transition hover:bg-teal/10"
        >
          Read the IEEE paper →
        </a>
      </Block>

      {/* Credits */}
      <Block>
        <div className="rounded-2xl border border-border bg-surface-raised/60 p-6 text-sm text-ink-muted">
          <p className="font-semibold text-ink">Credits</p>
          <p className="mt-2">
            Built by <span className="text-ink">Ved Shrinivas</span>, American School
            of Dubai · IEEE Research 2025 · Mentor:{' '}
            <span className="text-ink">Vinay Vishwakarma</span>
          </p>
        </div>
      </Block>
    </div>
  )
}
