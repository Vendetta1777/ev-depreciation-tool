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
  { value: pct(VALUE_RETENTION.ev), label: 'EV keeps after 5 yrs' },
  { value: pct(VALUE_RETENTION.ice), label: 'Gas keeps after 5 yrs' },
  { value: pct(VALUE_RETENTION.tesla), label: 'Tesla keeps' },
  { value: pct(VALUE_RETENTION.budgetEv), label: 'Budget EV (<$35k)' },
  { value: pct(VALUE_RETENTION.luxuryEv), label: 'Luxury EV (>$50k)' },
  { value: `${(EV_ANNUAL_DEPRECIATION_PREMIUM * 100).toFixed(1)}%`, label: 'Faster EV drop / yr' },
  { value: RESEARCH.datasetSize.toLocaleString(), label: 'Cars in the study' },
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
        <p className="text-sm font-medium uppercase tracking-widest text-teal">The backstory</p>
        <h1 className="mt-2 text-4xl font-bold text-ink sm:text-5xl">
          Why I built this
        </h1>
        <p className="mt-5 text-lg text-ink-muted">
          I kept hearing that electric cars lose value fast, but nobody could tell
          me how fast, or whether that meant I should buy or lease one. So I pulled
          the data and wrote a research paper on it. This tool is that paper, turned
          into something you can actually poke at with your own car.
        </p>
      </motion.div>

      <Block>
        <h2 className="text-2xl font-semibold text-ink">The data and the models</h2>
        <p className="mt-3 text-ink-muted">
          I worked with a dataset of about{' '}
          <span className="font-semibold text-ink">{RESEARCH.datasetSize.toLocaleString()} cars</span>{' '}
          and trained two models to predict resale value:{' '}
          <span className="text-ink">Random Forest</span> and{' '}
          <span className="text-ink">XGBoost</span>. The better one got an accuracy of{' '}
          <span className="font-semibold text-ink">R² {RESEARCH.rSquared.toFixed(3)}</span>, which
          is pretty tight. I read through {RESEARCH.papersReviewed} papers along the way to
          sanity-check what I was seeing.
        </p>
        <p className="mt-3 text-ink-muted">
          Both models pointed at the same few things.{' '}
          {DEPRECIATION_DRIVERS.map((d, i) => (
            <span key={d.key}>
              {i > 0 && ', '}
              <span className="text-ink">{d.label}</span> ({pct(d.importance)})
            </span>
          ))}{' '}
          do most of the work. Mileage, honestly, barely mattered.
        </p>
      </Block>

      <Block>
        <h2 className="text-2xl font-semibold text-ink">The numbers that stuck with me</h2>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {KEY_FINDINGS.map((f) => (
            <div key={f.label} className="rounded-2xl border border-border bg-surface-raised/60 p-5 text-center">
              <p className="tabular text-2xl font-bold text-teal">{f.value}</p>
              <p className="mt-1 text-xs text-ink-muted">{f.label}</p>
            </div>
          ))}
        </div>
      </Block>

      <Block>
        <h2 className="text-2xl font-semibold text-ink">How the math works</h2>
        <dl className="mt-4 space-y-5">
          <div>
            <dt className="font-semibold text-ink">The depreciation curve</dt>
            <dd className="mt-1 text-ink-muted">
              Every car falls into a bucket from the study: Tesla, luxury EV, budget
              EV, average EV, or gas. Each bucket has a five-year retention number,
              and I use that to work out a steady yearly drop and draw the curve
              forward.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Buy vs lease (NPV)</dt>
            <dd className="mt-1 text-ink-muted">
              I compare buying and leasing as five-year costs, but in today&apos;s
              dollars. Lease payments, upkeep, fuel, and the resale you get back from
              owning all get discounted back to the present, so the two options line
              up fairly.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Why {pct(NPV.discountRate, 0)}</dt>
            <dd className="mt-1 text-ink-muted">
              That {pct(NPV.discountRate, 0)} is the discount rate, basically what your
              money could earn if it were doing something else. It is why a dollar of
              resale five years from now is worth less than a dollar today, and why a
              cheap EV lease can quietly win even when the sticker prices look even.
            </dd>
          </div>
        </dl>
      </Block>

      <Block>
        <a
          href="#"
          className="inline-flex items-center gap-2 rounded-lg border border-teal/50 px-5 py-3 font-medium text-teal transition hover:bg-teal/10"
        >
          Read the paper →
        </a>
      </Block>

      <Block>
        <div className="rounded-2xl border border-border bg-surface-raised/60 p-6 text-sm text-ink-muted">
          <p className="font-semibold text-ink">Credits</p>
          <p className="mt-2">
            Built by <span className="text-ink">Ved Shrinivas</span>, American School
            of Dubai. IEEE Research 2025. Mentor:{' '}
            <span className="text-ink">Vinay Vishwakarma</span>.
          </p>
        </div>
      </Block>
    </div>
  )
}
