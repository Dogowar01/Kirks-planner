import { useState, useEffect, useRef } from 'react'
import MatrixReveal from './MatrixReveal'
import HoloRings from './HoloRings'

const MATRIX_CHARS = '0123456789ABCDEF$%#@&!アイウエオカキクケコサシスセソタチツテト'

function MatrixRain() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()

    const fontSize = 18
    const cols = Math.floor(canvas.width / fontSize)
    // Stagger start times: some begin immediately, others are queued above the screen
    const drops = Array.from({ length: cols }, () => -(Math.random() * cols * 0.6))
    const RAIN_COLORS = ['230,255,0', '255,0,200', '255,255,255']
    const colColors = Array.from({ length: cols }, () => RAIN_COLORS[Math.floor(Math.random() * RAIN_COLORS.length)])

    const rgb = '210,50,255'
    // Each column tracks its own array of characters so they stay fixed as the drop falls
    const colChars = Array.from({ length: cols }, () => [])
    const colLen = Array.from({ length: cols }, () => Math.floor(8 + Math.random() * 12))

    let raf
    const draw = () => {
      // Full clear each frame — we redraw every character explicitly so nothing ghosts
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.font = `bold ${fontSize}px "DM Mono", monospace`

      for (let i = 0; i < drops.length; i++) {
        const head = Math.floor(drops[i])
        const len  = colLen[i]

        // Ensure column has enough characters
        while (colChars[i].length <= head + 2) {
          colChars[i].push(MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)])
        }
        // Randomly mutate a character in the column for the scramble effect
        if (Math.random() < 0.08 && colChars[i].length > 0) {
          const idx = Math.floor(Math.random() * colChars[i].length)
          colChars[i][idx] = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
        }

        // Draw the solid column from (head - len) to head
        for (let row = Math.max(0, head - len); row <= head; row++) {
          const y = row * fontSize
          if (y > canvas.height) break
          const ch = colChars[i][row] || MATRIX_CHARS[0]

          // Fade bottom of canvas out via alpha
          const canvasFade = Math.max(0, 1 - (y / canvas.height) * 1.15)
          // Lead char is white-hot; rest are plum with faint glow
          if (row === head) {
            ctx.shadowColor = `rgba(${rgb},1)`
            ctx.shadowBlur = 14
            ctx.fillStyle = `rgba(255,255,255,${canvasFade.toFixed(2)})`
          } else {
            ctx.shadowColor = `rgba(${rgb},0.8)`
            ctx.shadowBlur = 6
            ctx.fillStyle = `rgba(${rgb},${canvasFade.toFixed(2)})`
          }
          ctx.fillText(ch, i * fontSize, y)
        }
        ctx.shadowBlur = 0

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.97) {
          drops[i] = 0
          colChars[i] = []
          colLen[i] = Math.floor(8 + Math.random() * 12)
        } else {
          drops[i] += 0.22
        }
      }

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        opacity: 0.55, pointerEvents: 'none',
        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
      }}
    />
  )
}

const BOOT_SESSION_KEY = 's9_session_booted'

/**
 * BootScreen — full-screen Signal9 boot sequence.
 * Shows once per browser session (sessionStorage flag).
 * Calls onComplete() when done so the app can un-mount it.
 */
