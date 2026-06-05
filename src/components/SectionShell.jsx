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

      {/* Colour gradient overlay — boosted for visible colour wash */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        background: [
          `radial-gradient(ellipse 110% 50% at 50% -5%, ${accent}48 0%, ${accent}18 45%, transparent 70%)`,
          `radial-gradient(ellipse 55% 30% at 0% 20%, ${accent}20 0%, transparent 60%)`,
          `radial-gradient(ellipse 55% 30% at 100% 20%, ${accent}18 0%, transparent 60%)`,
        ].join(', '),
        pointerEvents: 'none',
      }} />

      {/* Top accent bar — brighter */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        height: 2,
        background: `linear-gradient(90deg, transparent 0%, ${accent}cc 15%, ${accent}ff 50%, ${accent}cc 85%, transparent 100%)`,
        boxShadow: `0 0 16px 1px ${accent}88`,
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
        {children}
      </div>
    </div>
  )
}
