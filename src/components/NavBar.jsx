import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/estimate', label: 'Estimate' },
  { to: '/results', label: 'Results' },
  { to: '/about', label: 'About' },
]

/**
 * Top navigation. Active route gets the teal accent.
 */
export default function NavBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-navy/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <NavLink to="/" className="flex items-center gap-2 font-bold text-ink">
          <span className="text-teal">◆</span> EV Depreciation Tool
        </NavLink>
        <ul className="flex items-center gap-6 text-sm">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  isActive ? 'text-teal' : 'text-ink-muted transition hover:text-ink'
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
