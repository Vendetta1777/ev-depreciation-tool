import { Navigate, useLocation } from 'react-router-dom'
import useProjection from '../hooks/useProjection'
import Section, { SectionHeader } from '../components/results/Section'
import HeroSummary from '../components/results/HeroSummary'
import DepreciationChart from '../components/results/DepreciationChart'
import ValueTable from '../components/results/ValueTable'
import BuyVsLease from '../components/results/BuyVsLease'
import DriversBreakdown from '../components/results/DriversBreakdown'
import BottomCTA from '../components/results/BottomCTA'

/**
 * Results dashboard. Receives the vehicle via router state; redirects to the
 * form if there's nothing to show (e.g. a direct visit or refresh).
 */
export default function Results() {
  const { state } = useLocation()
  const vehicle = state?.vehicle
  const projection = useProjection(vehicle)

  if (!vehicle || !projection) {
    return <Navigate to="/estimate" replace />
  }

  const { recommendation, tier, comparison, projectionTable, money } = projection
  const vehicleName = `${vehicle.make} ${vehicle.model}`
  const currentYear = Math.min(vehicle.age ?? 0, projectionTable.length - 1)

  return (
    <div className="mx-auto max-w-5xl space-y-14 px-6 py-12 sm:py-16">
      {/* 1 — Hero verdict */}
      <HeroSummary vehicle={vehicle} recommendation={recommendation} tier={tier} />

      {/* 2 — Depreciation curve */}
      <Section>
        <SectionHeader
          title="Depreciation curve"
          caption="Value retained over 10 years vs the EV and ICE averages. Hover any year for the dollar value."
        />
        <DepreciationChart data={comparison} vehicleName={vehicleName} />
      </Section>

      {/* 3 — Value projection table */}
      <Section>
        <SectionHeader
          title="5-year value projection"
          caption={`Projected resale value of your ${usdMsrp(vehicle.msrp)} ${vehicleName}.`}
        />
        <ValueTable rows={projectionTable} currentYear={currentYear} />
      </Section>

      {/* 4 — Buy vs lease */}
      <Section>
        <SectionHeader
          title="Buy vs lease breakdown"
          caption="Five-year economics side by side, with cumulative cost over time."
        />
        <BuyVsLease money={money} verdict={recommendation.verdict} />
      </Section>

      {/* 5 — Depreciation drivers */}
      <Section>
        <SectionHeader
          title="What's driving depreciation"
          caption="Feature importances from the Random Forest / XGBoost models."
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
