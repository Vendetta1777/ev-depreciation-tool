import { DEPRECIATION_DRIVERS, VALUE_RETENTION } from '../data/constants'

/**
 * About page — Phase 1 placeholder.
 * Explains the methodology and surfaces headline findings from the paper.
 */
export default function About() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-ink">The research</h1>
      <p className="mt-4 text-ink-muted">
        This tool operationalizes an IEEE paper that analyzed 15,000 vehicles
        using Random Forest and XGBoost models to predict depreciation. Below
        are the headline findings the projections are built on.
      </p>

      <h2 className="mt-10 text-lg font-semibold text-teal">
        5-year value retention
      </h2>
      <ul className="mt-3 space-y-1 text-ink-muted">
        <li>All EVs: {(VALUE_RETENTION.ev * 100).toFixed(1)}%</li>
        <li>ICE: {(VALUE_RETENTION.ice * 100).toFixed(1)}%</li>
        <li>Tesla: {(VALUE_RETENTION.tesla * 100).toFixed(1)}%</li>
        <li>Budget EVs (&lt;$35k): {(VALUE_RETENTION.budgetEv * 100).toFixed(1)}%</li>
        <li>Luxury EVs (&gt;$50k): {(VALUE_RETENTION.luxuryEv * 100).toFixed(1)}%</li>
      </ul>

      <h2 className="mt-10 text-lg font-semibold text-teal">
        Top depreciation drivers
      </h2>
      <ul className="mt-3 space-y-1 text-ink-muted">
        {DEPRECIATION_DRIVERS.map((d) => (
          <li key={d.key}>
            {d.label}: {(d.importance * 100).toFixed(1)}%
          </li>
        ))}
      </ul>
    </section>
  )
}
