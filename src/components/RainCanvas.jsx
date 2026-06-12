import { useEffect, useRef } from 'react'

/**
 * RainCanvas — fullscreen canvas rain effect.
 *
 * Props:
 *  opacity    — overall rain opacity 0–1 (default 0.55)
 *  intensity  — drops per frame added (default 2)
 *  windAngle  — degrees from vertical, positive = right (default 12)
 *  color      — drop streak colour (default '#C4522A')
 *  zIndex     — CSS z-index (default 1)
 */
export default function RainCanvas({
  opacity   = 0.55,
  intensity = 2,
  windAngle = 12,
  color     = '#C4522A',
  zIndex    = 1,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    let rafId
    const drops  = []
    const ripples = []

    function resize() {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const rad = (windAngle * Math.PI) / 180

    // Spawn a single raindrop with randomised depth layer
    function spawnDrop() {
      const depth  = 0.2 + Math.random() * 0.8   // 0.2 = far, 1 = close
      const speed  = 8 + depth * 18               // far drops slower
      const len    = 6 + depth * 22               // far drops shorter
      const thick  = 0.4 + depth * 1.2
      const alpha  = 0.12 + depth * 0.55

      drops.push({
        x: Math.random() * canvas.width * 1.3 - canvas.width * 0.15,
        y: -len - Math.random() * canvas.height,
        speed, len, thick, alpha, depth,
      })
    }

    // Spawn initial field
    for (let i = 0; i < 180; i++) spawnDrop()

    function spawnRipple(x, y, depth) {
      ripples.push({ x, y, r: 0, maxR: 6 + depth * 12, alpha: 0.25 + depth * 0.3, depth })
    }

    function hexToRgb(hex) {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `${r},${g},${b}`
    }
    const rgb = hexToRgb(color)

    function draw() {
      const w = canvas.width, h = canvas.height

      ctx.clearRect(0, 0, w, h)

      // ── Add new drops each frame ──────────────────────────────────────────
      for (let i = 0; i < intensity; i++) spawnDrop()

      // ── Draw & update drops ───────────────────────────────────────────────
      const sx = Math.sin(rad)
      const sy = Math.cos(rad)

      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]
        d.x += d.speed * sx
        d.y += d.speed * sy

        // Streak
        ctx.save()
        ctx.globalAlpha = d.alpha * opacity
        ctx.strokeStyle = `rgba(${rgb},1)`
        ctx.lineWidth   = d.thick
        ctx.lineCap     = 'round'

        // Gradient streak — brighter at top, fading at tail
        const gx1 = d.x - sx * d.len
        const gy1 = d.y - sy * d.len
        const grad = ctx.createLinearGradient(gx1, gy1, d.x, d.y)
        grad.addColorStop(0, `rgba(${rgb},0)`)
        grad.addColorStop(0.5, `rgba(${rgb},0.6)`)
        grad.addColorStop(1, `rgba(255,255,255,${d.depth * 0.35})`)
        ctx.strokeStyle = grad

        ctx.beginPath()
        ctx.moveTo(gx1, gy1)
        ctx.lineTo(d.x, d.y)
        ctx.stroke()
        ctx.restore()

        // Hit ground — spawn ripple, recycle drop
        if (d.y - d.len > h) {
          if (d.depth > 0.45) spawnRipple(d.x, h - 2, d.depth)
          drops.splice(i, 1)
        }
      }

      // ── Draw & update ripples ─────────────────────────────────────────────
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i]
        rp.r     += 0.55 + rp.depth * 0.8
        rp.alpha -= 0.018

        if (rp.alpha <= 0) { ripples.splice(i, 1); continue }

        // Elliptical ripple — foreshortened for ground perspective
        ctx.save()
        ctx.globalAlpha  = rp.alpha * opacity
        ctx.strokeStyle  = `rgba(${rgb},1)`
        ctx.lineWidth    = 0.6 + rp.depth * 0.4

        ctx.beginPath()
        ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.28, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafId)
    }
  }, [opacity, intensity, windAngle, color])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex, pointerEvents: 'none' }}
    />
  )
}
