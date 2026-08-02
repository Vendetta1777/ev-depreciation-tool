import { Link } from 'react-router-dom'

/**
 * /methodology — the single place every figure on the site traces back to.
 * Mirrors docs/methodology.md (the source-of-record). Sections carry ids so
 * citations elsewhere can deep-link here.
 *
 * Editorial theme, but tuned for dense prose: serif is used for HEADINGS ONLY;
 * all body copy is sans at a ~70ch measure.
 */

const STUDY_URL = 'https://www.iseecars.com/cars-that-hold-their-value-study'

function Section({ id, title, children }) {
  return (
    <section id={id} className="rule scroll-mt-24 border-t py-8 first:border-0 first:pt-0">
      <h2 className="mb-3 font-serif text-2xl text-ink sm:text-[1.75rem]">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-ink-muted sm:text-base">{children}</div>
    </section>
  )
}

const Term = ({ children }) => <span className="font-semibold text-ink">{children}</span>
const Pub = () => (
  <span className="rounded-sm bg-teal/12 px-1.5 py-0.5 text-xs font-medium tracking-wide text-teal-400">published</span>
)
const Der = () => (
  <span className="rounded-sm bg-warning/12 px-1.5 py-0.5 text-xs font-medium tracking-wide text-warning">derived</span>
)

const LIMITS = [
  {
    t: 'Average-mileage assumption',
    d: 'Curves assume ~12,000 mi/yr. There is no mileage adjustment to resale — no published source cleanly decomposes retention by mileage, so we don’t fabricate one.',
  },
  { t: 'Years 1–4 are modeled', d: 'Only year 5 is observed (see the curve-shape section above).' },
  { t: 'Asking price, not transaction', d: 'iSeeCars uses asking price, so retention is mildly optimistic.' },
  { t: '60-month lease term', d: 'A simplification — real leases are typically 24–36 months.' },
  { t: 'Spread & fees are your inputs', d: 'Residual spread and lease fees are assumptions, not sourced figures.' },
  { t: 'PHEVs unsupported', d: 'No PHEV curve, so plug-in hybrids are refused rather than approximated.' },
  {
    t: 'No electric-pickup figure',
    d: 'The EV figure derives from ~2020-era EVs, when no electric pickups existed — Lightning/Rivian/Cybertruck report “figures pending.”',
  },
  {
    t: 'One segment mixes datasets',
    d: 'The mid-band ICE sedan comes from iSeeCars’ per-model resale dataset (~15M vehicles), distinct from the annual study (~800k); its 45.6% depreciation is coincidentally equal to the overall figure and should not be conflated.',
  },
  { t: 'Coverage still growing', d: 'Empty buckets report “figures pending” rather than guessing.' },
]

