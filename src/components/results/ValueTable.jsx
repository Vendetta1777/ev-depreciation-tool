import { usd } from '../../utils/format'

/**
 * Section 3 — per-year value projection table. Alternating rows; the row for the
 * vehicle's current age is highlighted.
 */
export default function ValueTable({ rows, currentYear }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead>
          <tr className="bg-navy-700 text-ink-muted">
            <th className="px-5 py-3 font-medium">Year</th>
            <th className="px-5 py-3 text-right font-medium">Projected Value</th>
            <th className="px-5 py-3 text-right font-medium">Value Lost</th>
            <th className="px-5 py-3 text-right font-medium">Retention</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const isCurrent = r.year === currentYear
            return (
              <tr
                key={r.year}
                className={
                  isCurrent
                    ? 'bg-teal/10 text-ink ring-1 ring-inset ring-teal/40'
                    : i % 2 === 0
                      ? 'bg-surface-raised/40 text-ink'
                      : 'bg-transparent text-ink'
                }
              >
                <td className="px-5 py-3 font-medium">
                  {r.year}
                  {isCurrent && (
                    <span className="ml-2 rounded bg-teal/20 px-1.5 py-0.5 text-xs text-teal">
                      now
                    </span>
                  )}
                </td>
                <td className="tabular px-5 py-3 text-right">{usd(r.value)}</td>
                <td className="tabular px-5 py-3 text-right text-negative">
                  −{usd(r.valueLost)}
                </td>
                <td className="tabular px-5 py-3 text-right text-ink-muted">
                  {r.retention}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
