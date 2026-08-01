import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ParticleNetwork from '../components/landing/ParticleNetwork'

const HOW = [
  {
    title: 'Published curves',
    body: 'Five-year retention comes from published iSeeCars data — not a model we trained.',
  },
  {
    title: 'Every figure cited',
    body: 'Each number links to its source. Open the methodology any time.',
  },
  {
    title: 'Estimates labeled',
    body: 'Segment averages and derived figures are flagged, never dressed up as exact.',
  },
]

export default function Landing() {
  return (
    <section className="relative flex min-h-[calc(100vh-64px)] items-center overflow-hidden">
      <ParticleNetwork />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-3xl px-6 py-20 text-center"
      >
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-6xl">
          Buy, lease, or go gas?
          <br />
          <span className="text-teal">See which costs less over five years.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-ink-muted sm:text-lg">
          Pick your car and get a five-year cost verdict from published depreciation data — buy vs.
          lease, or EV vs. gas.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/decide"
            className="w-full rounded-lg bg-teal px-8 py-3.5 font-semibold text-navy transition hover:bg-teal-400 sm:w-auto"
          >
            Buy or lease?
          </Link>
          <Link
            to="/compare"
            className="w-full rounded-lg border border-border px-8 py-3.5 font-semibold text-ink transition hover:border-teal/60 hover:text-teal sm:w-auto"
          >
            EV vs. gas?
          </Link>
        </div>

        <div className="mt-16 grid gap-6 text-left sm:grid-cols-3">
          {HOW.map((h) => (
            <div key={h.title}>
              <p className="text-sm font-semibold text-teal">{h.title}</p>
              <p className="mt-1 text-sm text-ink-muted">{h.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-xs text-ink-muted">
          <Link
            to="/methodology"
            className="text-teal-400 underline decoration-dotted underline-offset-2 hover:text-teal"
          >
            How it works, in full →
          </Link>
        </p>
      </motion.div>
    </section>
  )
}
