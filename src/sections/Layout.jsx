import { NavLink } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, CheckSquare, Briefcase, Users, BookOpen, PenLine, DollarSign, Settings } from 'lucide-react'

const NAV = [
  { to: '/dashboard',  label: 'Dashboard',  Icon: LayoutDashboard },
  { to: '/calendar',   label: 'Calendar',   Icon: CalendarDays },
  { to: '/tasks',      label: 'Tasks',      Icon: CheckSquare },
  { to: '/businesses', label: 'Businesses', Icon: Briefcase },
  { to: '/contacts',   label: 'Contacts',   Icon: Users },
  { to: '/notes',      label: 'Notes',      Icon: BookOpen },
  { to: '/wordcount',  label: 'Word Count', Icon: PenLine },
  { to: '/finance',    label: 'Finance',    Icon: DollarSign },
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
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#5C5650', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 3 }}>
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

function BottomNav() {
  const primary = NAV.slice(0, 6)
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
      style={{
        background: 'rgba(13,12,11,0.97)',
        backdropFilter: 'blur(20px)',
        borderTop: '0.5px solid rgba(255,255,255,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
      {primary.map(({ to, label, Icon }) => (
        <NavLink key={to} to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2.5 gap-1 transition-colors duration-150 ${isActive ? '' : ''}`
          }
          style={({ isActive }) => ({ color: isActive ? '#C4522A' : '#5C5650' })}>
          <Icon size={19} strokeWidth={1.5} />
          <span style={{ fontSize: '9px', fontFamily: '"DM Mono", monospace', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
        </NavLink>
      ))}
    </nav>
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
