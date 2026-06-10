import HoloRings from './HoloRings'

export default function SectionShell({ accent, bgImage, children, className = '' }) {
  return (
    <div
      className={className}
      style={{
        minHeight: '100%',
        position: 'relative',
        backgroundColor: '#0D0C0B',
        '--sa': accent,
        '--section-accent': accent,
        '--section-card-border': `color-mix(in srgb, ${accent} 35%, rgba(255,255,255,0.1))`,
        '--section-card-tint': `color-mix(in srgb, ${accent} 10%, #181614)`,
        '--section-chip-bg': `color-mix(in srgb, ${accent} 28%, transparent)`,
        '--section-input-focus': `color-mix(in srgb, ${accent} 70%, transparent)`,
        '--section-label': `color-mix(in srgb, ${accent} 55%, #C8BFB5)`,
        '--section-muted': `color-mix(in srgb, ${accent} 30%, #C8BFB5)`,
      }}
    >
      {/* Artwork background image */}
      {bgImage && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          opacity: 0.07,
          pointerEvents: 'none',
        }} />
      )}

      {/* Architectural grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(${accent} 1px, transparent 1px),
          linear-gradient(90deg, ${accent} 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        opacity: 0.055,
      }} />

      {/* Primary atmospheric colour wash — top bloom */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: [
          `radial-gradient(ellipse 120% 60% at 50% -8%, ${accent}65 0%, ${accent}28 40%, transparent 68%)`,
          `radial-gradient(ellipse 70% 40% at -5% 30%, ${accent}35 0%, transparent 65%)`,
          `radial-gradient(ellipse 70% 40% at 105% 25%, ${accent}30 0%, transparent 65%)`,
        ].join(', '),
      }} />

      {/* Vivid atmospheric orbs — large drifting colour blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* Primary accent orb — top right */}
        <div style={{
          position: 'absolute', top: '-10%', right: '-8%',
          width: '55vw', height: '55vw', maxWidth: 480, maxHeight: 480,
          background: `radial-gradient(circle, ${accent}40 0%, ${accent}18 40%, transparent 70%)`,
          borderRadius: '50%', filter: 'blur(40px)',
          animation: 'orb-drift 18s ease-in-out infinite',
        }} />
        {/* Purple chromatic counterpoint — bottom left */}
        <div style={{
          position: 'absolute', bottom: '5%', left: '-12%',
          width: '50vw', height: '50vw', maxWidth: 420, maxHeight: 420,
          background: 'radial-gradient(circle, rgba(120,60,220,0.32) 0%, rgba(80,20,180,0.14) 45%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(48px)',
          animation: 'orb-drift 24s ease-in-out infinite 4s',
        }} />
        {/* Cyan accent — mid right */}
        <div style={{
          position: 'absolute', top: '45%', right: '-5%',
          width: '30vw', height: '30vw', maxWidth: 280, maxHeight: 280,
          background: 'radial-gradient(circle, rgba(0,200,255,0.18) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(32px)',
          animation: 'orb-drift 14s ease-in-out infinite 8s',
        }} />
      </div>

      {/* Top accent bar — animated power-on sweep with glow */}
      <div style={{ position: 'relative', zIndex: 2, height: 3, overflow: 'visible' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: `linear-gradient(90deg, ${accent} 0%, ${accent}ee 25%, ${accent}88 60%, transparent 100%)`,
          boxShadow: `0 0 24px 2px ${accent}bb, 0 0 6px ${accent}, 0 2px 16px ${accent}55`,
          transformOrigin: 'left',
          animation: 'power-bar-sweep 1.0s cubic-bezier(0.22,1,0.36,1) both',
        }} />
        <div style={{ position: 'absolute', left: 0, top: -4, width: 2, height: 10, background: `linear-gradient(to bottom, ${accent}, transparent)` }} />
        {[12, 28, 52].map((pct, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${pct}%`, top: -3, width: 1, height: 7,
            background: `linear-gradient(to bottom, ${accent}${['ff','aa','66'][i]}, transparent)`,
          }} />
        ))}
      </div>

      {/* Architectural corner brackets */}
      {[['top','left'],['top','right']].map(([v, h]) => (
        <div key={v+h} style={{
          position: 'fixed', [v]: 14, [h]: 14,
          width: 14, height: 14, zIndex: 2, pointerEvents: 'none',
          animation: 'corner-blink 4s ease-in-out infinite',
          animationDelay: h === 'right' ? '2s' : '0s',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `${accent}80` }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, [h]: 0, width: 1, background: `${accent}80` }} />
        </div>
      ))}

      {/* Holographic ring clusters — fixed viewport, partially cropped */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* Ring cluster 1 — bottom-left, large, accent colour */}
        <HoloRings size={340} color={accent} style={{
          position: 'absolute', bottom: -100, left: -100, opacity: 0.52,
        }} />
        {/* Ring cluster 2 — top-right, medium, cyan */}
        <HoloRings size={240} color="#00C8FF" style={{
          position: 'absolute', top: -65, right: -65, opacity: 0.42,
        }} />
        {/* Ring cluster 3 — mid-left, small, purple */}
        <HoloRings size={170} color="#A040E0" style={{
          position: 'absolute', top: '38%', left: -60, opacity: 0.36,
        }} />
      </div>

      {/* Accent scan line — runs once on mount then gone */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 3, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent 0%, ${accent}44 10%, ${accent}cc 30%, ${accent} 50%, ${accent}cc 70%, ${accent}44 90%, transparent 100%)`,
          boxShadow: `0 0 12px ${accent}88, 0 0 24px ${accent}44`,
          filter: 'blur(0.5px)',
          animation: 'prismatic-scan 2.4s cubic-bezier(0.4,0,0.6,1) 1 forwards',
        }} />
      </div>

      {/* Holographic foil overlay — iridescent sheen across entire page */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'linear-gradient(135deg, rgba(255,30,160,0.025) 0%, rgba(100,60,255,0.03) 25%, rgba(0,180,255,0.025) 50%, rgba(0,255,160,0.02) 75%, rgba(255,200,0,0.025) 100%)',
        backgroundSize: '400% 400%',
        animation: 'holo-border 12s ease infinite',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
        {children}
      </div>
    </div>
  )
}
