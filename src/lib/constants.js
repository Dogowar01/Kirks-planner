export const CATEGORIES = {
  signal9:  { label: 'Signal9',  color: '#C4522A', light: 'rgba(196,82,42,0.15)',  class: 'bg-signal9' },
  app:      { label: 'App Dev',  color: '#3B82F6', light: 'rgba(59,130,246,0.15)', class: 'bg-app' },
  writing:  { label: 'Writing',  color: '#7C3AED', light: 'rgba(124,58,237,0.15)', class: 'bg-writing' },
  personal: { label: 'Personal', color: '#7F77DD', light: 'rgba(127,119,221,0.15)',class: 'bg-personal' },
}

export const STATUSES = {
  active:    { label: 'Active',   color: '#2D9E5A' },
  planning:  { label: 'Planning', color: '#3B82F6' },
  paused:    { label: 'Paused',   color: '#5C5650' },
  'on-hold': { label: 'On Hold',  color: '#C4522A' },
  complete:  { label: 'Complete', color: '#3B6D11' },
}

export const BUSINESSES = {
  signal9: { label: 'Signal9 Studio',  color: '#C4522A', textClass: 'text-signal9' },
  app:     { label: 'App Development', color: '#3B82F6', textClass: 'text-app' },
  writing: { label: 'Writing',         color: '#7C3AED', textClass: 'text-writing' },
}

export const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',   icon: 'LayoutDashboard' },
  { id: 'calendar',    label: 'Calendar',    icon: 'CalendarDays' },
  { id: 'tasks',       label: 'Tasks',       icon: 'CheckSquare' },
  { id: 'businesses',  label: 'Businesses',  icon: 'Briefcase' },
  { id: 'contacts',    label: 'Contacts',    icon: 'Users' },
  { id: 'notes',       label: 'Notes',       icon: 'BookOpen' },
  { id: 'wordcount',   label: 'Word Count',  icon: 'PenLine' },
  { id: 'finance',     label: 'Finance',     icon: 'DollarSign' },
]
