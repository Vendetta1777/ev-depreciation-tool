import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ParticleNetwork from '../components/landing/ParticleNetwork'
import Typewriter from '../components/Typewriter'
import Marquee from '../components/landing/Marquee'
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

const HEADLINES = [
  'Know What Your EV Is Really Worth',
  'Stop Guessing. Start Knowing.',
  "Your EV Loses Value Fast. Here's Exactly How Fast.",
]

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
        <ParticleNetwork />
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative mx-auto max-w-4xl px-6 py-20 text-center"
        >
          <motion.p variants={item} className="text-sm font-medium uppercase tracking-widest text-teal">
            Built on real numbers from 15,000 cars
          </motion.p>
          <motion.h1
            variants={item}
            className="mx-auto mt-5 flex min-h-[9rem] max-w-3xl items-center justify-center text-4xl font-extrabold leading-tight tracking-tight text-ink sm:min-h-[11rem] sm:text-6xl"
          >
            <Typewriter phrases={HEADLINES} />
          </motion.h1>
          <motion.p variants={item} className="mx-auto mt-6 max-w-2xl text-lg text-ink-muted">
            Punch in your car and see how fast it loses value, plus whether buying
            or leasing actually leaves more money in your pocket.
          </motion.p>
          <motion.div variants={item} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/estimate"
              className="w-full rounded-lg bg-teal px-8 py-3.5 font-semibold text-navy transition hover:bg-teal-400 sm:w-auto"
            >
              Check my numbers
            </Link>
            <Link
              to="/about"
              className="w-full rounded-lg border border-border px-8 py-3.5 font-semibold text-ink transition hover:border-teal/60 hover:text-teal sm:w-auto"
            >
              See the research
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Marquee ──────────────────────────────────────────── */}
      <Marquee />

      {/* ── Stats strip ──────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <StatsStrip />
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <SectionHeading eyebrow="How it works" title="Three steps, about thirty seconds" />
        <HowItWorks />
      </section>

      {/* ── Sample insights ──────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <SectionHeading
          eyebrow="From the data"
          title="A few things the numbers turned up"
          subtitle="Little previews of what the models found. Run your own car to see the full picture."
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
          <h2 className="text-3xl font-bold text-ink sm:text-5xl">So, what's your car worth?</h2>
          <Link
            to="/estimate"
            className="mt-8 inline-block rounded-lg bg-teal px-10 py-4 text-lg font-semibold text-navy transition hover:bg-teal-400"
          >
            Run the numbers
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
