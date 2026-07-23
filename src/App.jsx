import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import NavBar from './components/NavBar'
import ScrollProgress from './components/ScrollProgress'
import BackToTop from './components/BackToTop'
import PageTransition from './components/PageTransition'
import Landing from './pages/Landing'
import InputForm from './pages/InputForm'
import Results from './pages/Results'
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
        <Route path="/estimate" element={<PageTransition><InputForm /></PageTransition>} />
        <Route path="/results" element={<PageTransition><Results /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
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
