/**
 * Small presentational bits shared by the decision (/decide) and comparison
 * (/compare) pages. Keeping one copy means provenance, citations, and sliders
 * render identically across modes.
 */

/** Derived and published must NOT look the same. */
export function ProvenanceChip({ provenance }) {
  const published = provenance.evidence === 'published'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        published ? 'bg-teal/15 text-teal-400' : 'bg-warning/15 text-warning'
      }`}
      title={
        published ? 'Published segment figure' : 'Derived / inferred figure — not a published segment average'
      }
    >
      <span aria-hidden>{published ? '✓' : '≈'}</span>
      {published ? 'Published data' : 'Estimated (derived)'}
    </span>
  )
}

/** Source line shown under a figure block. */
export function Citation({ provenance }) {
  return (
    <p className="mt-3 text-xs leading-relaxed text-ink-muted">
      Source:{' '}
      {provenance.sourceUrl ? (
        <a
          href={provenance.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-teal-400 underline decoration-dotted underline-offset-2 hover:text-teal"
        >
          {provenance.source}
        </a>
      ) : (
        provenance.source
      )}
      {provenance.sourceYear ? ` (${provenance.sourceYear}).` : '.'}{' '}
      {provenance.note && <span className="text-warning">{provenance.note} </span>}
      {provenance.sourceNote}
    </p>
  )
}

export function Slider({ label, help, live, value, min, max, step, onChange, format }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="tabular text-sm font-semibold text-teal-400">{format(value)}</span>
      </div>
      {help && <p className="mb-1.5 text-xs text-ink-muted">{help}</p>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-teal"
      />
      <span className={`mt-1 inline-block text-[11px] font-medium ${live ? 'text-positive' : 'text-ink-muted'}`}>
        {live ? 'can flip the verdict' : 'affects cost, not the verdict'}
      </span>
    </label>
  )
}

export function StatRow({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2 last:border-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className={`tabular text-sm ${strong ? 'font-bold text-ink' : 'text-ink'}`}>{value}</span>
    </div>
  )
}
