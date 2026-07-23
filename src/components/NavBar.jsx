import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/estimate', label: 'Calculator' },
  { to: '/about', label: 'About' },
]

const linkClass = ({ isActive }) =>
  isActive ? 'text-teal' : 'text-ink-muted transition hover:text-ink'

/**
 * Sticky top navigation. Gains a blurred backdrop once the page is scrolled,
 * collapses to a slide-open menu on mobile, and highlights the active route.
 */
export default function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu whenever the route changes.
  useEffect(() => setOpen(false), [pathname])

  return (
    <header
      className={`sticky top-0 z-20 border-b transition-colors ${
        scrolled ? 'border-border bg-navy/80 backdrop-blur' : 'border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <NavLink to="/" className="flex items-center gap-2 font-bold text-ink">
          <span className="text-teal">◆</span> EV Depreciation Tool
        </NavLink>

        {/* Desktop links */}
        <ul className="hidden items-center gap-8 text-sm sm:flex">
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.end} className={linkClass}>
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-ink sm:hidden"
        >
          <div className="relative h-4 w-6">
            <motion.span
              animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="absolute left-0 top-0 h-0.5 w-6 bg-current"
            />
            <motion.span
              animate={open ? { opacity: 0 } : { opacity: 1 }}
              className="absolute left-0 top-[7px] h-0.5 w-6 bg-current"
            />
            <motion.span
              animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="absolute bottom-0 left-0 h-0.5 w-6 bg-current"
            />
          </div>
        </button>
      </nav>

      {/* Mobile slide-open menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden border-t border-border bg-navy/95 backdrop-blur sm:hidden"
          >
            <ul className="flex flex-col gap-1 px-6 py-4">
              {LINKS.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-3 ${
                        isActive ? 'bg-teal/10 text-teal' : 'text-ink-muted hover:text-ink'
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
