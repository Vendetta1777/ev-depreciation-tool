import { motion } from 'framer-motion'

/**
 * Wraps a route's content and fades + slides it up on entry. Paired with
 * AnimatePresence keyed on the location in App.
 */
export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
