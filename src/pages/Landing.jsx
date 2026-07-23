import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import AnimatedBackground from '../components/landing/AnimatedBackground'
import StatsStrip from '../components/landing/StatsStrip'
import HowItWorks from '../components/landing/HowItWorks'
import InsightCards from '../components/landing/InsightCards'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 26 } },
}

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.45 }}
      className="mb-10 text-center"
    >
      {eyebrow && (
        <p className="text-sm font-medium uppercase tracking-widest text-teal">{eyebrow}</p>
      )}
      <h2 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">{title}</h2>
      {subtitle && <p className="mx-auto mt-3 max-w-2xl text-ink-muted">{subtitle}</p>}
    </motion.div>
  )
}

export default function Landing() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative flex min-h-[calc(100vh-64px)] items-center overflow-hidden">
        <AnimatedBackground />
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative mx-auto max-w-4xl px-6 py-20 text-center"
        >
          <motion.p variants={item} className="text-sm font-medium uppercase tracking-widest text-teal">
            IEEE research · 15,000 vehicles · Random Forest + XGBoost
          </motion.p>
          <motion.h1
            variants={item}
            className="mt-5 text-5xl font-extrabold leading-tight tracking-tight text-ink sm:text-7xl"
          >
            Know What Your EV Is <span className="text-teal">Really Worth</span>
          </motion.h1>
          <motion.p variants={item} className="mx-auto mt-6 max-w-2xl text-lg text-ink-muted">
            Get a personalized 5-year depreciation forecast and buy-vs-lease
            recommendation — powered by IEEE research on 15,000 vehicles.
          </motion.p>
          <motion.div variants={item} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/estimate"
              className="w-full rounded-lg bg-teal px-8 py-3.5 font-semibold text-navy transition hover:bg-teal-400 sm:w-auto"
            >
              Get My Projection
            </Link>
            <Link
              to="/about"
              className="w-full rounded-lg border border-border px-8 py-3.5 font-semibold text-ink transition hover:border-teal/60 hover:text-teal sm:w-auto"
            >
              See The Research
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-8">
        <StatsStrip />
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <SectionHeading eyebrow="How it works" title="Three steps to your answer" />
        <HowItWorks />
      </section>

      {/* ── Sample insights ──────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <SectionHeading
          eyebrow="From the research"
          title="What the data shows"
          subtitle="A few findings the tool is built on — see the full picture in your own projection."
        />
        <InsightCards />
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-ink sm:text-5xl">Ready to see your numbers?</h2>
          <Link
            to="/estimate"
            className="mt-8 inline-block rounded-lg bg-teal px-10 py-4 text-lg font-semibold text-navy transition hover:bg-teal-400"
          >
            Calculate My Projection
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
