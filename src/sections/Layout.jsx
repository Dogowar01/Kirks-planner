import { Outlet, NavLink, useNavigate } from 'react-router-dom'
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
    <aside className="hidden md:flex flex-col w-56 shrink-0 bg-bg-surface border-r h-screen sticky top-0" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
      <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <h1 className="font-display text-lg font-semibold text-text-primary leading-tight">Signal9</h1>
        <p className="text-text-tertiary text-xs font-mono mt-0.5">Life Planner</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `nav-item${isActive ? ' active text-text-primary bg-bg-elevated' : ''}`
            }>
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <NavLink to="/settings"
          className={({ isActive }) => `nav-item${isActive ? ' active text-text-primary bg-bg-elevated' : ''}`}>
          <Settings size={16} />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  )
}

function BottomNav() {
  const primary = NAV.slice(0, 6)
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-elevated border-t flex"
         style={{ borderColor: 'rgba(255,255,255,0.12)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {primary.map(({ to, label, Icon }) => (
        <NavLink key={to} to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-medium transition-colors duration-150 ${isActive ? 'text-signal9' : 'text-text-tertiary'}`
          }>
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-bg-base">
      <SideNav />
      <main className="flex-1 min-w-0 pb-20 md:pb-0 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
