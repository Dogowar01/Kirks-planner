/**
 * Wraps each section with its own accent colour and subtle background gradient.
 * Pass `accent` (hex) and optionally `label` and `icon`.
 */
export default function SectionShell({ accent, children, className = '' }) {
  return (
    <div
      className={className}
      style={{
        minHeight: '100%',
        background: `radial-gradient(ellipse 80% 40% at 50% -10%, ${accent}18 0%, transparent 60%), #0D0C0B`,
        '--section-accent': accent,
      }}
    >
      {/* Top accent line */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accent}60, transparent)` }} />
      {children}
    </div>
  )
}
