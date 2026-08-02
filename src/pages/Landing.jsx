import { Link } from 'react-router-dom'

const HOW = [
  {
    title: 'Published curves',
    body: 'Five-year retention comes from published iSeeCars data — not a model we trained.',
  },
  {
    title: 'Every figure cited',
    body: 'Each number links to its source. Open the methodology any time.',
  },
  {
    title: 'Estimates labeled',
    body: 'Segment averages and derived figures are flagged, never dressed up as exact.',
  },
]

export default function Landing() {
  return (
    <div className="editorial">
      <section className="flex min-h-[calc(100vh-64px)] items-center">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="font-serif text-[2.75rem] leading-[1.08] text-ink sm:text-7xl">
            Buy, lease, or go gas?
            <br />
            See which costs less over five years.
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
            Pick your car and get a five-year cost verdict from published depreciation data — buy vs. lease,
            or EV vs. gas.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/decide"
              className="w-full rounded-sm bg-teal px-10 py-4 text-base font-semibold text-navy transition hover:bg-teal-400 sm:w-auto"
            >
              Buy or lease?
            </Link>
            <Link
              to="/compare"
              className="w-full rounded-sm border border-teal/40 px-10 py-4 text-base font-semibold text-ink transition hover:border-teal hover:text-teal sm:w-auto"
            >
              EV vs. gas?
            </Link>
          </div>

          <div className="mx-auto mt-20 grid max-w-2xl gap-8 text-left sm:grid-cols-3">
            {HOW.map((h) => (
              <div key={h.title}>
                <p className="text-sm font-semibold text-teal">{h.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{h.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-12 text-xs">
            <Link
              to="/methodology"
              className="text-teal underline decoration-dotted underline-offset-2 hover:text-teal-400"
            >
              How it works, in full →
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
