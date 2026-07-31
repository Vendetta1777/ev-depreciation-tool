import { Link } from 'react-router-dom'

/**
 * /methodology — the single place every figure on the site traces back to.
 * Mirrors docs/methodology.md (the source-of-record). Sections carry ids so
 * citations elsewhere can deep-link here.
 */

const STUDY_URL = 'https://www.iseecars.com/cars-that-hold-their-value-study'

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border py-8 first:border-0 first:pt-0">
      <h2 className="mb-3 text-xl font-bold text-ink sm:text-2xl">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-ink-muted sm:text-base">{children}</div>
    </section>
  )
}

const Term = ({ children }) => <span className="font-semibold text-ink">{children}</span>
const Pub = () => (
  <span className="rounded bg-teal/15 px-1.5 py-0.5 text-xs font-semibold text-teal-400">published</span>
)
const Der = () => (
  <span className="rounded bg-warning/15 px-1.5 py-0.5 text-xs font-semibold text-warning">derived</span>
)

export default function Methodology() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Methodology</h1>
        <p className="mt-2 text-sm text-ink-muted sm:text-base">
          This tool answers one question: for a specific car, is it cheaper to{' '}
          <Term>buy or lease</Term> over five years? It uses published depreciation data — not a
          trained model — and every number traces back to this page.
        </p>
        <p className="mt-3 rounded-lg border border-border bg-surface-raised/60 p-3 text-xs text-ink-muted">
          A second mode, <Term>EV vs. an equivalent gas car</Term> (where fuel price does swing the
          result), is planned for a later phase and is not live yet.
        </p>
      </header>

      <Section id="sources" title="Where the retention curves come from">
        <p>
          All curves are anchored to the{' '}
          <a href={STUDY_URL} target="_blank" rel="noreferrer" className="text-teal-400 underline decoration-dotted underline-offset-2 hover:text-teal">
            iSeeCars 5-Year Depreciation Study, 2025 edition
          </a>
          . Each curve is a five-year <Term>retention</Term> series — the fraction of the original
          MSRP a vehicle is worth at the end of each year.
        </p>
      </Section>

      <Section id="observed-vs-modeled" title="Observed vs. modeled (curve shape)">
        <p>
          <Term>Year 5 is observed</Term> — it is the study&rsquo;s reported five-year retention.
          <Term> Years 1–4 are modeled</Term>, not observed: a declining-balance shape with a
          documented <Term>20% drop in year one</Term>, then a constant annual rate, solved so the
          curve lands exactly on the observed year-5 value.
        </p>
      </Section>

      <Section id="published-vs-derived" title="Published vs. derived figures">
        <p>
          Every figure is tagged. <Pub /> means the retention is a segment average reported directly
          by the study. <Der /> means it is inferred by us from the study&rsquo;s model lists — not a
          published segment average (e.g. a &ldquo;mainstream sedan&rdquo; built from the
          Civic/Corolla/Accord/Camry cluster).
        </p>
        <p className="text-ink">
          A figure computed from a derived row is always flagged in the interface — derived and
          published numbers never render the same way.
        </p>
      </Section>

      <Section id="matching" title="How a vehicle is matched to a curve">
        <p>Matching happens in order, and never silently falls back — the match level is always shown:</p>
        <ol className="ml-4 list-decimal space-y-1.5">
          <li><Term>Exact</Term> — a named-model curve, when one exists and is filled.</li>
          <li>
            <Term>Segment</Term> — a fallback average for the vehicle&rsquo;s powertrain × body ×
            price band, with a visible note.
          </li>
          <li>
            <Term>Refuse</Term> — pre-2012 model years, commercial vehicles, or a body/segment we
            don&rsquo;t cover. The tool says so rather than guessing.
          </li>
        </ol>
      </Section>

      <Section id="model" title="The buy-vs-lease model">
        <p>
          Five-year NPV, configurable discount rate. Buying pays MSRP (net of incentive) now and
          recovers the curve&rsquo;s year-5 resale, discounted. Leasing pays monthly over the term.
        </p>
        <p>
          <Term>Operating costs</Term> (energy, insurance, maintenance, registration) are the same
          whether you buy or lease, so they <Term>cancel in the verdict</Term>. Because of that,{' '}
          <Term>fuel/energy price does not change the buy-vs-lease verdict</Term> (it does change
          total cost of ownership), and <Term>miles/year</Term> changes it only through the lease
          mileage cap and per-mile overage.
        </p>
      </Section>

      <Section id="fair-lease" title="A fair lease equals buying — by construction">
        <p className="rounded-lg border border-teal/25 bg-teal/5 p-3 text-ink">
          This is the most important thing to understand. If the lease is priced <Term>fairly</Term>
          {' '}— lender residual equals the market forecast, money factor equals your discount rate,
          no fees — then <Term>leasing and buying cost exactly the same</Term>. The present value of
          the lease payments reduces to <code className="rounded bg-navy px-1">price − PV(residual)</code>,
          which is the buy NPV. The depreciation curve alone can never make one side win.
        </p>
        <p>Real lease advantages come entirely from deviations from that fair baseline, exposed as inputs:</p>
        <ul className="ml-4 list-disc space-y-2">
          <li>
            <Term>Residual spread</Term> — the lender&rsquo;s assumed residual minus the market
            forecast, as a fraction of MSRP. When a manufacturer <Term>subvents</Term> a lease
            (inflates the residual), the lessee pays depreciation down to an optimistic number and
            walks away — leasing wins. This is the real story behind &ldquo;EVs favor leasing.&rdquo;{' '}
            <Term>It is your assumption, not a sourced figure — its only honest default is 0.</Term>
          </li>
          <li><Term>Money-factor markup</Term> — a lease APR above your discount rate makes leasing worse.</li>
          <li>
            <Term>Fees</Term> — an acquisition fee (default <Term>$895</Term>, typically ~$595–$1,095)
            and a disposition fee (default <Term>$395</Term>, typically ~$300–$500) tilt toward
            buying. Like the residual spread, <Term>these defaults are assumptions, not sourced
            figures</Term>; adjust them for your quote.
          </li>
          <li><Term>Tax treatment</Term> — not modeled in v1.</li>
        </ul>
        <p className="rounded-lg border border-border bg-surface-raised/60 p-3 text-ink">
          <Term>Why the default answer is &ldquo;Buy.&rdquo;</Term> At the fair default the financing
          sides are equal by construction, so the only thing separating them is the fees. The
          out-of-the-box verdict is therefore <Term>&ldquo;Buy,&rdquo; by roughly the fees, for
          essentially every car</Term> — that is a property of the fee assumptions,{' '}
          <Term>not a finding about the vehicle</Term>. A lease only wins once you raise the residual
          spread or otherwise tell the tool the deal deviates from fair.
        </p>
      </Section>

      <Section id="limitations" title="Known limitations">
        <ul className="ml-4 list-disc space-y-2">
          <li>
            Curves assume roughly average use (~12,000 mi/yr). There is <Term>no mileage adjustment
            to resale</Term> — no published source cleanly decomposes retention by mileage, so we
            don&rsquo;t fabricate one.
          </li>
          <li>Years 1–4 are modeled; only year 5 is observed.</li>
          <li>iSeeCars uses <Term>asking</Term> price, not transaction price — retention is mildly optimistic.</li>
          <li>The 60-month lease term is a simplification (real leases are typically 24–36 months).</li>
          <li>Residual spread and lease fees are <Term>user assumptions, not sourced figures</Term>.</li>
          <li><Term>PHEVs are unsupported</Term> — no PHEV curve, so plug-in hybrids are refused, not approximated.</li>
          <li>
            <Term>Electric pickups have no retention figure</Term> — the EV figure derives from
            ~2020-era EVs, when no electric pickups existed. Lightning/Rivian/Cybertruck report
            &ldquo;figures pending.&rdquo;
          </li>
          <li>
            One segment (mid-band ICE sedan) is sourced from iSeeCars&rsquo; per-model resale dataset
            (~15M vehicles), distinct from the annual study (~800k); its 45.6% depreciation is
            coincidentally equal to the annual overall figure and should not be conflated.
          </li>
          <li>Segment coverage is still growing; empty buckets report &ldquo;figures pending&rdquo; rather than guessing.</li>
        </ul>
      </Section>

      <div className="mt-10 border-t border-border pt-6">
        <Link to="/decide" className="text-sm font-semibold text-teal-400 hover:text-teal">
          ← Back to the buy-or-lease tool
        </Link>
      </div>
    </div>
  )
}
