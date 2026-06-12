import { useRef, useState } from 'react'

/**
 * 3D floating card with mouse-tracked perspective tilt, depth shadows,
 * specular highlight, and a glowing bottom edge.
 *
 * Props:
 *  color      — accent hex for shadows, rim glow, specular
 *  onClick    — click handler
 *  style      — outer wrapper overrides (width, display, etc.)
 *  animDelay  — entrance animation delay in seconds
 *  children   — card inner content (you handle bg, padding, layout)
 */
export default function FloatCard3D({ color, children, onClick, style = {}, animDelay = 0 }) {
  const ref = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0, hover: false })

  const onMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    const nx = (e.clientX - rect.left) / rect.width  * 2 - 1  // -1 → +1
    const ny = (e.clientY - rect.top)  / rect.height * 2 - 1
    setTilt({ x: ny * -10, y: nx * 12, hover: true })
  }
  const onMouseLeave = () => setTilt({ x: 0, y: 0, hover: false })

  const depth = tilt.hover ? 24 : 10
  const lift  = tilt.hover ? -14 : -5

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onTouchStart={() => setTilt(t => ({ ...t, hover: true }))}
      onTouchEnd={onMouseLeave}
      style={{
        ...style,
        cursor: 'pointer',
        border: 'none',
        padding: 0,
        background: 'none',
        perspective: '700px',
        animation: `phase-in 0.7s cubic-bezier(0.22,1,0.36,1) ${animDelay}s both`,
        transition: 'filter 0.2s',
        filter: tilt.hover ? `drop-shadow(0 0 18px ${color}55)` : 'none',
      }}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        transformStyle: 'preserve-3d',
        transform: `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${lift}px)`,
        transition: tilt.hover ? 'transform 0.08s ease-out' : 'transform 0.45s cubic-bezier(0.22,1,0.36,1)',
        borderRadius: 16,
        boxShadow: [
          `0 ${depth}px ${depth * 2}px rgba(0,0,0,0.65)`,
          `0 ${depth / 2}px ${depth}px rgba(0,0,0,0.45)`,
          `0 2px 4px rgba(0,0,0,0.4)`,
          `0 0 0 0.5px ${color}30`,
          `inset 0 1px 0 ${color}25`,
          `inset 0 -1px 0 rgba(0,0,0,0.4)`,
        ].join(', '),
      }}>
        {/* Specular highlight — shifts with tilt */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 16, zIndex: 10, pointerEvents: 'none',
          background: `radial-gradient(ellipse 60% 40% at ${50 + tilt.y * 2.5}% ${20 - tilt.x * 2}%, ${color}18 0%, transparent 70%)`,
          transition: tilt.hover ? 'background 0.08s' : 'background 0.45s',
        }} />
        {/* Bottom edge thickness — simulates card depth */}
        <div style={{
          position: 'absolute', bottom: -4, left: 4, right: 4, height: 8,
          borderRadius: '0 0 14px 14px', zIndex: -1,
          background: `linear-gradient(to bottom, ${color}20, rgba(0,0,0,0.6))`,
          filter: 'blur(3px)',
        }} />
        {children}
      </div>
    </button>
  )
}
