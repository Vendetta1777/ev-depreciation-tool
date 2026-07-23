import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { usd } from '../../utils/format'

const BUY_COLOR = '#00b4d8'
const LEASE_COLOR = '#f59e0b'

/**
 * Section 4 — buy vs lease cards + cumulative-cost bar chart.
 */
export default function BuyVsLease({ money, verdict }) {
  const buyWins = verdict === 'BUY'

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <ModeCard
          title="Buy"
          data={money.buy}
          winner={buyWins}
          accent={BUY_COLOR}
        />
        <ModeCard
          title="Lease"
          data={money.lease}
          winner={!buyWins}
          accent={LEASE_COLOR}
        />
      </div>

      <p className="text-xs text-ink-muted">
        The winner is decided by <span className="text-ink">net present value</span> —
        future dollars (including resale) are discounted to today. Nominal totals
        can point the other way, which is exactly what NPV is built to catch.
      </p>

      <div className="rounded-2xl border border-border bg-surface-raised/60 p-4 sm:p-6">
        <p className="mb-4 text-sm font-medium text-ink-muted">
          Cumulative cash spent by year
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={money.cumulative} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
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
              width={64}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              cursor={{ fill: 'rgba(29,60,95,0.3)' }}
              contentStyle={{
                background: '#11223a',
                border: '1px solid #1d3c5f',
                borderRadius: 8,
                color: '#e6edf5',
              }}
              formatter={(value, name) => [usd(value), name === 'buy' ? 'Buy' : 'Lease']}
              labelFormatter={(l) => `Year ${l}`}
            />
            <Legend
              formatter={(value) => (
                <span className="text-ink-muted">{value === 'buy' ? 'Buy' : 'Lease'}</span>
              )}
            />
            <Bar dataKey="buy" fill={BUY_COLOR} radius={[4, 4, 0, 0]} animationDuration={1200} />
            <Bar dataKey="lease" fill={LEASE_COLOR} radius={[4, 4, 0, 0]} animationDuration={1200} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ModeCard({ title, data, winner, accent }) {
  return (
    <div
      className={`rounded-2xl border p-6 transition ${
        winner
          ? 'border-teal/60 bg-navy-700 shadow-[0_0_30px_-8px_rgba(0,180,216,0.5)]'
          : 'border-border bg-surface-raised/50 opacity-80'
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        {winner && (
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold text-navy"
            style={{ background: accent }}
          >
            Recommended
          </span>
        )}
      </div>

      <dl className="mt-5 space-y-3">
        <Line label="Monthly cost" value={usd(data.monthly)} />
        <Line label="5-year cash outlay" value={usd(data.total)} />
        <Line
          label="Residual value recovered"
          value={data.residual ? usd(data.residual) : '—'}
        />
        <Line label="Net present value (NPV)" value={usd(data.npv)} strong />
      </dl>
    </div>
  )
}

function Line({ label, value, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className={`tabular ${strong ? 'text-lg font-bold text-ink' : 'font-medium text-ink'}`}>
        {value}
      </dd>
    </div>
  )
}
