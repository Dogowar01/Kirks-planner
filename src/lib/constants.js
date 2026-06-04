export const CATEGORIES = {
  signal9: { label: 'Signal9',    color: '#D85A30', light: '#FAECE7', class: 'bg-signal9' },
  app:     { label: 'App Dev',    color: '#378ADD', light: '#E6F1FB', class: 'bg-app' },
  writing: { label: 'Writing',    color: '#1D9E75', light: '#E1F5EE', class: 'bg-writing' },
  personal:{ label: 'Personal',   color: '#7F77DD', light: '#EEEDFE', class: 'bg-personal' },
}

export const STATUSES = {
  active:   { label: 'Active',    color: '#1D9E75' },
  planning: { label: 'Planning',  color: '#378ADD' },
  paused:   { label: 'Paused',    color: '#888780' },
  'on-hold':{ label: 'On Hold',   color: '#D85A30' },
  complete: { label: 'Complete',  color: '#3B6D11' },
}

export const BUSINESSES = {
  signal9: { label: 'Signal9 Studio',  color: '#D85A30', textClass: 'text-signal9' },
  app:     { label: 'App Development', color: '#378ADD', textClass: 'text-app' },
  writing: { label: 'Writing',         color: '#1D9E75', textClass: 'text-writing' },
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
