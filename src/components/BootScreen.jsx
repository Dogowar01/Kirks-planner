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

    const fontSize = 14
    const cols = Math.floor(canvas.width / fontSize)
    const drops = Array.from({ length: cols }, () => Math.random() * -50)

    let raf
    const draw = () => {
      // Fade trail
      ctx.fillStyle = 'rgba(10,9,8,0.18)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < drops.length; i++) {
        const ch = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
        const y  = drops[i] * fontSize
        // Vertical gradient: bright near top of drop, fades toward bottom of canvas
        const alpha = Math.max(0, 1 - (y / canvas.height) * 1.1)
        // Lead character is brighter
        ctx.fillStyle = `rgba(196,82,42,${(alpha * 0.9).toFixed(2)})`
        ctx.font = `${fontSize}px "DM Mono", monospace`
        ctx.fillText(ch, i * fontSize, y)

        // Trail chars slightly dimmer
        if (drops[i] > 1) {
          const ty = (drops[i] - 1) * fontSize
          const ta = Math.max(0, 1 - (ty / canvas.height) * 1.1) * 0.3
          ctx.fillStyle = `rgba(196,82,42,${ta.toFixed(2)})`
          ctx.fillText(MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)], i * fontSize, ty)
        }

        if (y > canvas.height && Math.random() > 0.97) drops[i] = 0
        else drops[i] += 0.4
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
            <div style={{ position: 'absolute', [isTop ? 'top' : 'bottom']: 0, left: 0, right: 0, height: 1.5, background: 'rgba(196,82,42,0.5)' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, [isLeft ? 'left' : 'right']: 0, width: 1.5, background: 'rgba(196,82,42,0.5)' }} />
          </div>
        )
      })}

      {/* HoloRings — layered */}
      {phase >= 1 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <HoloRings color="#C4522A" size={Math.min(window.innerWidth, 520)} style={{ opacity: 0.28, position: 'absolute', animation: 'phase-in 1.4s ease both' }} />
          <HoloRings color="#00C8FF" size={Math.min(window.innerWidth * 0.65, 340)} style={{ opacity: 0.18, position: 'absolute', animation: 'phase-in 1.6s ease 0.2s both' }} />
          <HoloRings color="#8B5CF6" size={Math.min(window.innerWidth * 0.4, 210)} style={{ opacity: 0.14, position: 'absolute', animation: 'phase-in 1.8s ease 0.4s both' }} />
        </div>
      )}

      {/* Centre content */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: '0 24px' }}>

        {/* Wordmark */}
        {phase >= 1 && (
          <>
            <div style={{
              fontFamily: '"DM Mono", monospace', fontSize: '0.5rem',
              letterSpacing: '0.5em', textTransform: 'uppercase',
              color: 'rgba(196,82,42,0.5)', marginBottom: 10,
              animation: 'phase-in 0.7s ease both',
            }}>
              ■ &nbsp; S I G N A L 9 &nbsp; ■
            </div>
            <h1 style={{
              fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600,
              fontSize: 'clamp(2.8rem, 10vw, 5.5rem)',
              color: '#C4522A', margin: 0, lineHeight: 1,
              textShadow: '0 0 60px rgba(196,82,42,0.4), 0 0 120px rgba(196,82,42,0.15)',
            }}>
              <MatrixReveal text="Signal9" delay={0.2} duration={1100} color="#C4522A" />
            </h1>
            <p style={{
              fontFamily: '"DM Mono", monospace', fontSize: '0.55rem',
              letterSpacing: '0.3em', textTransform: 'uppercase',
              color: 'rgba(196,174,154,0.45)', marginTop: 10,
              animation: 'phase-in 0.9s ease 0.4s both',
            }}>Life Planner</p>
          </>
        )}

        {/* System status line */}
        {phase >= 2 && (
          <div style={{ marginTop: 32 }}>
            <p style={{
              fontFamily: '"DM Mono", monospace', fontSize: '0.62rem',
              letterSpacing: '0.35em', textTransform: 'uppercase',
              color: 'rgba(0,200,255,0.75)',
              textShadow: '0 0 14px rgba(0,200,255,0.5)',
              animation: 'phase-in 0.5s ease both',
            }}>
              <MatrixReveal text="SYSTEM ONLINE" delay={0} duration={700} color="rgba(0,200,255,0.8)" />
            </p>
          </div>
        )}

        {/* Status lines */}
        {phase >= 3 && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
            {[
              { text: 'ALL MODULES LOADED', color: 'rgba(196,82,42,0.45)' },
              { text: 'DATA SYNC COMPLETE', color: 'rgba(196,82,42,0.35)' },
              { text: 'WELCOME BACK, KIRK', color: 'rgba(196,82,42,0.55)' },
            ].map(({ text, color }, i) => (
              <p key={text} style={{
                fontFamily: '"DM Mono", monospace', fontSize: '0.4rem',
                letterSpacing: '0.22em', color,
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
