import { Link } from 'react-router-dom'

/**
 * Landing page — Phase 1 placeholder.
 * Hero + CTA into the input form. Full visual treatment lands in a later phase.
 */
export default function Landing() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
      <p className="mb-4 text-sm font-medium uppercase tracking-widest text-teal">
        IEEE-backed · 15,000 vehicles · RF + XGBoost
      </p>
      <h1 className="text-5xl font-bold tracking-tight text-ink sm:text-6xl">
        Know what your EV is really worth in 5 years.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-ink-muted">
        Personalized depreciation curves, resale-value estimates, and a
        buy-vs-lease NPV recommendation — grounded in a dataset of 15,000
        vehicles.
      </p>
      <Link
        to="/estimate"
        className="mt-10 rounded-lg bg-teal px-8 py-3 font-semibold text-navy transition hover:bg-teal-400"
      >
        Run my projection
      </Link>
    </section>
  )
}
