import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import Landing from './pages/Landing'
import InputForm from './pages/InputForm'
import Results from './pages/Results'
import About from './pages/About'

/**
 * App shell + routing.
 * Routes:
 *   /          → Landing
 *   /estimate  → Input form
 *   /results   → Results dashboard
 *   /about     → About / methodology
 */
export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-navy text-ink">
        <NavBar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/estimate" element={<InputForm />} />
            <Route path="/results" element={<Results />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
