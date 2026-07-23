import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usd } from '../../utils/format'

/**
 * Collapsible plain-English take on what the verdict means for this specific
 * car and owner.
 */
export default function WhatThisMeans({ vehicle, projection }) {
  const [open, setOpen] = useState(false)
  const { recommendation } = projection
  const name = `${vehicle.make} ${vehicle.model}`
  const leaseWins = recommendation.verdict === 'LEASE'
  const amount = usd(recommendation.advantage)

  const body = leaseWins
    ? `For your ${name}, leasing comes out ahead. EV lease rates are low right now, and over five years you would not keep enough of the resale value to make owning pay off. That gap is about ${amount} in your pocket. The one catch: if you tend to hang onto a car for eight years or more, buying usually flips back in front, because you keep driving it long after the payments stop.`
    : `For your ${name}, buying comes out ahead. It holds its value well enough that the resale you get back beats what you would spend on lease payments, roughly ${amount} over five years. Leasing still makes sense if you like a new car every few years and would rather not deal with reselling, but purely on the numbers, owning wins here.`

  return (
    <div className="rounded-2xl border border-border bg-surface-raised/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-semibold text-ink">What does this mean for me?</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-teal">
          ▾
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-6 text-ink-muted">{body}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
