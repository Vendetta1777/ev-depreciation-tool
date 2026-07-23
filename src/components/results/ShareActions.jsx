import { useState } from 'react'
import { copyToClipboard, downloadText } from '../../utils/summary'

const CopyIcon = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
)
const SaveIcon = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3v12" />
    <path d="M7 10l5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
)

/**
 * Copy-summary and save-summary buttons. Copy drops a text summary on the
 * clipboard; save downloads it as a .txt file. Both show quick confirmation.
 */
export default function ShareActions({ summaryText }) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  async function onCopy() {
    const ok = await copyToClipboard(summaryText)
    setCopied(ok ? 'Copied!' : 'Try again')
    setTimeout(() => setCopied(false), 1800)
  }

  function onSave() {
    downloadText(summaryText)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const base =
    'flex min-h-[44px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition'

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onCopy}
        className={`${base} border-teal/50 text-teal hover:bg-teal/10`}
      >
        <CopyIcon />
        {copied || 'Copy summary'}
      </button>
      <button
        type="button"
        onClick={onSave}
        className={`${base} border-border text-ink hover:border-teal/60 hover:text-teal`}
      >
        <SaveIcon />
        {saved ? 'Saved!' : 'Save summary'}
      </button>
    </div>
  )
}
