import { useEffect, useRef } from 'react'

/**
 * Canvas particle network: teal/white nodes drifting over navy, with lines
 * drawn between nearby nodes (a light data-viz / neural-net feel). Sized to its
 * parent, pauses when the tab is hidden, and honors reduced-motion.
 */
export default function ParticleNetwork() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let nodes = []
    let raf = 0
    const LINK_DIST = 140

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.parentElement.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Node count scales with area, but stays light on phones so it never lags.
      const isMobile = window.innerWidth < 640
      const cap = isMobile ? 30 : 70
      const count = Math.min(cap, Math.round((width * height) / 22000))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.8,
        white: Math.random() > 0.75,
      }))
    }

    function step() {
      ctx.clearRect(0, 0, width, height)

      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > width) n.vx *= -1
        if (n.y < 0 || n.y > height) n.vy *= -1
      }

      // Links between nearby nodes.
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.hypot(dx, dy)
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.22
            ctx.strokeStyle = `rgba(0, 180, 216, ${alpha})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      // Nodes.
      for (const n of nodes) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = n.white ? 'rgba(230, 237, 245, 0.7)' : 'rgba(0, 180, 216, 0.7)'
        ctx.fill()
      }

      raf = requestAnimationFrame(step)
    }

    resize()
    if (reduce) {
      step() // draw a single static frame
      cancelAnimationFrame(raf)
    } else {
      raf = requestAnimationFrame(step)
    }
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(13,27,42,0.7))]" />
    </div>
  )
}
