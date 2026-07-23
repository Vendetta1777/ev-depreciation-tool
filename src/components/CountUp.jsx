import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'

/**
 * Animated count-up. Counts from 0 to `value` once, when scrolled into view.
 * Respects decimals and optional prefix/suffix; formats with thousands commas.
 */
export default function CountUp({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1.6,
  className = '',
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [inView, value, duration])

  const formatted = display.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={ref} className={`tabular ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
