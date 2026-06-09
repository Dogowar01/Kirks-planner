import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

const LEDGER_URL = 'https://dogowar01.github.io/Ledger/'

export default function Ledger() {
  const navigate = useNavigate()

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Slim back bar */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 8,
        paddingRight: 16,
        height: 'calc(env(safe-area-inset-top) + 44px)',
        background: '#0D0C0B',
        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#C4522A', padding: '8px 10px',
            fontFamily: '"DM Mono", monospace',
            fontSize: 12, letterSpacing: '0.08em',
            touchAction: 'manipulation',
          }}>
          <ChevronLeft size={18} strokeWidth={2} />
          PLANNER
        </button>
      </div>

      {/* Ledger iframe — fills everything below the back bar */}
      <iframe
        src={LEDGER_URL}
        title="Ledger"
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          display: 'block',
        }}
        allow="storage-access"
      />
    </div>
  )
}
