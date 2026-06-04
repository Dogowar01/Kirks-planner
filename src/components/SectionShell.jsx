export default function SectionShell({ accent, bgImage, children, className = '' }) {
  return (
    <div
      className={className}
      style={{
        minHeight: '100%',
        position: 'relative',
        backgroundColor: '#0D0C0B',
        '--section-accent': accent,
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
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </div>
  )
}
