# Methodology

This tool answers one question: **for a specific car, is it cheaper to buy it or
lease it over five years?** It uses published depreciation data — not a trained
model — and every number on the site traces back to this page.

> A second mode, **EV vs. an equivalent gas car** (where fuel price *does* swing
> the result), is planned as a later phase and is **not** live yet.

## Where the retention curves come from

All curves are anchored to the **iSeeCars 5-Year Depreciation Study, 2025 edition**
(<https://www.iseecars.com/cars-that-hold-their-value-study>).

Each curve is a 5-year **retention** series — the fraction of the original MSRP a
vehicle is expected to be worth at the end of each year. Curves live in
`public/data/curves.json` and are validated by `npm run validate:curves`.

### Observed vs. modeled (curve shape)

**Every** row — named model and segment alike — uses the same shape, recorded in
`shape_assumption`: only the **5-year** retention is observed; years 1–4 follow a
declining-balance curve (a documented 20% year-one drop, then a constant rate)
solved to land exactly on the 5-year value.

Named-model 5-year figures come from the iSeeCars **per-model** resale pages
(~15M-vehicle dataset, 2026); segment figures come from the annual 5-Year study
(2025). Both are asking-price based.

#### Why not a two-point (3-year + 5-year) fit?

The per-model pages also publish a 3-year figure, and we tried anchoring each
named curve to both the 3- and 5-year points. **We rejected it**, and the reason
is worth stating because it is a genuine data-quality finding, not a coding
choice.

iSeeCars&rsquo; 3-year and 5-year numbers are **cross-sectional cohorts** —
different model years priced at one moment — not two points along a single
vehicle&rsquo;s life. Fitting a curve through both implies depreciation that
**accelerates** with age: a Honda Civic would lose ~2.2%/yr in years 1–3 then
~9%/yr in years 4–5; a RAV4 ~1.9% then ~10.9%. That inverts the well-established
front-loaded shape (biggest drop in year one). The distortion is an artifact of
the cohorts, not the vehicles: 3-year-old **ICE** cars (2023 model years) carry
chip-shortage-era MSRP inflation, and 3-year-old **EVs** carry the 2023
price-cut and credit-expiry shock — both inflate the *new-price* baseline the
3-year depreciation is measured against. So we keep only the 5-year anchor and
the modeled shape for every row.

### Published vs. derived figures

Each row is tagged with `evidence`:

- **`published`** — the retention figure is a segment average reported directly
  by the study (e.g. the Truck segment).
- **`derived`** — the figure is *inferred* by us from the study's model lists,
  **not** a published segment average (e.g. "mainstream sedan" built from the
  Civic/Corolla/Accord/Camry cluster). The `source_note` says so.

**The UI never renders a derived figure the same as a published one** — anything
computed from a derived row is flagged so you can see it.

### iSeeCars uses asking price, not transaction price

iSeeCars compares MSRP to used-car **asking** prices, not final **transaction**
prices. Asking prices run a bit above what cars actually sell for, so retention
here is **mildly optimistic** (resale slightly overstated).

## How a vehicle is matched to a curve

`resolveCurve` matches in this order and **never silently falls back** — the match
level is always shown:

1. **Exact** — a named-model curve, when one exists and is filled.
2. **Segment** — a fallback average for the vehicle's
   powertrain × body class × price band, with a visible note
   ("No <model> curve available — using the <segment> average").
3. **Refuse** — pre-2012 model years, commercial vehicles, or a body/segment we
   don't cover. The tool says so rather than guessing.

## The buy-vs-lease model (`finance.ts`)

- **5-year NPV**, configurable discount rate. Buying pays MSRP (net of incentive)
  now and recovers the curve's year-5 resale, discounted. Leasing pays monthly
  over the term.
- **Lease**: residual comes from the same curve; cap cost is net of incentive
  (the EV lease "loophole"); money factor ≈ discount rate ÷ 24.
- **Operating costs** (energy, insurance, maintenance, registration) are the same
  whether you buy or lease, so they **cancel in the verdict**. Consequently
  **fuel/energy price does not change the buy-vs-lease verdict** (it does change
  total cost of ownership). **Miles/year** changes the verdict only through the
  **lease mileage cap + per-mile overage**.

### A fair lease equals buying — by construction

This is the most important thing to understand. If the lease is priced *fairly* —
the lender's assumed residual equals the market forecast, the money factor equals
your discount rate, and there are no fees — then **leasing and buying cost exactly
the same**. It falls straight out of the math: the present value of the lease
payments reduces to `price − PV(residual)`, which *is* the buy NPV. The
depreciation curve alone can never make one side win.

Real lease advantages come entirely from **deviations** from that fair baseline,
which the tool exposes as inputs:

- **Residual spread** — the lender's assumed residual *minus* the market forecast,
  as a fraction of MSRP. When a manufacturer **subvents** a lease (inflates the
  residual to move metal), the lessee pays depreciation down to an optimistic
  number and walks away — leasing wins. This is the real story behind
  "EVs favor leasing." **It is a user assumption, not a sourced figure — its only
  honest default is 0** (a fair-value lease). Nothing on this site derives it for
  you.
- **Money-factor markup** — a lease APR above your discount rate makes leasing
  worse.
- **Fees** — an acquisition fee (default **$895**, typically ~$595–$1,095) and a
  disposition fee (default **$395**, typically ~$300–$500) tilt toward buying.
  Like the residual spread, **these defaults are assumptions, not sourced
  figures** — real fees vary by lender and vehicle; adjust them for your quote.
- **Tax treatment** — not modeled in v1.

**Why the default answer is "Buy."** At the fair default (residual spread 0,
money factor = discount rate) the financing sides are equal by construction, so
the *only* thing left separating them is the fees. That means the tool's
out-of-the-box verdict is **"Buy," by roughly the fees, for essentially every
car** — this is a property of the fee assumptions, **not a finding about the
vehicle**. A lease only wins once you tell the tool the lender is subventing the
residual (raise the spread) or otherwise deviating from a fair deal.

## Known limitations

- **Curves assume roughly average use (~12,000 mi/yr).** There is **no mileage
  adjustment to resale** — no published source cleanly decomposes retention by
  annual mileage, so we don't fabricate one. High- or low-mileage cars will
  deviate from the shown resale.
- **Years 1–4 are modeled, only year 5 is observed** (see curve shape above).
- **3-year figures exist but aren't usable for curve shape.** The source pages
  publish a 3-year number, but it is a different model-year cohort, not a second
  point on one car's curve (see "Why not a two-point fit?"). We don't use it.
- **Exact vs. fallback can differ by dataset vintage.** An exact named match uses
  the 2026 per-model dataset; a segment fallback uses the 2025 annual study. Two
  otherwise-similar cars can differ by a few points purely from that vintage gap,
  not from the vehicles.
- **Some models are listed under one powertrain.** iSeeCars reports the Camry as
  hybrid-only (true of the 2025+ Camry), so the named Camry curve is the hybrid;
  it does not represent older gas Camrys. This is noted on the row's citation.
- **Asking price, not transaction price** — retention is mildly optimistic.
- **The 60-month lease term is a simplification.** Real leases are typically
  24–36 months; we model a 5-year lease so it lines up with the 5-year buy
  horizon. The term is configurable (`leaseTermMonths`) but non-60 values are not
  yet fully apples-to-apples with buy-and-keep.
- **PHEVs are unsupported** — there is no PHEV segment curve, so plug-in hybrids
  are refused rather than approximated with the wrong powertrain.
- **Electric pickups have no retention figure.** The EV segment figure derives
  from ~5-year-old EVs (2020 models) — an era with **no electric pickups** — so
  it describes cars and SUVs only and says nothing about the
  Lightning/Rivian/Cybertruck. Rather than show a plausible-but-wrong number, EV
  trucks report **"figures pending."**
- **One segment mixes datasets.** The mid-band ICE sedan curve
  (`seg-ice-sedan-mid`) comes from iSeeCars' **per-model resale dataset**
  (~15M vehicles), which is distinct from the annual 5-Year Depreciation Study
  (~800k) used everywhere else. This is recorded on that row's citation; its
  45.6% depreciation is *coincidentally* equal to the annual study's overall
  figure and should not be conflated with it.
- **Segment coverage is still growing.** Curves fall back to a
  powertrain × body × price-band average; a handful of buckets remain empty and
  report "figures pending" rather than guessing.
