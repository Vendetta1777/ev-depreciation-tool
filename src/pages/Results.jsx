/**
 * Results dashboard — Phase 1 placeholder.
 * Will render: depreciation curve (Recharts), 5-year resale callout,
 * driver breakdown, and the buy-vs-lease NPV recommendation card.
 */
export default function Results() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-bold text-ink">Projection</h1>
      <p className="mt-2 text-ink-muted">
        Depreciation curve, resale estimate, and buy-vs-lease recommendation.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-raised p-8 text-ink-muted">
          Depreciation chart — coming in Phase 2.
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-8 text-ink-muted">
          Buy-vs-lease NPV — coming in Phase 2.
        </div>
      </div>
    </section>
  )
}
