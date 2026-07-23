/**
 * Marquee strip: research facts scrolling sideways forever. The content is
 * duplicated so the loop has no visible seam.
 */
const FACTS = [
  'EVs lose about 3.6% more value per year than gas cars',
  'Tesla holds 41.4% of its value after 5 years',
  'Budget EVs under $35k keep just 17.9%',
  'Vehicle age drives 40% of depreciation',
  'The average EV keeps 30.3% after 5 years',
  'Gas cars keep 33.9% after 5 years',
  'Models trained on 15,000 vehicles, R² of 0.990',
  'Luxury EVs over $50k hold 35.6%',
]

export default function Marquee() {
  const items = [...FACTS, ...FACTS]
  return (
    <div className="relative overflow-hidden border-y border-border bg-surface-raised/40 py-3">
      <div className="marquee-track flex w-max gap-10 whitespace-nowrap">
        {items.map((f, i) => (
          <span key={i} className="flex items-center gap-10 text-sm text-ink-muted">
            <span className="text-teal">◆</span>
            {f}
          </span>
        ))}
      </div>
    </div>
  )
}
