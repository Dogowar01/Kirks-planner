/**
 * PageHeader — shared sticky header used by all main section pages.
 * Matches the FuelTracker header aesthetic: frosted glass, DM Mono subtitle, Playfair title.
 *
 * Props:
 *  subtitle  — small uppercase DM Mono label above the title (e.g. "TASK MANAGER")
 *  title     — Playfair italic heading
 *  accent    — hex colour for the title glow + border tint
 *  children  — optional right-side action buttons
 */
export default function PageHeader({ subtitle, title, accent = '#C4522A', children }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      padding: '12px 20px 14px',
      animation: 'phase-in 0.9s cubic-bezier(0.22,1,0.36,1) both',
      background: 'linear-gradient(to bottom, rgba(8,7,6,0.99) 0%, rgba(13,12,11,0.95) 100%)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      boxShadow: '0 4px 32px rgba(0,0,0,0.55)',
      overflow: 'hidden',
    }}>
      {/* Holographic bottom edge */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 1.5,
        background: 'linear-gradient(90deg, rgba(255,30,160,0.8) 0%, rgba(100,60,255,0.85) 20%, rgba(0,180,255,0.9) 40%, rgba(0,255,160,0.8) 60%, rgba(255,200,0,0.75) 80%, rgba(255,60,60,0.7) 100%)',
        backgroundSize: '300% 100%',
        animation: 'holo-border 4s linear infinite',
        filter: 'blur(0.5px)',
      }} />
      {/* Holographic shimmer streak across header */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(105deg, transparent 0%, rgba(255,30,160,0.04) 20%, rgba(0,180,255,0.06) 50%, rgba(0,255,160,0.04) 80%, transparent 100%)',
        backgroundSize: '200% 100%',
        animation: 'holo-sweep 6s ease-in-out infinite',
      }} />
      <div>
        <div style={{
          fontFamily: '"DM Mono", monospace', fontSize: '0.38rem',
          color: `${accent}70`, letterSpacing: '0.22em',
          textTransform: 'uppercase', marginBottom: 2,
        }}>
          ■ {subtitle}
        </div>
        <h1 style={{
          fontFamily: '"Playfair Display", serif', fontStyle: 'italic',
          fontWeight: 600, fontSize: '1.1rem',
          color: accent, margin: 0,
          textShadow: `0 0 20px ${accent}40`,
          letterSpacing: '-0.01em',
        }}>
          {title}
        </h1>
      </div>
      {children && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {children}
        </div>
      )}
    </div>
  )
}
