/**
 * Plain-text results summary for the Share / Save buttons, plus small helpers
 * for the scannable takeaways on the results page.
 */
import { VALUE_RETENTION } from '../data/constants'
import { usd } from './format'

/** One-line read on how the car's retention stacks up against the averages. */
export function retentionComparison(retention5) {
  if (retention5 >= VALUE_RETENTION.ice) {
    return 'holds its value better than both the average EV and the average gas car'
  }
  if (retention5 >= VALUE_RETENTION.ev) {
    return 'holds its value better than the average EV, but a bit behind a gas car'
  }
  return 'holds its value worse than average, even next to other EVs'
}

/** The three scannable bullets shown at the top of the results. */
export function summaryBullets(vehicle, projection) {
  const { recommendation, tier, rate } = projection
  const name = `${vehicle.make} ${vehicle.model}`
  const leaseWins = recommendation.verdict === 'LEASE'
  return [
    `Your ${name} is losing about ${usd(rate.perDay)} a day right now.`,
    `${leaseWins ? 'Leasing' : 'Buying'} saves you around ${usd(recommendation.advantage)} over 5 years.`,
    `It ${retentionComparison(tier.retention5)}.`,
  ]
}

/** Full plain-text summary for clipboard and the downloadable file. */
export function buildSummaryText(vehicle, projection) {
  const { recommendation, tier, money, rate, projectionTable } = projection
  const name = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
  const verb = recommendation.verdict === 'LEASE' ? 'Leasing' : 'Buying'

  const rows = projectionTable
    .map((r) => `  Year ${r.year}: ${usd(r.value)} (${r.retention}%)`)
    .join('\n')

  return `EV DEPRECIATION TOOL
${name}

VERDICT: ${recommendation.verdict} IT
${verb} saves about ${usd(recommendation.advantage)} over 5 years.

Quick facts
- Losing about ${usd(rate.perDay)} a day (~${usd(rate.perMonth)} a month) right now
- ${cap(retentionComparison(tier.retention5))}
- 5-year value retention: ${(tier.retention5 * 100).toFixed(1)}% (${tier.label})

Buy vs lease (5-year, in today's dollars)
- Buy: ${usd(money.buy.npv)}
- Lease: ${usd(money.lease.npv)}

Projected resale value
${rows}

Built on real data from 15,000 cars. ev-depreciation-tool.vercel.app`
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Copy text to the clipboard, resolving true on success. */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older or restricted contexts: a hidden textarea + execCommand.
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}

/** Trigger a .txt download of the summary. */
export function downloadText(text, filename = 'ev-summary.txt') {
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
