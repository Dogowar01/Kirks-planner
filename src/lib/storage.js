export const storage = {
  get: (key) => {
    try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch (e) { console.warn('Storage write failed', e) }
  },
  remove: (key) => localStorage.removeItem(key),
}

export const KEYS = {
  events:    'kirk_planner_v1_events',
  tasks:     'kirk_planner_v1_tasks',
  projects:  'kirk_planner_v1_projects',
  contacts:  'kirk_planner_v1_contacts',
  notes:     'kirk_planner_v1_notes',
  finance:   'kirk_planner_v1_finance',
  settings:  'kirk_planner_v1_settings',
  missions:  'kirk_planner_v1_missions',
  habits:    'kirk_planner_v1_habits',
  habitLogs: 'kirk_planner_v1_habit_logs',
  journal:   'kirk_planner_v1_journal',
}
