/**
 * HoloRings — Jarvis-style holographic rotating ring stack.
 * Multiple concentric rings at different speeds + directions,
 * with tick marks, arc gaps, and center glow dot.
 */

const C = 50 // SVG center coord

function ticks(radius, count, majorAt = [0, 90, 180, 270]) {
  return Array.from({ length: count }, (_, i) => {
    const angle  = (360 / count) * i
    const rad    = (angle - 90) * Math.PI / 180
    const isMaj  = majorAt.includes(Math.round(angle))
    const len    = isMaj ? 5.5 : 2
    return {
      isMaj,
      x1: C + (radius - len) * Math.cos(rad),
      y1: C + (radius - len) * Math.sin(rad),
      x2: C + radius        * Math.cos(rad),
      y2: C + radius        * Math.sin(rad),
    }
  })
}

function blipAt(radius, angle, color) {
  const rad = (angle - 90) * Math.PI / 180
  return { cx: C + radius * Math.cos(rad), cy: C + radius * Math.sin(rad), color }
}

export default function HoloRings({ size = 240, color = '#00C8FF', style = {}, pulse = false }) {
  const glow = `drop-shadow(0 0 6px ${color}cc) drop-shadow(0 0 14px ${color}55)`

  // Cardinal blips on ring 2
  const blips = [0, 180].map(a => blipAt(48, a, color))

  // Pulse animation wraps the whole component if enabled
  const pulseStyle = pulse ? {
    animation: 'holo-pulse 3.5s ease-in-out infinite',
  } : {}

  return (
    <div style={{
      position: 'relative', width: size, height: size,
      pointerEvents: 'none', userSelect: 'none',
      ...pulseStyle,
      ...style,
    }}>

      {/* ── Ring 1: Outer — slow CW, fine dash + 36 ticks ── */}
      <div style={{ position: 'absolute', inset: 0, animation: 'holo-spin-cw 28s linear infinite' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', filter: glow }}>
          <circle cx={C} cy={C} r={48} fill="none"
            stroke={color} strokeWidth="0.4" strokeOpacity="0.55" strokeDasharray="3 3" />
          {ticks(48, 36, [0, 90, 180, 270]).map((t, i) => (
            <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke={color}
              strokeWidth={t.isMaj ? 1.4 : 0.5}
              strokeOpacity={t.isMaj ? 1 : 0.45} />
          ))}
          {/* Cardinal labels */}
          {[
            { angle: 0,   label: 'N' },
            { angle: 90,  label: 'E' },
            { angle: 180, label: 'S' },
            { angle: 270, label: 'W' },
          ].map(({ angle, label }) => {
            const rad = (angle - 90) * Math.PI / 180
            return (
              <text key={label}
                x={C + 42 * Math.cos(rad)} y={C + 42 * Math.sin(rad)}
                fill={color} fillOpacity="0.65"
                fontSize="4" textAnchor="middle" dominantBaseline="middle"
                fontFamily="DM Mono, monospace" letterSpacing="0.1">
                {label}
              </text>
            )
          })}
        </svg>
      </div>

      {/* ── Ring 2: Middle-outer — CCW, segmented arcs ── */}
      <div style={{ position: 'absolute', inset: '10%', animation: 'holo-spin-ccw 17s linear infinite' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', filter: glow }}>
          <circle cx={C} cy={C} r={48} fill="none"
            stroke={color} strokeWidth="1" strokeOpacity="0.75"
            strokeDasharray="52 18 8 18" />
          {blips.map((b, i) => (
            <circle key={i} cx={b.cx} cy={b.cy} r={2.5} fill={b.color} fillOpacity="1" />
          ))}
        </svg>
      </div>

      {/* ── Ring 3: Middle-inner — CW med, chunky dash + triangle ticks ── */}
      <div style={{ position: 'absolute', inset: '22%', animation: 'holo-spin-cw 10s linear infinite' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', filter: glow }}>
          <circle cx={C} cy={C} r={48} fill="none"
            stroke={color} strokeWidth="1.2" strokeOpacity="0.85"
            strokeDasharray="16 8 4 8 16 8" />
          {/* Triangle notch ticks at 4 cardinal points */}
          {ticks(48, 4, [0, 90, 180, 270]).map((t, i) => {
            const dx = t.x2 - t.x1, dy = t.y2 - t.y1
            const nx = -dy * 0.06, ny = dx * 0.06
            return (
              <polygon key={i}
                points={`${t.x2},${t.y2} ${t.x1 + nx},${t.y1 + ny} ${t.x1 - nx},${t.y1 - ny}`}
                fill={color} fillOpacity="0.95" />
            )
          })}
        </svg>
      </div>

      {/* ── Ring 4: Inner — CCW fast, arc pair ── */}
      <div style={{ position: 'absolute', inset: '35%', animation: 'holo-spin-ccw 7s linear infinite' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', filter: glow }}>
          <circle cx={C} cy={C} r={48} fill="none"
            stroke={color} strokeWidth="2" strokeOpacity="0.9"
            strokeDasharray="28 72" />
          <circle cx={C} cy={C} r={48} fill="none"
            stroke={color} strokeWidth="0.6" strokeOpacity="0.5"
            strokeDasharray="28 72" strokeDashoffset="50" />
        </svg>
      </div>

      {/* ── Ring 5: Innermost — CW very fast, single thin line ── */}
      <div style={{ position: 'absolute', inset: '44%', animation: 'holo-spin-cw 4s linear infinite' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', filter: glow }}>
          <circle cx={C} cy={C} r={48} fill="none"
            stroke={color} strokeWidth="2.5" strokeOpacity="1"
            strokeDasharray="12 88" />
        </svg>
      </div>

      {/* ── Center — crosshair + glowing dot ── */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: size * 0.05, height: size * 0.05,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 8px ${color}, 0 0 24px ${color}cc, 0 0 48px ${color}66`,
      }} />
      {/* Crosshair lines */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: size * 0.18, height: 0.5, background: `linear-gradient(to right, transparent, ${color}80, transparent)` }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 0.5, height: size * 0.18, background: `linear-gradient(to bottom, transparent, ${color}80, transparent)` }} />
    </div>
  )
}
