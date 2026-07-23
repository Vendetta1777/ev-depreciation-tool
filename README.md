# EV Depreciation Tool

A platform for personalized electric-vehicle financial projections: depreciation
curves, 5-year resale-value estimates, and a **buy-vs-lease NPV recommendation**.

The projection logic is grounded in an IEEE research paper that analyzed **15,000
vehicles** using Random Forest and XGBoost models.

## Key findings baked into the logic

- EVs depreciate **~3.6 pp/yr faster** than comparable ICE vehicles.
- 5-year value retention — EV: **30.3%**, ICE: **33.9%**, Tesla: **41.4%**,
  Budget EVs (<$35k): **17.9%**, Luxury EVs (>$50k): **35.6%**.
- Top depreciation drivers — Vehicle Age (**40.3%**), Model Year (**35.4%**),
  MSRP (**21%**).
- NPV over 5 years at a **7%** discount rate.
- Lease rate — EV **1.2%** of MSRP/mo, ICE **1.5%**/mo.
- Maintenance — EV **~$500/yr**, ICE **~$1,200/yr**.
- Energy — EV **~$0.04/mi**, ICE **~$0.12/mi**.

All of the above live in [`src/data/constants.js`](src/data/constants.js) as the
single source of truth.

## Tech stack

- **Frontend:** React + Vite + Tailwind CSS v4
- **Charts:** Recharts · **Animation:** Framer Motion · **Routing:** React Router
- **HTTP:** axios
- **Backend (later phase):** FastAPI (Python) for the heavy calculations
- **Deploy:** Vercel (frontend)

## Design direction

Dark, premium, data-forward — deep navy (`#0D1B2A`) with electric-teal
(`#00B4D8`) accents. Bloomberg Terminal meets a modern fintech app: large bold
numbers, smooth chart animations, clear recommendation callouts.

## Project structure

```
src/
  components/   reusable UI (NavBar, cards, charts…)
  pages/        Landing · InputForm (/estimate) · Results (/results) · About
  hooks/        useProjection — projection state
  utils/        projections + formatting helpers
  data/         constants.js — research-derived source of truth
```

## Getting started

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Roadmap

- **Phase 1 ✅** — project scaffold, routing, design tokens, research constants.
- **Phase 2** — input form, projection engine, results dashboard with charts.
- Later — FastAPI backend, richer methodology page, sharing.
