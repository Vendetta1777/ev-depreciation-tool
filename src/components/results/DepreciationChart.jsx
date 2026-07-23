import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import { usd } from '../../utils/format'

const COLORS = {
  vehicle: '#00b4d8', // teal, their vehicle
  evAvg: '#f87171', // red, EV average
  iceAvg: '#34d399', // green, ICE average
}

function CustomTooltip({ active, payload, label, vehicleName, compact }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  return (
    <div className="rounded-lg border border-border bg-navy-800/95 px-3 py-2.5 text-sm shadow-xl backdrop-blur">
      <p className="mb-2 font-semibold text-ink">Year {label}</p>
      <div className="tabular space-y-1">
        <Row
          color={COLORS.vehicle}
          label={compact ? 'Yours' : vehicleName}
          value={`${row.vehicle}%`}
          extra={compact ? null : usd(row.vehicleValue)}
        />
        <Row color={COLORS.evAvg} label={compact ? 'EV avg' : 'EV average'} value={`${row.evAvg}%`} />
        <Row color={COLORS.iceAvg} label={compact ? 'Gas avg' : 'ICE average'} value={`${row.iceAvg}%`} />
      </div>
    </div>
  )
}

function Row({ color, label, value, extra }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="text-ink-muted">{label}</span>
      <span className="ml-auto font-medium text-ink">{value}</span>
      {extra && <span className="text-ink-muted">· {extra}</span>}
    </div>
  )
}

/**
 * Section 2 — retention curves over 10 years for the vehicle vs EV/ICE averages,
 * with a "you are here" marker at the car's current age.
 */
export default function DepreciationChart({ data, vehicleName, currentAge = 0 }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  const tickSize = isMobile ? 10 : 12
  return (
    <div className="rounded-2xl border border-border bg-surface-raised/60 p-3 sm:p-6">
      <ResponsiveContainer width="100%" height={isMobile ? 300 : 360}>
        <LineChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 12 }}>
          <CartesianGrid stroke="#1d3c5f" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="year"
            stroke="#8ba0b8"
            tickLine={false}
            tick={{ fontSize: tickSize, fill: '#8ba0b8' }}
            axisLine={{ stroke: '#1d3c5f' }}
            label={{ value: isMobile ? 'Years' : 'Years from new', position: 'insideBottom', offset: -8, fill: '#8ba0b8', fontSize: tickSize }}
          />
          <YAxis
            stroke="#8ba0b8"
            tickLine={false}
            axisLine={false}
            width={isMobile ? 40 : 52}
            tick={{ fontSize: tickSize, fill: '#8ba0b8' }}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            label={isMobile ? undefined : { value: 'Value kept', angle: -90, position: 'insideLeft', offset: 12, fill: '#8ba0b8', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip vehicleName={vehicleName} compact={isMobile} />} />
          <Legend
            wrapperStyle={{ paddingTop: 12 }}
            formatter={(value) => <span className="text-ink-muted">{value}</span>}
          />
          {currentAge > 0 && currentAge <= 9 && (
            <ReferenceLine
              x={currentAge}
              stroke="#e6edf5"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              label={{ value: 'You are here', position: 'top', fill: '#e6edf5', fontSize: 11 }}
            />
          )}
          <Line type="monotone" dataKey="vehicle" name={vehicleName} stroke={COLORS.vehicle} strokeWidth={3} dot={false} activeDot={{ r: 5 }} animationDuration={1500} />
          <Line type="monotone" dataKey="evAvg" name="EV average" stroke={COLORS.evAvg} strokeWidth={2} strokeDasharray="5 4" dot={false} animationDuration={1500} animationBegin={200} />
          <Line type="monotone" dataKey="iceAvg" name="ICE average" stroke={COLORS.iceAvg} strokeWidth={2} strokeDasharray="5 4" dot={false} animationDuration={1500} animationBegin={400} />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-3 text-center text-xs text-ink-muted">
        Each line is the share of the original price a car still fetches, year by year.
      </p>
    </div>
  )
}
