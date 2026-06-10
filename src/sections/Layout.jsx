import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, CheckSquare, Users, BookOpen, Settings, Wrench, ShieldCheck, BookMarked, Fuel, Flame, PenLine } from 'lucide-react'
import BottomNav from '../components/BottomNav'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/tasks',     label: 'Tasks',     Icon: CheckSquare },
  { to: '/ledger',    label: 'Ledger',    Icon: BookMarked },
  { to: '/habits',    label: 'Habits',    Icon: Flame },
  { to: '/journal',   label: 'Journal',   Icon: PenLine },
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
      <div className="p-5 pb-4" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.05)', position: 'relative' }}>
        {/* Corner brackets */}
        {[['top','left'],['bottom','right']].map(([v,h]) => (
          <div key={v+h} style={{ position: 'absolute', [v]: 8, [h]: 8, width: 8, height: 8, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', [v === 'top' ? 'top' : 'bottom']: 0, left: 0, right: 0, height: 0.5, background: 'rgba(196,82,42,0.35)' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, [h === 'left' ? 'left' : 'right']: 0, width: 0.5, background: 'rgba(196,82,42,0.35)' }} />
          </div>
        ))}
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: '1.2rem', color: '#C4522A', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          Signal9
        </h1>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#B8B0A8', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 3 }}>
          Life Planner
        </p>
        {/* Geometric accent rule */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
          <div style={{ width: 3, height: 3, background: '#C4522A', opacity: 0.6, clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
          <div style={{ flex: 1, height: 0.5, background: 'linear-gradient(to right, rgba(196,82,42,0.4), transparent)' }} />
        </div>
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
