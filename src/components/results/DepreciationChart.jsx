import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { usd } from '../../utils/format'

const COLORS = {
  vehicle: '#00b4d8', // teal — their vehicle
  evAvg: '#f87171', // red — EV average
  iceAvg: '#34d399', // green — ICE average
}

function CustomTooltip({ active, payload, label, vehicleName }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  return (
    <div className="rounded-lg border border-border bg-navy-800/95 px-4 py-3 text-sm shadow-xl backdrop-blur">
      <p className="mb-2 font-semibold text-ink">Year {label}</p>
      <div className="tabular space-y-1">
        <Row color={COLORS.vehicle} label={vehicleName} value={`${row.vehicle}%`} extra={usd(row.vehicleValue)} />
        <Row color={COLORS.evAvg} label="EV average" value={`${row.evAvg}%`} />
        <Row color={COLORS.iceAvg} label="ICE average" value={`${row.iceAvg}%`} />
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
 * Section 2 — retention curves over 10 years for the vehicle vs EV/ICE averages.
 */
export default function DepreciationChart({ data, vehicleName }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised/60 p-4 sm:p-6">
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="#1d3c5f" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="year"
            stroke="#8ba0b8"
            tickLine={false}
            axisLine={{ stroke: '#1d3c5f' }}
            label={{ value: 'Years', position: 'insideBottom', offset: -2, fill: '#8ba0b8', fontSize: 12 }}
          />
          <YAxis
            stroke="#8ba0b8"
            tickLine={false}
            axisLine={false}
            width={44}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip vehicleName={vehicleName} />} />
          <Legend
            wrapperStyle={{ paddingTop: 12 }}
            formatter={(value) => <span className="text-ink-muted">{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="vehicle"
            name={vehicleName}
            stroke={COLORS.vehicle}
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5 }}
            animationDuration={1500}
          />
          <Line
            type="monotone"
            dataKey="evAvg"
            name="EV average"
            stroke={COLORS.evAvg}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            animationDuration={1500}
            animationBegin={200}
          />
          <Line
            type="monotone"
            dataKey="iceAvg"
            name="ICE average"
            stroke={COLORS.iceAvg}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            animationDuration={1500}
            animationBegin={400}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
