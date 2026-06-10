import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, CheckSquare, BookOpen, Settings, MoreHorizontal, X, Wrench, ShieldCheck, BookMarked, Fuel, Users } from 'lucide-react'

const PRIMARY = [
  { to: '/dashboard', label: 'Home',     Icon: LayoutDashboard },
  { to: '/tasks',     label: 'Tasks',    Icon: CheckSquare },
  { to: '/ledger',    label: 'Ledger',   Icon: BookMarked },
  { to: '/notes',     label: 'Notes',    Icon: BookOpen },
  { to: '/tools',     label: 'Tools',    Icon: Wrench },
  { to: '/calendar',  label: 'Calendar', Icon: CalendarDays },
]

const OVERFLOW = [
  { to: '/vault',    label: 'Vault',    Icon: ShieldCheck },
  { to: '/fuel',     label: 'Fuel',     Icon: Fuel },
  { to: '/contacts', label: 'Contacts', Icon: Users },
  { to: '/settings', label: 'Settings', Icon: Settings },
]

export default function BottomNav() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const overflowActive = OVERFLOW.some(o => location.pathname.startsWith(o.to))

  return (
    <>
      {/* Overflow drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />
          <div
            className="absolute left-0 right-0 bottom-0"
            style={{
              background: 'linear-gradient(to top, #0D0C0B, #111009)',
              borderTop: '0.5px solid rgba(196,82,42,0.25)',
              borderRadius: '16px 16px 0 0',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
              boxShadow: '0 -8px 48px rgba(0,0,0,0.8)',
            }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
              <div style={{ width: 36, height: 2, borderRadius: 1, background: 'rgba(196,82,42,0.3)' }} />
            </div>
            {OVERFLOW.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} onClick={() => setOpen(false)}
                className={({ isActive }) => `nav-item mx-3 my-1${isActive ? ' active' : ''}`}>
                <Icon size={16} strokeWidth={1.5} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{
          background: 'linear-gradient(to top, rgba(6,5,4,1) 0%, rgba(12,11,10,0.98) 100%)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderTop: '0.5px solid rgba(196,82,42,0.15)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.8), 0 -1px 0 rgba(196,82,42,0.06)',
          position: 'relative',
        }}>

        {/* Energy flow — animated light streak across the top edge */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          overflow: 'hidden', pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', top: 0, height: '100%', width: '40%',
            background: 'linear-gradient(90deg, transparent 0%, rgba(196,82,42,0.5) 20%, rgba(255,140,80,1) 50%, rgba(196,82,42,0.5) 80%, transparent 100%)',
            animation: 'nav-energy-flow 4s linear infinite',
          }} />
        </div>
        {PRIMARY.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to}
            className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-all duration-200 relative"
            style={({ isActive }) => ({ color: isActive ? '#E06840' : '#6A6258' })}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <>
                    {/* Pulsing indicator line */}
                    <span style={{
                      position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                      width: 30, height: 1.5,
                      background: 'linear-gradient(to right, transparent 0%, #E06840 18%, #FF9060 50%, #E06840 82%, transparent 100%)',
                      animation: 'nav-active-pulse 2.2s ease-in-out infinite',
                    }} />
                    {/* End cap ticks */}
                    <span style={{ position: 'absolute', top: 0, left: 'calc(50% - 15px)', width: 1.5, height: 5, background: 'linear-gradient(to bottom, #E06840cc, transparent)', }} />
                    <span style={{ position: 'absolute', top: 0, left: 'calc(50% + 13.5px)', width: 1.5, height: 5, background: 'linear-gradient(to bottom, #E06840cc, transparent)', }} />
                    {/* Radial warm glow */}
                    <span style={{
                      position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)',
                      width: 48, height: 40,
                      background: 'radial-gradient(ellipse, rgba(196,82,42,0.15) 0%, transparent 70%)',
                      pointerEvents: 'none',
                    }} />
                  </>
                )}
                <Icon size={20} strokeWidth={isActive ? 1.8 : 1.3} />
                <span style={{
                  fontSize: '7.5px',
                  fontFamily: '"DM Mono", monospace',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  opacity: isActive ? 1 : 0.6,
                }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={() => setOpen(o => !o)}
          className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-all duration-200"
          style={{ color: overflowActive ? '#C4522A' : open ? '#EDE8E0' : '#6A6258', background: 'none', border: 'none', cursor: 'pointer' }}>
          {open ? <X size={20} strokeWidth={1.4} /> : <MoreHorizontal size={20} strokeWidth={1.4} />}
          <span style={{ fontSize: '7.5px', fontFamily: '"DM Mono", monospace', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6 }}>More</span>
        </button>
      </nav>
    </>
  )
}
