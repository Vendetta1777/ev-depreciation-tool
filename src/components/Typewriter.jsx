import { useEffect, useState } from 'react'

/**
 * Typewriter that cycles through phrases: types one out, holds, deletes, moves
 * to the next. A blinking caret follows the text.
 */
export default function Typewriter({
  phrases,
  typeSpeed = 55,
  deleteSpeed = 28,
  hold = 1600,
  className = '',
}) {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [phase, setPhase] = useState('typing') // typing | holding | deleting

  useEffect(() => {
    const full = phrases[index]
    let t

    if (phase === 'typing') {
      if (text.length < full.length) {
        t = setTimeout(() => setText(full.slice(0, text.length + 1)), typeSpeed)
      } else {
        t = setTimeout(() => setPhase('deleting'), hold)
      }
    } else if (phase === 'deleting') {
      if (text.length > 0) {
        t = setTimeout(() => setText(full.slice(0, text.length - 1)), deleteSpeed)
      } else {
        setPhase('typing')
        setIndex((i) => (i + 1) % phrases.length)
      }
    }

    return () => clearTimeout(t)
  }, [text, phase, index, phrases, typeSpeed, deleteSpeed, hold])

  return (
    <span className={className}>
      {text}
      <span className="ml-0.5 inline-block w-[3px] animate-pulse bg-teal align-middle" style={{ height: '0.9em' }} />
    </span>
  )
}
