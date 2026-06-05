export default function SectionShell({ accent, bgImage, children, className = '' }) {
  // Derive secondary palette from accent for consistent in-section theming
  return (
    <div
      className={className}
      style={{
        minHeight: '100%',
        position: 'relative',
        backgroundColor: '#0D0C0B',
        // Expose the full palette as CSS vars so child components can use them
        '--sa': accent,                                  // raw accent hex
        '--section-accent': accent,
        '--section-card-border': `color-mix(in srgb, ${accent} 30%, rgba(255,255,255,0.08))`,
        '--section-card-tint': `color-mix(in srgb, ${accent} 8%, #181614)`,
        '--section-chip-bg': `color-mix(in srgb, ${accent} 22%, transparent)`,
        '--section-input-focus': `color-mix(in srgb, ${accent} 60%, transparent)`,
        '--section-label': `color-mix(in srgb, ${accent} 55%, #A09890)`,
        '--section-muted': `color-mix(in srgb, ${accent} 30%, #7A7470)`,
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
          opacity: 0.08,
          pointerEvents: 'none',
        }} />
      )}

      {/* Colour gradient overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        background: [
          `radial-gradient(ellipse 110% 55% at 50% -5%, ${accent}55 0%, ${accent}18 40%, transparent 70%)`,
          `radial-gradient(ellipse 50% 25% at 0% 20%, ${accent}15 0%, transparent 55%)`,
          `radial-gradient(ellipse 50% 25% at 100% 20%, ${accent}10 0%, transparent 55%)`,
        ].join(', '),
        pointerEvents: 'none',
      }} />

      {/* Top accent bar */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        height: 2,
        background: `linear-gradient(90deg, transparent 0%, ${accent}90 20%, ${accent} 50%, ${accent}90 80%, transparent 100%)`,
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
        {children}
      </div>
    </div>
  )
}
