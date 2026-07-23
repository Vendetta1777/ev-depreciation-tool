import { motion, useScroll, useSpring } from 'framer-motion'

/**
 * Thin teal bar at the very top that fills as you scroll the page.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const width = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })

  return (
    <motion.div
      style={{ scaleX: width }}
      className="fixed left-0 top-0 z-50 h-0.5 w-full origin-left bg-teal"
    />
  )
}