export default function BootScreen({ onComplete }) {
  const [phase, setPhase] = useState(0)
  // 0: dark  1: rings + wordmark  2: status  3: done-text  4: fade out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 150)
    const t2 = setTimeout(() => setPhase(2), 1600)
    const t3 = setTimeout(() => setPhase(3), 2500)
    const t4 = setTimeout(() => setPhase(4), 3500)
    const t5 = setTimeout(() => {
      sessionStorage.setItem(BOOT_SESSION_KEY, '1')
      onComplete()
    }, 4200)
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0A0908',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      opacity: phase === 4 ? 0 : 1,
      transition: 'opacity 0.7s cubic-bezier(0.4,0,0.6,1)',
      pointerEvents: phase === 4 ? 'none' : 'all',
    }}>

      {/* Matrix rain */}
      {phase >= 1 && <MatrixRain />}

      {/* Architectural grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(196,82,42,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(196,82,42,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 1.2s ease',
      }} />

      {/* Corner brackets */}
      {phase >= 1 && ['tl','tr','bl','br'].map(pos => {
        const isTop = pos[0] === 't', isLeft = pos[1] === 'l'
        return (
          <div key={pos} style={{
            position: 'absolute',
            [isTop ? 'top' : 'bottom']: 24,
            [isLeft ? 'left' : 'right']: 24,
            width: 28, height: 28,
            animation: 'phase-in 0.8s ease both',
          }}>
            <div style={{ position: 'absolute', [isTop ? 'top' : 'bottom']: 0, left: 0, right: 0, height: 1.5, background: 'rgba(0,212,255,0.7)', boxShadow: '0 0 6px rgba(0,212,255,0.8)' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, [isLeft ? 'left' : 'right']: 0, width: 1.5, background: 'rgba(0,212,255,0.7)', boxShadow: '0 0 6px rgba(0,212,255,0.8)' }} />
          </div>
        )
      })}

      {/* HoloRings — layered */}
      {phase >= 1 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <HoloRings color="#00D4FF" size={Math.min(window.innerWidth, 520)} style={{ opacity: 0.12, position: 'absolute', animation: 'phase-in 1.4s ease both' }} />
          <HoloRings color="#00D4FF" size={Math.min(window.innerWidth * 0.65, 340)} style={{ opacity: 0.09, position: 'absolute', animation: 'phase-in 1.6s ease 0.2s both' }} />
          <HoloRings color="#00D4FF" size={Math.min(window.innerWidth * 0.4, 210)} style={{ opacity: 0.07, position: 'absolute', animation: 'phase-in 1.8s ease 0.4s both' }} />
        </div>
      )}

      {/* Centre content */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: '0 24px' }}>

        {/* Wordmark */}
        {phase >= 1 && (
          <>
            <div style={{
              fontFamily: '"Share Tech Mono", monospace', fontSize: '0.75rem',
              letterSpacing: '0.45em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.55)', marginBottom: 14,
              animation: 'phase-in 0.7s ease both',
            }}>
              ■ &nbsp; S I G N A L 9 &nbsp; ■
            </div>
            <h1 style={{
              fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600,
              fontSize: 'clamp(4rem, 14vw, 7.5rem)',
              color: '#FFFFFF', margin: 0, lineHeight: 1,
              textShadow: '0 0 40px rgba(255,255,255,0.6), 0 0 80px rgba(196,82,42,0.3)',
            }}>
              <MatrixReveal text="Signal9" delay={0.2} duration={1100} color="#FFFFFF" />
            </h1>
            <p style={{
              fontFamily: '"Share Tech Mono", monospace', fontSize: '0.9rem',
              letterSpacing: '0.35em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)', marginTop: 14,
              animation: 'phase-in 0.9s ease 0.4s both',
            }}>Life Planner</p>
          </>
        )}

        {/* System status line */}
        {phase >= 2 && (
          <div style={{ marginTop: 32 }}>
            <p style={{
              fontFamily: '"Share Tech Mono", monospace', fontSize: '1rem',
              letterSpacing: '0.35em', textTransform: 'uppercase',
              color: 'rgba(0,200,255,0.9)',
              textShadow: '0 0 14px rgba(0,200,255,0.6)',
              animation: 'phase-in 0.5s ease both',
            }}>
              <MatrixReveal text="SYSTEM ONLINE" delay={0} duration={700} color="rgba(0,200,255,0.9)" />
            </p>
          </div>
        )}

        {/* Status lines */}
        {phase >= 3 && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
            {[
              { text: 'ALL MODULES LOADED', color: 'rgba(255,255,255,0.5)' },
              { text: 'DATA SYNC COMPLETE', color: 'rgba(255,255,255,0.4)' },
              { text: 'WELCOME BACK, KIRK', color: 'rgba(255,255,255,0.8)' },
            ].map(({ text, color }, i) => (
              <p key={text} style={{
                fontFamily: '"Share Tech Mono", monospace', fontSize: '0.75rem',
                letterSpacing: '0.2em', color,
                animation: `phase-in 0.4s ease ${i * 0.12}s both`,
              }}>{text}</p>
            ))}
          </div>
        )}
      </div>

      {/* Horizontal scan line */}
      {phase >= 1 && (
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent 0%, rgba(196,82,42,0.3) 10%, rgba(196,82,42,0.8) 30%, #C4522A 50%, rgba(196,82,42,0.8) 70%, rgba(196,82,42,0.3) 90%, transparent 100%)',
          animation: 'prismatic-scan 2.6s cubic-bezier(0.4,0,0.6,1) 1 forwards',
        }} />
      )}

      {/* Bottom system label */}
      {phase >= 2 && (
        <div style={{
          position: 'absolute', bottom: 28, left: 0, right: 0, textAlign: 'center',
          animation: 'phase-in 0.6s ease both',
        }}>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.38rem', letterSpacing: '0.2em', color: 'rgba(196,82,42,0.2)' }}>
            SIG9-OS v2.0 · SECURE BOOT · ENCRYPTED
          </p>
        </div>
      )}
    </div>
  )
}

export function shouldShowBoot() {
  return !sessionStorage.getItem(BOOT_SESSION_KEY)
}
