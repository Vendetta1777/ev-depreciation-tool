import { Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import useProjection from '../hooks/useProjection'
import { usd } from '../utils/format'
import Confetti from '../components/Confetti'
import Section, { SectionHeader } from '../components/results/Section'
import HeroSummary from '../components/results/HeroSummary'
import DepreciationChart from '../components/results/DepreciationChart'
import ValueTable from '../components/results/ValueTable'
import BuyVsLease from '../components/results/BuyVsLease'
import DriversBreakdown from '../components/results/DriversBreakdown'
import BottomCTA from '../components/results/BottomCTA'

/**
 * Results dashboard. Reads the vehicle from router state; sends you back to the
 * form if there is nothing to show (a direct visit or a refresh).
 */
export default function Results() {
  const { state } = useLocation()
  const vehicle = state?.vehicle
  const projection = useProjection(vehicle)

  if (!vehicle || !projection) {
    return <Navigate to="/estimate" replace />
  }

  const { recommendation, tier, comparison, projectionTable, money, rate } = projection
  const vehicleName = `${vehicle.make} ${vehicle.model}`
  const currentYear = Math.min(vehicle.age ?? 0, projectionTable.length - 1)

  return (
    <div className="mx-auto max-w-5xl space-y-14 px-6 py-12 sm:py-16">
      {/* Celebration on load */}
      <Confetti />

      {/* 1 — Verdict */}
      <HeroSummary vehicle={vehicle} recommendation={recommendation} tier={tier} />

      {/* Losing-value callout */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border bg-surface-raised/60 p-6 text-center sm:p-8"
      >
        <p className="text-sm uppercase tracking-widest text-ink-muted">
          Right now this car is losing about
        </p>
        <p className="tabular mt-2 text-4xl font-extrabold text-negative sm:text-5xl">
          {usd(rate.perDay)} <span className="text-2xl font-bold text-ink-muted">a day</span>
        </p>
        <p className="mt-1 text-ink-muted">
          That is roughly <span className="font-semibold text-ink">{usd(rate.perMonth)}</span> a
          month in its first year.
        </p>
      </motion.div>

      {/* 2 — Depreciation curve */}
      <Section>
        <SectionHeader
          title="How it holds up"
          caption="Your car against the average EV and gas car over ten years. Hover a year to see the dollars."
        />
        <DepreciationChart data={comparison} vehicleName={vehicleName} />
      </Section>

      {/* 3 — Value projection table */}
      <Section>
        <SectionHeader
          title="What it will be worth"
          caption={`Year by year, what your ${usdMsrp(vehicle.msrp)} ${vehicleName} is likely to sell for.`}
        />
        <ValueTable rows={projectionTable} currentYear={currentYear} />
      </Section>

      {/* 4 — Buy vs lease */}
      <Section>
        <SectionHeader title="Buy or lease?" caption="The five-year money, side by side." />
        <BuyVsLease money={money} verdict={recommendation.verdict} />
      </Section>

      {/* 5 — Depreciation drivers */}
      <Section>
        <SectionHeader
          title="What is dragging it down"
          caption="Which factors the models weigh most when they predict value."
        />
        <DriversBreakdown vehicle={vehicle} />
      </Section>

      {/* 6 — CTA */}
      <Section>
        <BottomCTA />
      </Section>
    </div>
  )
}

function usdMsrp(n) {
  return `$${Number(n).toLocaleString()}`
}
