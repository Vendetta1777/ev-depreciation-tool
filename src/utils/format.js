/**
 * Small formatting helpers shared across the UI.
 */

export const usd = (n, opts = {}) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    ...opts,
  }).format(n)

export const pct = (fraction, digits = 1) =>
  `${(fraction * 100).toFixed(digits)}%`
