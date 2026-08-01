import VehicleCombobox from './VehicleCombobox.jsx'
import { DEFAULT_YEAR } from '../data/curveVehicles.js'

const CURRENT_YEAR = 2026

/**
 * One vehicle's full input: fuzzy make/model search + a YEAR input (feeds the
 * curve's age gate) + MSRP. Emits pieces via the on* callbacks.
 */
export default function VehicleSelect({ title, vehicle, year, msrp, onVehicle, onYear, onMsrp, chips }) {
  const selectedLabel = vehicle ? `${vehicle.make} ${vehicle.model}` : ''
  return (
    <div className="rounded-2xl border border-border bg-surface-raised/60 p-4 sm:p-5">
      {title && (
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</span>
      )}
      <VehicleCombobox selectedLabel={selectedLabel} chips={chips} onSelect={onVehicle} />
      {vehicle && (
        <p className="mt-2 text-xs text-ink-muted">
          Selected: <span className="text-ink">{year} {vehicle.make} {vehicle.model}</span> ·{' '}
          {vehicle.powertrain ?? 'unknown'}
        </p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs text-ink-muted">Year</span>
          <input
            type="number"
            value={year}
            min={1990}
            max={CURRENT_YEAR + 1}
            step={1}
            onChange={(e) => onYear(Number(e.target.value))}
            className="tabular w-full rounded-lg border border-border bg-navy px-3 py-2 text-ink"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-muted">MSRP</span>
          <input
            type="number"
            value={msrp}
            min={10000}
            max={250000}
            step={500}
            onChange={(e) => onMsrp(Number(e.target.value))}
            className="tabular w-full rounded-lg border border-border bg-navy px-3 py-2 text-ink"
          />
        </label>
      </div>
    </div>
  )
}

export { DEFAULT_YEAR }