export default function Methodology() {
  return (
    <div className="editorial">
      <div className="mx-auto max-w-2xl px-5 py-12 sm:px-6 sm:py-16">
        <header className="mb-8">
          <h1 className="font-serif text-4xl leading-none text-ink sm:text-5xl">Methodology</h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-muted sm:text-base">
            Two modes, both over five years: <Term>buy vs. lease</Term> one car, and{' '}
            <Term>EV vs. gas</Term> — which of two vehicles costs less to own. Both use published
            depreciation data — not a trained model — and every number traces back to this page.
          </p>
        </header>

        <Section id="sources" title="Where the retention curves come from">
          <p>
            All curves are anchored to the{' '}
            <a
              href={STUDY_URL}
              target="_blank"
              rel="noreferrer"
              className="text-teal underline decoration-dotted underline-offset-2 hover:text-teal-400"
            >
              iSeeCars 5-Year Depreciation Study, 2025 edition
            </a>
            . Each curve is a five-year <Term>retention</Term> series — the fraction of the original MSRP
            a vehicle is worth at the end of each year.
          </p>
        </Section>

        <Section id="observed-vs-modeled" title="Observed vs. modeled (curve shape)">
          <p>
            <Term>Year 5 is observed</Term> — it is the study’s reported five-year retention.{' '}
            <Term>Years 1–4 are modeled</Term>, not observed: a declining-balance shape with a documented{' '}
            <Term>20% drop in year one</Term>, then a constant annual rate, solved so the curve lands
            exactly on the observed year-5 value.
          </p>
        </Section>

        <Section id="published-vs-derived" title="Published vs. derived figures">
          <p>
            Every figure is tagged. <Pub /> means the retention is a segment average reported directly by
            the study. <Der /> means it is inferred by us from the study’s model lists — not a published
            segment average (e.g. a “mainstream sedan” built from the Civic/Corolla/Accord/Camry cluster).
          </p>
          <p className="text-ink">
            A figure computed from a derived row is always flagged in the interface — derived and published
            numbers never render the same way.
          </p>
        </Section>

        <Section id="matching" title="How a vehicle is matched to a curve">
          <p>Matching happens in order, and never silently falls back — the match level is always shown:</p>
          <ol className="ml-4 list-decimal space-y-1.5">
            <li>
              <Term>Exact</Term> — a named-model curve, when one exists and is filled.
            </li>
            <li>
              <Term>Segment</Term> — a fallback average for the vehicle’s powertrain × body × price band,
              with a visible note.
            </li>
            <li>
              <Term>Refuse</Term> — pre-2012 model years, commercial vehicles, or a body/segment we don’t
              cover. The tool says so rather than guessing.
            </li>
          </ol>
        </Section>

        <Section id="model" title="The buy-vs-lease model">
          <p>
            Five-year NPV, configurable discount rate. Buying pays MSRP (net of incentive) now and recovers
            the curve’s year-5 resale, discounted. Leasing pays monthly over the term.
          </p>
          <p>
            <Term>Operating costs</Term> (energy, insurance, maintenance, registration) are the same whether
            you buy or lease, so they <Term>cancel in the verdict</Term>. Because of that,{' '}
            <Term>fuel/energy price does not change the buy-vs-lease verdict</Term> (it does change total
            cost of ownership), and <Term>miles/year</Term> changes it only through the lease mileage cap
            and per-mile overage.
          </p>
        </Section>

        <Section id="fair-lease" title="A fair lease equals buying — by construction">
          <p className="rule border-l-2 border-teal/60 pl-4 text-ink">
            This is the most important thing to understand. If the lease is priced <Term>fairly</Term> —
            lender residual equals the market forecast, money factor equals your discount rate, no fees —
            then <Term>leasing and buying cost exactly the same</Term>. The present value of the lease
            payments reduces to <code className="rounded-sm bg-navy px-1 font-mono text-[0.85em]">price − PV(residual)</code>,
            which is the buy NPV. The depreciation curve alone can never make one side win.
          </p>
          <p>Real lease advantages come entirely from deviations from that fair baseline, exposed as inputs:</p>
          <ul className="ml-4 list-disc space-y-2">
            <li>
              <Term>Residual spread</Term> — the lender’s assumed residual minus the market forecast, as a
              fraction of MSRP. When a manufacturer <Term>subvents</Term> a lease (inflates the residual),
              the lessee pays depreciation down to an optimistic number and walks away — leasing wins. This
              is the real story behind “EVs favor leasing.”{' '}
              <Term>It is your assumption, not a sourced figure — its only honest default is 0.</Term>
            </li>
            <li>
              <Term>Money-factor markup</Term> — a lease APR above your discount rate makes leasing worse.
            </li>
            <li>
              <Term>Fees</Term> — an acquisition fee (default <Term>$895</Term>, typically ~$595–$1,095) and
              a disposition fee (default <Term>$395</Term>, typically ~$300–$500) tilt toward buying. Like
              the residual spread, <Term>these defaults are assumptions, not sourced figures</Term>; adjust
              them for your quote.
            </li>
            <li>
              <Term>Tax treatment</Term> — not modeled in v1.
            </li>
          </ul>
          <p className="rule border-l-2 border-border pl-4 text-ink">
            <Term>Why the default answer is “Buy.”</Term> At the fair default the financing sides are equal
            by construction, so the only thing separating them is the fees. The out-of-the-box verdict is
            therefore <Term>“Buy,” by roughly the fees, for essentially every car</Term> — that is a
            property of the fee assumptions, <Term>not a finding about the vehicle</Term>. A lease only wins
            once you raise the residual spread or otherwise tell the tool the deal deviates from fair.
          </p>
        </Section>

        <Section id="ev-vs-gas" title="The EV-vs-gas comparison">
          <p>
            The second mode compares the <Term>five-year total cost of ownership</Term> of two vehicles{' '}
            <Term>you choose</Term> — depreciation + energy + maintenance + insurance + registration −
            incentives — and names whichever costs less. It is not buy-vs-lease.
          </p>
          <ul className="ml-4 list-disc space-y-2">
            <li>
              <Term>You pick both vehicles.</Term> “Suggest an equivalent” offers an opposite-powertrain
              match by price, but that is a suggestion, not a claim the two are equivalent.
            </li>
            <li>
              <Term>Energy price is live.</Term> Gas drives the gas side and electricity the EV side, so
              either can flip the verdict; breakeven reports the value at which the winner changes.
            </li>
            <li>
              <Term>Incentives are state/local only.</Term> The federal EV tax credit expired September 30,
              2025, so the default is $0 — nothing hard-codes $7,500.
            </li>
            <li>
              <Term>Both sides need real figures.</Term> If either resolves to a pending curve, that side
              shows “figures pending” and there is no verdict.
            </li>
            <li>
              <Term>Provenance mix is flagged.</Term> Comparing an exact 2026 per-model row against a 2025
              segment average carries a vintage bias; when the two sides differ that way, the result says so.
            </li>
          </ul>
        </Section>

        {/* Limitations as a scannable term/definition table, not a bullet wall. */}
        <section id="limitations" className="rule scroll-mt-24 border-t py-8">
          <h2 className="mb-4 font-serif text-2xl text-ink sm:text-[1.75rem]">Known limitations</h2>
          <dl className="rule border-t">
            {LIMITS.map((l) => (
              <div key={l.t} className="rule grid gap-1 border-b py-3 sm:grid-cols-[13rem_1fr] sm:gap-5">
                <dt className="text-sm font-semibold text-ink">{l.t}</dt>
                <dd className="text-sm leading-relaxed text-ink-muted">{l.d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="rule mt-10 border-t pt-6">
          <Link to="/decide" className="text-sm font-medium text-teal hover:text-teal-400">
            ← Back to the buy-or-lease tool
          </Link>
        </div>
      </div>
    </div>
  )
}
