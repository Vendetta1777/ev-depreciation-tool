<div align="center">

# ⚡ EV Depreciation Tool

**Five-year cost comparisons built on published depreciation data. Buy vs. lease one car, or EV vs. an equivalent gas car — every figure cited, estimates labeled as estimates.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-ev--depreciation--tool.vercel.app-00B4D8?style=for-the-badge)](https://ev-depreciation-tool.vercel.app)

[**🚀 Live**](https://ev-depreciation-tool.vercel.app) · [**Buy or lease**](https://ev-depreciation-tool.vercel.app/decide) · [**EV vs. gas**](https://ev-depreciation-tool.vercel.app/compare) · [**Methodology**](https://ev-depreciation-tool.vercel.app/methodology)

</div>

---

## Overview

Depreciation is the biggest cost of owning a car, and it changes the math on two everyday decisions. This tool answers both over a five-year horizon:

- **Buy vs. lease** a specific car — a present-value comparison where the real lever is the lender's residual assumption, not the depreciation curve.
- **EV vs. gas** — which of two vehicles you choose costs less to own, total.

There is **no trained model and no private dataset**. Retention comes from published five-year figures (iSeeCars), and every number on a result links to its source.

## How it works

- **Curves** (`public/data/curves.json`) — 30 five-year retention curves: exact named-model rows plus powertrain × body × price-band segment fallbacks. Each row is tagged `published` or `derived`, carries a `source_url`, and is checked by `npm run validate:curves`.
- **Resolution** (`src/lib/curves.js`) — `resolveCurve` matches a vehicle exactly where a named curve exists, falls back to its segment otherwise, and **refuses** (never guesses) for pre-2012 or unclassifiable vehicles.
- **Finance** (`src/lib/finance.ts`) — pure engine: buy-vs-lease NPV, 5-year TCO, breakeven, and the EV-vs-gas comparison. Provenance travels with every result, so the UI never renders a derived figure like a published one.
- **Picker** (`src/lib/catalog.js`) — fuzzy free-text search over the ~24k-row Phase 0 catalog (MiniSearch), plus a model-year input.
- **Methodology** (`/methodology`, from `docs/methodology.md`) — where every figure traces, what's observed vs. modeled, and the tool's limitations.

## Tech stack

- **Framework:** React 19 + Vite · **Styling:** Tailwind CSS v4 (navy/teal tokens)
- **Charts:** Recharts · **Animation:** Framer Motion · **Routing:** React Router · **Search:** MiniSearch
- **Deploy:** Vercel (SPA rewrites for client-side routing)

## Project structure

```
src/
  lib/          curves.js · finance.ts · catalog.js   (engine + data access)
  components/    NavBar · VehicleCombobox / VehicleSelect · uiBits · landing/ParticleNetwork
  pages/         Landing · Decide (/decide) · Compare (/compare) · Methodology · About
  data/          curveVehicles.js   (quick-pick chips)
public/data/     curves.json (+ schema) · catalog.json
scripts/         validate-curves.mjs
tests/           node --test — finance · resolveCurve · catalog
docs/            methodology.md   (source of record)
```

## Getting started

```bash
npm install
npm run dev              # local dev server
npm run build            # production build → dist/
npm test                 # unit tests (node --test)
npm run validate:curves  # validate the curve data
```

## Author

Built by **Ved Shrinivas**.
