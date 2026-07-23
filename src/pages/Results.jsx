import { Navigate, useLocation, Link } from 'react-router-dom'
import { useMemo } from 'react'
import useProjection from '../hooks/useProjection'
import { buildSummaryText } from '../utils/summary'
import Confetti from '../components/Confetti'
import Section, { SectionHeader } from '../components/results/Section'
import HeroSummary from '../components/results/HeroSummary'
import QuickSummary from '../components/results/QuickSummary'
import WhatThisMeans from '../components/results/WhatThisMeans'
import ShareActions from '../components/results/ShareActions'
import MobileActionBar from '../components/results/MobileActionBar'
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

  const summaryText = useMemo(
    () => (vehicle && projection ? buildSummaryText(vehicle, projection) : ''),
    [vehicle, projection],
  )

  if (!vehicle || !projection) {
    return <Navigate to="/estimate" replace />
  }

  const { recommendation, tier, comparison, projectionTable, money } = projection
  const vehicleName = `${vehicle.make} ${vehicle.model}`
  const currentYear = Math.min(vehicle.age ?? 0, projectionTable.length - 1)

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-6 pb-28 pt-6 sm:space-y-14 sm:pb-16 sm:pt-8">
      <Confetti />

      {/* Always-visible back + share row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/estimate"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition hover:border-teal/60 hover:text-teal"
        >
          ← New calculation
        </Link>
        <ShareActions summaryText={summaryText} />
      </div>

      {/* 1 — Verdict */}
      <HeroSummary vehicle={vehicle} recommendation={recommendation} tier={tier} />

      {/* Scannable takeaways + plain-English explainer */}
      <div className="space-y-4">
        <QuickSummary vehicle={vehicle} projection={projection} />
        <WhatThisMeans vehicle={vehicle} projection={projection} />
      </div>

      {/* 2 — Buy vs lease (the answer people came for) */}
      <Section>
        <SectionHeader title="Buy or lease?" caption="The five-year money, side by side." />
        <BuyVsLease money={money} verdict={recommendation.verdict} />
      </Section>

      {/* 3 — Depreciation curve */}
      <Section>
        <SectionHeader
          title="How it holds up"
          caption="Your car against the average EV and gas car over ten years. Hover a year to see the dollars."
        />
        <DepreciationChart data={comparison} vehicleName={vehicleName} currentAge={currentYear} />
      </Section>

      {/* 4 — Value projection table */}
      <Section>
        <SectionHeader
          title="What it will be worth"
          caption={`Year by year, what your ${usdMsrp(vehicle.msrp)} ${vehicleName} is likely to sell for.`}
        />
        <ValueTable rows={projectionTable} currentYear={currentYear} />
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

      {/* Sticky bottom bar on phones */}
      <MobileActionBar summaryText={summaryText} />
    </div>
  )
}

function usdMsrp(n) {
  return `$${Number(n).toLocaleString()}`
}
