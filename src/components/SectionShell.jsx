export default function SectionShell({ accent, children, className = '' }) {
  return (
    <div
      className={className}
      style={{
        minHeight: '100%',
        background: [
          /* Strong radial bloom from top — clearly tinted per section */
          `radial-gradient(ellipse 100% 55% at 50% -5%, ${accent}45 0%, ${accent}10 45%, transparent 70%)`,
          /* Subtle side bleeds so colour fills the viewport width */
          `radial-gradient(ellipse 60% 30% at 0% 15%, ${accent}18 0%, transparent 55%)`,
          `radial-gradient(ellipse 60% 30% at 100% 15%, ${accent}12 0%, transparent 55%)`,
          '#0D0C0B',
        ].join(', '),
        '--section-accent': accent,
      }}
    >
      {/* Top accent bar — 2px, solid, clearly visible */}
      <div style={{
        height: 2,
        background: `linear-gradient(90deg, transparent 0%, ${accent}90 20%, ${accent} 50%, ${accent}90 80%, transparent 100%)`,
      }} />
      {children}
    </div>
  )
}
