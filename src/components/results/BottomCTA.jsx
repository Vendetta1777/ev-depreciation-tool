import { Link } from 'react-router-dom'

/**
 * Section 6 — closing calls to action + research attribution.
 */
export default function BottomCTA() {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised/60 p-8 text-center">
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          to="/estimate"
          className="w-full rounded-lg bg-teal px-8 py-3 font-semibold text-navy transition hover:bg-teal-400 sm:w-auto"
        >
          Run another projection
        </Link>
        <Link
          to="/about"
          className="w-full rounded-lg border border-border px-8 py-3 font-semibold text-ink transition hover:border-teal/60 hover:text-teal sm:w-auto"
        >
          About the research
        </Link>
      </div>
      <p className="mt-5 text-xs text-ink-muted">
        Based on IEEE research analyzing 15,000 vehicles.
      </p>
    </div>
  )
}
