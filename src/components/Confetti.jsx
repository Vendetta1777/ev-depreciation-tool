import { useEffect, useRef } from 'react'

/**
 * One-shot confetti burst. Fires a spray of teal/white/green particles from the
 * top-center, lets gravity pull them down, then stops and cleans up. Skipped
 * for reduced-motion.
 */
export default function Confetti({ count = 130 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = (canvas.width = window.innerWidth * dpr)
    const h = (canvas.height = window.innerHeight * dpr)
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `${window.innerHeight}px`

    const colors = ['#00b4d8', '#38cdf0', '#e6edf5', '#34d399']
    const originX = w / 2
    const parts = Array.from({ length: count }, () => {
      const angle = (Math.random() * Math.PI) / 1.1 - Math.PI / 2.2
      const speed = (Math.random() * 9 + 6) * dpr
      return {
        x: originX,
        y: h * 0.12,
        vx: Math.sin(angle) * speed,
        vy: Math.cos(angle) * speed - 4 * dpr,
        size: (Math.random() * 6 + 3) * dpr,
        color: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        life: 1,
      }
    })

    let raf = 0
    let frames = 0
    const gravity = 0.32 * dpr

    function step() {
      ctx.clearRect(0, 0, w, h)
      frames++
      let alive = false
      for (const p of parts) {
        p.vy += gravity
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        if (frames > 60) p.life -= 0.012
        if (p.life > 0 && p.y < h + 20) {
          alive = true
          ctx.save()
          ctx.globalAlpha = Math.max(0, p.life)
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot)
          ctx.fillStyle = p.color
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
          ctx.restore()
        }
      }
      if (alive && frames < 260) {
        raf = requestAnimationFrame(step)
      } else {
        ctx.clearRect(0, 0, w, h)
      }
    }
    raf = requestAnimationFrame(step)

    return () => cancelAnimationFrame(raf)
  }, [count])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30"
    />
  )
}
