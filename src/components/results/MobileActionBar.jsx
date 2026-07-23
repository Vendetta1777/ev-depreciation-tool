import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { copyToClipboard } from '../../utils/summary'

/**
 * Sticky bottom bar for phones: start over or share, without scrolling back up.
 * Hidden on sm+ where the navbar and inline buttons already cover it.
 */
export default function MobileActionBar({ summaryText }) {
  const navigate = useNavigate()
  const [shared, setShared] = useState(false)

  async function onShare() {
    const ok = await copyToClipboard(summaryText)
    setShared(ok ? 'Copied to clipboard' : 'Copy failed')
    setTimeout(() => setShared(false), 1800)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-navy/95 backdrop-blur sm:hidden">
      <div className="flex gap-3 px-4 py-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <button
          type="button"
          onClick={() => navigate('/estimate')}
          className="flex-1 rounded-lg border border-border py-3 text-sm font-semibold text-ink"
        >
          New calculation
        </button>
        <button
          type="button"
          onClick={onShare}
          className="flex-1 rounded-lg bg-teal py-3 text-sm font-semibold text-navy"
        >
          {shared || 'Share results'}
        </button>
      </div>
    </div>
  )
}
