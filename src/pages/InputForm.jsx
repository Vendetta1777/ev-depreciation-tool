/**
 * Input form page — Phase 1 placeholder.
 * Will collect: make/model, MSRP, model year, powertrain (EV/ICE),
 * annual miles, and buy-vs-lease intent, then route to /results.
 */
export default function InputForm() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold text-ink">Your vehicle</h1>
      <p className="mt-2 text-ink-muted">
        Tell us about the car. We&apos;ll model its depreciation and financing.
      </p>
      <div className="mt-8 rounded-xl border border-border bg-surface-raised p-8 text-ink-muted">
        Input form — coming in Phase 2.
      </div>
    </section>
  )
}
