import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * SearchableSelect — a combobox you can type into to filter a long list.
 * Keyboard: arrows to move, Enter to pick, Esc to close. Click outside closes.
 *
 * Options may be plain strings or { value, label } objects.
 */
export default function SearchableSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select',
  error,
  disabled,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const rootRef = useRef(null)
  const listRef = useRef(null)

  const norm = useMemo(
    () => options.map((o) => (typeof o === 'object' ? o : { value: o, label: o })),
    [options],
  )
  const selected = norm.find((o) => o.value === value)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return norm
    return norm.filter((o) => o.label.toLowerCase().includes(q))
  }, [norm, query])

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Keep the active option in view.
  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.children[active]
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  function choose(opt) {
    onChange(opt.value)
    setOpen(false)
    setQuery('')
  }

  function onKeyDown(e) {
    if (disabled) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) setOpen(true)
      setActive((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (open && filtered[active]) choose(filtered[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const fieldBase =
    'w-full rounded-lg border bg-navy-800 px-4 py-3.5 text-left text-ink outline-none transition focus:ring-2 focus:ring-teal/70'

  return (
    <div className="block" ref={rootRef}>
      <span className="mb-2 block text-sm font-medium text-ink-muted">{label}</span>
      <div className="relative">
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${label}-listbox`}
          autoComplete="off"
          disabled={disabled}
          value={open ? query : selected?.label ?? ''}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
            if (!open) setOpen(true)
          }}
          onFocus={() => !disabled && setOpen(true)}
          onKeyDown={onKeyDown}
          className={`${fieldBase} pr-10 placeholder:text-ink-muted/60 disabled:cursor-not-allowed disabled:opacity-50 ${
            error ? 'border-negative' : 'border-border'
          }`}
        />
        <span
          className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted transition ${
            open ? 'rotate-180' : ''
          }`}
        >
          ▾
        </span>

        <AnimatePresence>
          {open && !disabled && (
            <motion.ul
              id={`${label}-listbox`}
              ref={listRef}
              role="listbox"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.14 }}
              className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-border bg-navy-800 py-1 shadow-2xl"
            >
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-ink-muted">No matches. Try another spelling.</li>
              )}
              {filtered.map((opt, i) => (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={opt.value === value}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    choose(opt)
                  }}
                  className={`cursor-pointer px-4 py-2.5 text-sm ${
                    i === active ? 'bg-teal/15 text-teal' : 'text-ink'
                  } ${opt.value === value ? 'font-semibold' : ''}`}
                >
                  {opt.label}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      {error && <p className="mt-1.5 text-sm text-negative">{error}</p>}
    </div>
  )
}
