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
      background: 'linear-gradient(to bottom, rgba(8,7,6,0.99) 0%, rgba(13,12,11,0.95) 100%)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: `0.5px solid ${accent}22`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      boxShadow: '0 4px 32px rgba(0,0,0,0.55)',
    }}>
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
