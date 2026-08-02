import { useEffect, useRef, useState } from 'react'
import { usd } from '../utils/format.js'

/**
 * Shared editorial-theme building blocks (used under a `.editorial` scope on
 * /decide and /compare): a counting figure, a quiet provenance annotation,
 * a source citation, an aligned mono figure row, a slider, and a section eyebrow.
 */

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

/** Money that counts up on mount and tweens on change (rAF, no deps). */
export function Figure({ value, from0 = false, className }) {
  const [display, setDisplay] = useState(from0 ? 0 : value)
  const cur = useRef(from0 ? 0 : value)
  useEffect(() => {
    const start = cur.current
    const end = value
    if (start === end) return
    let raf
    let t0 = null
    const dur = 550
    const step = (ts) => {
      if (t0 === null) t0 = ts
      const p = Math.min((ts - t0) / dur, 1)
      const v = start + (end - start) * easeOutCubic(p)
      cur.current = v
      setDisplay(v)
      if (p < 1) raf = requestAnimationFrame(step)
      else cur.current = end
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span className={className}>{usd(Math.round(display))}</span>
}

/** Provenance as an annotation, not a badge. */
export function Chip({ provenance }) {
  const pub = provenance.evidence === 'published'
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-muted">
      <span className={`h-1.5 w-1.5 rounded-full ${pub ? 'bg-teal' : 'bg-warning'}`} aria-hidden />
      {pub ? 'Published' : 'Estimated'}
    </span>
  )
}

export function Cite({ provenance }) {
  return (
    <p className="rule mt-5 border-t pt-3 text-xs leading-relaxed text-ink-muted">
      Source:{' '}
      {provenance.sourceUrl ? (
        <a
          href={provenance.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-teal underline decoration-dotted underline-offset-2 hover:text-teal-400"
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

/** Label left, mono figure right — columns align. Pass a number, not a string. */
export function Row({ label, value, strong }) {
  return (
    <div className="rule flex items-baseline justify-between gap-4 border-b py-1.5 last:border-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <Figure
        value={value}
        className={`font-mono text-sm tabular-nums ${strong ? 'font-semibold text-teal' : 'text-ink'}`}
      />
    </div>
  )
}

export function Rail({ label, help, live, value, min, max, step, onChange, format }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-ink">{label}</span>
        <span className="font-mono text-sm tabular-nums text-teal">{format(value)}</span>
      </div>
      {help && <p className="mt-1 text-xs leading-relaxed text-ink-muted">{help}</p>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-teal"
      />
      <span className={`mt-1 block text-[11px] tracking-wide ${live ? 'text-teal' : 'text-ink-muted'}`}>
        {live ? 'can flip the verdict' : 'affects cost, not the verdict'}
      </span>
    </label>
  )
}

export const Eyebrow = ({ children }) => (
  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{children}</p>
)
