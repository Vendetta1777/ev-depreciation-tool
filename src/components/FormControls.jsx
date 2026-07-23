import { motion } from 'framer-motion'

/**
 * Shared, theme-styled form primitives: labelled Select and Input with inline
 * error messaging. Navy surfaces, teal focus rings, large tap targets.
 */

const fieldBase =
  'w-full min-h-[48px] rounded-lg border bg-navy-800 px-4 py-3.5 text-ink placeholder:text-ink-muted/60 ' +
  'outline-none transition focus:ring-2 focus:ring-teal/70 disabled:opacity-50'

/**
 * On phones, nudge the focused field toward the middle of the screen so the
 * on-screen keyboard does not sit on top of it. Delayed so it fires after the
 * keyboard starts animating in.
 */
export function keepInView(e) {
  if (window.innerWidth >= 640) return
  const el = e.currentTarget
  setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)
}

function ErrorText({ children }) {
  if (!children) return null
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-1.5 text-sm text-negative"
    >
      {children}
    </motion.p>
  )
}

export function Select({ label, value, onChange, options, placeholder, error, disabled }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={keepInView}
        disabled={disabled}
        className={`${fieldBase} ${error ? 'border-negative' : 'border-border'} ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        } appearance-none`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt
          const text = typeof opt === 'object' ? opt.label : opt
          return (
            <option key={val} value={val}>
              {text}
            </option>
          )
        })}
      </select>
      <ErrorText>{error}</ErrorText>
    </label>
  )
}

export function NumberInput({ label, value, onChange, placeholder, error, prefix, suffix }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink-muted">{label}</span>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted">
            {prefix}
          </span>
        )}
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={keepInView}
          placeholder={placeholder}
          className={`${fieldBase} tabular ${error ? 'border-negative' : 'border-border'} ${
            prefix ? 'pl-8' : ''
          } ${suffix ? 'pr-16' : ''}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-muted">
            {suffix}
          </span>
        )}
      </div>
      <ErrorText>{error}</ErrorText>
    </label>
  )
}
