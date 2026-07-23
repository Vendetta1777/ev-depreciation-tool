import { motion, useReducedMotion } from 'framer-motion'

/**
 * Subtle animated backdrop — a few slowly drifting, blurred teal blobs over the
 * navy base. Purely decorative and pointer-transparent. Falls back to a static
 * wash when the user prefers reduced motion.
 */
export default function AnimatedBackground() {
  const reduce = useReducedMotion()

  const blobs = [
    { className: 'left-[-10%] top-[-10%] h-[42rem] w-[42rem] bg-teal/10', delay: 0 },
    { className: 'right-[-15%] top-[10%] h-[36rem] w-[36rem] bg-teal/5', delay: 2 },
    { className: 'bottom-[-20%] left-[20%] h-[40rem] w-[40rem] bg-teal-600/10', delay: 4 },
  ]

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${b.className}`}
          animate={
            reduce
              ? undefined
              : {
                  x: [0, 30, -20, 0],
                  y: [0, -25, 20, 0],
                  opacity: [0.6, 1, 0.7, 0.6],
                }
          }
          transition={{
            duration: 18,
            delay: b.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
      {/* faint grid vignette for the terminal feel */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_40%,rgba(13,27,42,0.6))]" />
    </div>
  )
}
