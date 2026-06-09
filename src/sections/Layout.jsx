import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, CheckSquare, Users, BookOpen, Settings, MoreHorizontal, X, Wrench, ShieldCheck, BookMarked, Fuel } from 'lucide-react'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/tasks',     label: 'Tasks',     Icon: CheckSquare },
  { to: '/ledger',    label: 'Ledger',    Icon: BookMarked },
  { to: '/notes',     label: 'Notes',     Icon: BookOpen },
  { to: '/tools',     label: 'Tools',     Icon: Wrench },
  { to: '/calendar',  label: 'Calendar',  Icon: CalendarDays },
  { to: '/vault',     label: 'Vault',     Icon: ShieldCheck },
  { to: '/fuel',      label: 'Fuel',      Icon: Fuel },
  { to: '/contacts',  label: 'Contacts',  Icon: Users },
]

function SideNav() {
  return (
    <aside className="hidden md:flex flex-col w-52 shrink-0 h-screen sticky top-0"
      style={{
        background: 'linear-gradient(180deg, #111009 0%, #0D0C0B 60%, #0F0C10 100%)',
        borderRight: '0.5px solid rgba(255,255,255,0.06)',
      }}>

      {/* Wordmark */}
      <div className="p-5 pb-4" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: '1.2rem', color: '#C4522A', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          Signal9
        </h1>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#B8B0A8', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 3 }}>
          Life Planner
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon size={15} strokeWidth={1.5} />
            <span className="text-[13px]">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Settings */}
      <div className="p-3" style={{ borderTop: '0.5px solid rgba(255,255,255,0.05)' }}>
        <NavLink to="/settings"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Settings size={15} strokeWidth={1.5} />
          <span className="text-[13px]">Settings</span>
        </NavLink>
      </div>

      {/* Atmospheric bottom accent */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
        background: 'linear-gradient(to top, rgba(139,26,26,0.06), transparent)',
        pointerEvents: 'none',
      }} />
    </aside>
  )
}

const OVERFLOW = [
  { to: '/vault',    label: 'Vault',    Icon: ShieldCheck },
  { to: '/fuel',     label: 'Fuel',     Icon: Fuel },
  { to: '/contacts', label: 'Contacts', Icon: Users },
  { to: '/settings', label: 'Settings', Icon: Settings },
]

function BottomNav() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const primary = NAV.slice(0, 6) // dashboard, tasks, finance, notes, tools, calendar
  const overflowActive = OVERFLOW.some(o => location.pathname.startsWith(o.to))

  return (
    <>
      {/* Overflow drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
          <div
            className="absolute left-0 right-0 bottom-0"
            style={{
              background: '#111009',
              borderTop: '0.5px solid rgba(255,255,255,0.1)',
              borderRadius: '16px 16px 0 0',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
            }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
              <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
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
          background: 'linear-gradient(to top, rgba(10,9,7,0.99) 0%, rgba(14,12,10,0.96) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '0.5px solid rgba(196,82,42,0.12)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
        }}>
        {primary.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to}
            className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-all duration-200 relative"
            style={({ isActive }) => ({ color: isActive ? '#E06840' : '#7A7268' })}>
            {({ isActive }) => (
              <>
                {/* Active: top pip + warm radial glow behind icon */}
                {isActive && (
                  <>
                    <span style={{
                      position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                      width: 28, height: 2, borderRadius: 1,
                      background: 'linear-gradient(to right, transparent, #E06840, transparent)',
                      boxShadow: '0 0 10px 1px rgba(224,104,64,0.8)',
                    }} />
                    <span style={{
                      position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)',
                      width: 40, height: 36,
                      background: 'radial-gradient(ellipse, rgba(196,82,42,0.18) 0%, transparent 70%)',
                      pointerEvents: 'none',
                    }} />
                  </>
                )}
                <Icon size={20} strokeWidth={isActive ? 1.8 : 1.4} />
                <span style={{
                  fontSize: '8px',
                  fontFamily: '"DM Mono", monospace',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  opacity: isActive ? 1 : 0.7,
                }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={() => setOpen(o => !o)}
          className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-all duration-200"
          style={{ color: overflowActive ? '#C4522A' : open ? '#EDE8E0' : '#7A7268', background: 'none', border: 'none', cursor: 'pointer' }}>
          {open ? <X size={20} strokeWidth={1.4} /> : <MoreHorizontal size={20} strokeWidth={1.4} />}
          <span style={{ fontSize: '8px', fontFamily: '"DM Mono", monospace', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7 }}>More</span>
        </button>
      </nav>
    </>
  )
}

export default function Layout() {
  return (
    <div className="flex min-h-screen" style={{ background: '#0D0C0B' }}>
      <SideNav />
      <main className="flex-1 min-w-0 pb-20 md:pb-0 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
