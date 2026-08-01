import { useEffect, useRef, useState } from 'react'
import { loadCatalog } from '../lib/catalog.js'

/**
 * Free-text fuzzy combobox over the real catalog. Emits a vehicle
 * { make, model, powertrain, body_class } on select. Optional quick-pick
 * `chips` sit under the box (they may also carry an msrp, passed through).
 */
export default function VehicleCombobox({ selectedLabel, onSelect, chips = [] }) {
  const [search, setSearch] = useState(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const boxRef = useRef(null)

  useEffect(() => {
    loadCatalog().then((fn) => setSearch(() => fn))
  }, [])

  // Debounced search.
  useEffect(() => {
    if (!search || query.trim().length < 1) {
      setResults([])
      return
    }
    const t = setTimeout(() => {
      setResults(search(query, 8))
      setHi(0)
    }, 150)
    return () => clearTimeout(t)
  }, [query, search])

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const pick = (v) => {
    onSelect(v)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHi((h) => Math.min(h + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHi((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(results[hi])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={boxRef}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-autocomplete="list"
        value={query}
        placeholder={selectedLabel ? `${selectedLabel} — type to change` : 'Search any make or model…'}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="w-full rounded-lg border border-border bg-navy px-3 py-2.5 text-ink placeholder:text-ink-muted"
      />
      {open && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-navy shadow-xl"
        >
          {results.map((v, i) => (
            <li
              key={`${v.make}-${v.model}`}
              role="option"
              aria-selected={i === hi}
              onMouseEnter={() => setHi(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                pick(v)
              }}
              className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
                i === hi ? 'bg-teal/15 text-ink' : 'text-ink-muted'
              }`}
            >
              <span>
                <span className="font-medium text-ink">{v.make}</span> {v.model}
              </span>
              <span className="ml-2 shrink-0 text-xs text-ink-muted">{v.powertrain ?? ''}</span>
            </li>
          ))}
        </ul>
      )}
      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={`${c.make}-${c.model}`}
              type="button"
              onClick={() => pick(c)}
              className="rounded-full border border-border bg-surface-raised/60 px-2.5 py-1 text-xs text-ink-muted transition hover:border-teal hover:text-teal"
            >
              {c.model}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
