/**
 * PageHeader — shared sticky header used by all main section pages.
 * Props:
 *  subtitle  — small uppercase DM Mono label above the title
 *  title     — Playfair italic heading
 *  accent    — hex colour for the title glow + border tint
 *  showBack  — if true, shows a ← HUB back button on the left
 *  children  — optional right-side action buttons
 */
import { useNavigate } from 'react-router-dom'
import MatrixReveal from './MatrixReveal'
import { LayoutGrid } from 'lucide-react'

export default function PageHeader({ subtitle, title, accent = '#C4522A', showBack = false, children }) {
  const navigate = useNavigate()

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      padding: '10px 16px 12px',
      animation: 'phase-in 1.1s cubic-bezier(0.22,1,0.36,1) both',
      background: 'linear-gradient(to bottom, rgba(8,7,6,0.99) 0%, rgba(13,12,11,0.95) 100%)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between',
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
      {/* Holographic shimmer streak */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(105deg, transparent 0%, rgba(255,30,160,0.04) 20%, rgba(0,180,255,0.06) 50%, rgba(0,255,160,0.04) 80%, transparent 100%)',
        backgroundSize: '200% 100%',
        animation: 'holo-sweep 6s ease-in-out infinite',
      }} />

      {/* Left: back button + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
        {showBack && (
          <button
            onClick={() => navigate('/hub')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', letterSpacing: '0.14em',
              color: `${accent}80`, background: `${accent}10`,
              border: `0.5px solid ${accent}35`, borderRadius: 6,
              padding: '5px 9px', cursor: 'pointer',
              textTransform: 'uppercase', flexShrink: 0,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = accent; e.currentTarget.style.borderColor = `${accent}70`; e.currentTarget.style.background = `${accent}18` }}
            onMouseLeave={e => { e.currentTarget.style.color = `${accent}80`; e.currentTarget.style.borderColor = `${accent}35`; e.currentTarget.style.background = `${accent}10` }}
          >
            <LayoutGrid size={11} strokeWidth={1.5} />
            HUB
          </button>
        )}

        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: '"DM Mono", monospace', fontSize: '0.38rem',
            color: `${accent}70`, letterSpacing: '0.22em',
            textTransform: 'uppercase', marginBottom: 2,
          }}>
            ■ <MatrixReveal text={subtitle} delay={0.1} duration={900} color={`${accent}70`} />
          </div>
          <h1 style={{
            fontFamily: '"Playfair Display", serif', fontStyle: 'italic',
            fontWeight: 600, fontSize: '1.1rem',
            color: accent, margin: 0,
            textShadow: `0 0 20px ${accent}40`,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            <MatrixReveal text={title} delay={0.35} duration={1100} color={accent} />
          </h1>
        </div>
      </div>

      {children && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {children}
        </div>
      )}
    </div>
  )
}
