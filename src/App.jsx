import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import NavBar from './components/NavBar'
import ScrollProgress from './components/ScrollProgress'
import BackToTop from './components/BackToTop'
import PageTransition from './components/PageTransition'
import Landing from './pages/Landing'
import Decide from './pages/Decide'
import About from './pages/About'

/**
 * Routes wrapped in AnimatePresence so each page fades and slides on change.
 */
function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/decide" element={<PageTransition><Decide /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        {/* Old /estimate and /results flow removed — one engine now. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollProgress />
      <div className="flex min-h-screen flex-col text-ink">
        <NavBar />
        <main className="flex-1">
          <AnimatedRoutes />
        </main>
      </div>
      <BackToTop />
    </BrowserRouter>
  )
}
