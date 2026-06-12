import { useEffect, useRef } from 'react'

// Recursive midpoint displacement — returns array of [x1,y1,x2,y2] segments
function buildBolt(x1, y1, x2, y2, spread, depth, maxDepth, segments = [], branches = []) {
  if (depth >= maxDepth) {
    segments.push([x1, y1, x2, y2, depth])
    return
  }

  const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * spread
  const my = (y1 + y2) / 2 + (Math.random() - 0.5) * spread * 0.5

  buildBolt(x1, y1, mx, my, spread * 0.58, depth + 1, maxDepth, segments, branches)
  buildBolt(mx, my, x2, y2, spread * 0.58, depth + 1, maxDepth, segments, branches)

  // Spawn a branch with decreasing probability at deeper levels
  if (depth <= maxDepth - 3 && Math.random() < 0.38) {
    const angle = Math.atan2(y2 - y1, x2 - x1) + (Math.random() - 0.5) * 1.1
    const len   = Math.hypot(x2 - x1, y2 - y1) * (0.3 + Math.random() * 0.35)
    const bx    = mx + Math.cos(angle) * len
    const by    = my + Math.sin(angle) * len
    buildBolt(mx, my, bx, by, spread * 0.45, depth + 2, maxDepth, branches, [])
  }
}

function randomStart(w, h) {
  // Bias toward top and sides for natural sky-to-ground feel
  const r = Math.random()
  if (r < 0.55) {
    // Top edge
    return { x: w * (0.15 + Math.random() * 0.7), y: 0 }
  } else if (r < 0.75) {
    // Left edge, upper half
    return { x: 0, y: h * Math.random() * 0.45 }
  } else {
    // Right edge, upper half
    return { x: w, y: h * Math.random() * 0.45 }
  }
}

function randomEnd(x1, y1, w, h) {
  // End somewhere in the lower 40–90% of the screen
  return {
    x: w * (0.05 + Math.random() * 0.9),
    y: h * (0.4 + Math.random() * 0.5),
  }
}

/**
 * LightningCanvas — ambient background lightning effect.
 *
 * Props:
 *  color      — hex glow colour (e.g. '#00C8FF')
 *  opacity    — peak brightness 0–1 (default 0.55)
 *  minDelay   — ms between strikes minimum (default 1800)
 *  maxDelay   — ms between strikes maximum (default 4500)
 *  zIndex     — CSS z-index (default 2)
 */
export default function LightningCanvas({
  color    = '#00C8FF',
  opacity  = 0.55,
  minDelay = 1800,
  maxDelay = 4500,
  zIndex   = 2,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    let rafId, timerA, timerB

    function resize() {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function drawSegments(segs, alpha, lineWidth, blur) {
      ctx.save()
      ctx.shadowBlur  = blur
      ctx.shadowColor = color
      ctx.strokeStyle = color
      ctx.globalAlpha = alpha
      ctx.lineWidth   = lineWidth
      ctx.lineCap     = 'round'
      ctx.lineJoin    = 'round'
      segs.forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      })
      ctx.restore()
    }

    function drawWhiteCore(segs, alpha, lineWidth) {
      ctx.save()
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`
      ctx.lineWidth   = lineWidth
      ctx.lineCap     = 'round'
      ctx.lineJoin    = 'round'
      ctx.globalAlpha = 1
      segs.forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      })
      ctx.restore()
    }

    function strike(doubleStrike = false) {
      const w = canvas.width, h = canvas.height
      const spread = Math.min(w, h) * 0.18

      const { x: x1, y: y1 } = randomStart(w, h)
      const { x: x2, y: y2 } = randomEnd(x1, y1, w, h)

      const main = [], branches = []
      buildBolt(x1, y1, x2, y2, spread, 0, 7, main, branches)
      const all = [...main, ...branches]

      // Flash frames: [mainAlpha, branchAlpha, lineWidth, glowBlur, whiteCoreAlpha, delay]
      const seq = [
        [opacity,        opacity * 0.6,  2.2, 38, 0.9,  0  ],
        [opacity * 0.85, opacity * 0.5,  1.6, 26, 0.65, 55 ],
        [opacity * 0.55, opacity * 0.3,  1.1, 16, 0.35, 90 ],
        [opacity * 0.25, opacity * 0.12, 0.7,  8, 0.1, 130 ],
        [0,              0,              0,    0, 0,   180 ],
      ]

      let frameIdx = 0
      function nextFrame() {
        if (frameIdx >= seq.length) {
          ctx.clearRect(0, 0, w, h)
          if (doubleStrike && Math.random() < 0.45) {
            // Same bolt re-lights briefly ~200ms later
            timerB = setTimeout(() => strike(false), 180 + Math.random() * 120)
          } else {
            schedule()
          }
          return
        }
        const [ma, ba, lw, blur, wc, delay] = seq[frameIdx]
        frameIdx++

        ctx.clearRect(0, 0, w, h)
        // Wide outer glow
        drawSegments(all,    ma,  lw + 2.5, blur * 1.4)
        // Tighter inner glow
        drawSegments(main,   ma,  lw + 0.8, blur * 0.7)
        drawSegments(branches, ba, lw * 0.6, blur * 0.5)
        // Bright white hot core
        drawWhiteCore(main, wc * opacity, lw * 0.45)

        timerA = setTimeout(() => { rafId = requestAnimationFrame(nextFrame) }, delay)
      }
      rafId = requestAnimationFrame(nextFrame)
    }

    function schedule() {
      const delay = minDelay + Math.random() * (maxDelay - minDelay)
      timerA = setTimeout(() => strike(Math.random() < 0.3), delay)
    }

    // Stagger first strike slightly
    timerA = setTimeout(() => strike(false), 600 + Math.random() * 1400)

    return () => {
      window.removeEventListener('resize', resize)
      clearTimeout(timerA)
      clearTimeout(timerB)
      cancelAnimationFrame(rafId)
    }
  }, [color, opacity, minDelay, maxDelay])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex, pointerEvents: 'none' }}
    />
  )
}
