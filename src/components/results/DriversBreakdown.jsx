import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts'
import { ALL_DRIVERS } from '../../data/constants'

/**
 * Section 5 — what's driving THIS vehicle's depreciation. Horizontal bar chart
 * of the research feature importances, plus a plain-language note on the top
 * factor for the specific vehicle.
 */
export default function DriversBreakdown({ vehicle }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  const SHORT = { 'Vehicle Age': 'Age', 'Model Year': 'Year', MSRP: 'Price', Make: 'Make', 'Fuel Type': 'Fuel' }
  const data = ALL_DRIVERS.map((d) => ({
    label: isMobile ? SHORT[d.label] ?? d.label : d.label,
    importance: +(d.importance * 100).toFixed(1),
  }))
  const top = data[0]

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="rounded-2xl border border-border bg-surface-raised/60 p-3 sm:p-6 lg:col-span-3">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 40, left: 4, bottom: 4 }}
          >
            <XAxis type="number" domain={[0, 50]} hide />
            <YAxis
              type="category"
              dataKey="label"
              stroke="#8ba0b8"
              tickLine={false}
              axisLine={false}
              width={isMobile ? 44 : 92}
              tick={{ fontSize: isMobile ? 11 : 12, fill: '#8ba0b8' }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(29,60,95,0.3)' }}
              contentStyle={{
                background: '#11223a',
                border: '1px solid #1d3c5f',
                borderRadius: 8,
                color: '#e6edf5',
              }}
              formatter={(value) => [`${value}%`, 'Importance']}
            />
            <Bar dataKey="importance" radius={[0, 6, 6, 0]} animationDuration={1100} label={{ position: 'right', fill: '#8ba0b8', fontSize: 12, formatter: (v) => `${v}%` }}>
              {data.map((_, i) => (
                <Cell key={i} fill={i === 0 ? '#00b4d8' : '#1d6a86'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="mt-2 text-center text-xs text-ink-muted">
          Longer bars are the things that move a car's value the most.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface-raised/60 p-6 lg:col-span-2">
        <p className="text-sm font-medium uppercase tracking-widest text-teal">
          Top factor · {top.label}
        </p>
        <p className="mt-3 text-ink-muted">
          <span className="font-semibold text-ink">{top.label}</span> alone explains{' '}
          <span className="font-semibold text-ink">{top.importance}%</span> of how a car
          loses value. Your {vehicle.make} {vehicle.model} is{' '}
          <span className="font-semibold text-ink">
            {vehicle.age} {vehicle.age === 1 ? 'year' : 'years'} old
          </span>
          {vehicle.age <= 1
            ? ', and those first couple of years are when EVs drop the fastest. The steep part is still ahead.'
            : ', so a lot of the age-related drop has already happened. The curve gets flatter from here.'}
        </p>
      </div>
    </div>
  )
}
