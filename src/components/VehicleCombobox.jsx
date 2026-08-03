import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { loadCatalog } from '../lib/catalog.js'

/**
 * Free-text fuzzy combobox over the real catalog. Emits a vehicle
 * { make, model, powertrain, body_class } on select. Optional quick-pick
 * `chips` sit under the box (they may also carry an msrp, passed through).
 *
 * `animated` opts into motion (result stagger, a select flash, chip press) —
 * off by default so pages that want a static picker are unaffected.
 */
export default function VehicleCombobox({ selectedLabel, onSelect, chips = [], animated = false }) {
  const reduce = useReducedMotion()
  const M = animated && !reduce
  const [search, setSearch] = useState(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const [flash, setFlash] = useState(0)
  const boxRef = useRef(null)

  useEffect(() => {
    loadCatalog().then((fn) => setSearch(() => fn))
  }, [])

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
    if (M) setFlash((f) => f + 1)
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

  const listProps = M ? { variants: { hidden: {}, show: { transition: { staggerChildren: 0.028 } } }, initial: 'hidden', animate: 'show' } : {}
  const itemProps = M ? { variants: { hidden: { opacity: 0, y: -4 }, show: { opacity: 1, y: 0 } }, transition: { duration: 0.12 } } : {}

  return (
    <div className="relative" ref={boxRef}>
      <div className="relative">
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
        {M && flash > 0 && (
          <motion.div
            key={flash}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 z-10 rounded-lg ring-2 ring-teal"
          />
        )}
      </div>

      {open && results.length > 0 && (
        <motion.ul
          role="listbox"
          {...listProps}
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-navy shadow-xl"
        >
          {results.map((v, i) => (
            <motion.li
              key={`${v.make}-${v.model}`}
              {...itemProps}
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
            </motion.li>
          ))}
        </motion.ul>
      )}

      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <motion.button
              key={`${c.make}-${c.model}`}
              type="button"
              whileTap={M ? { scale: 0.94 } : undefined}
              onClick={() => pick(c)}
              className="rounded-full border border-border bg-surface-raised/60 px-2.5 py-1 text-xs text-ink-muted transition hover:border-teal hover:text-teal"
            >
              {c.model}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}
