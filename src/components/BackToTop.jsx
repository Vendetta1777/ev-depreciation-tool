import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Floating button that appears after you scroll down a bit and jumps back to
 * the top when tapped.
 */
export default function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Show almost immediately on phones, later on desktop.
    const onScroll = () => {
      const threshold = window.innerWidth < 640 ? 120 : 500
      setShow(window.scrollY > threshold)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          whileHover={{ y: -3 }}
          className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-teal/40 bg-navy-800/90 text-teal shadow-xl backdrop-blur transition hover:border-teal sm:bottom-6 sm:right-6 sm:h-12 sm:w-12"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5" />
            <path d="M5 12l7-7 7 7" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
