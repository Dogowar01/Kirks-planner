import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './sections/Layout'
import Dashboard from './sections/dashboard/Dashboard'
import Calendar from './sections/calendar/Calendar'
import Tasks from './sections/tasks/Tasks'
import Contacts from './sections/contacts/Contacts'
import Notes from './sections/notes/Notes'
import Settings from './sections/settings/Settings'
import Tools from './sections/tools/Tools'
import Vault from './sections/vault/Vault'
import Ledger from './sections/ledger/Ledger'
import FuelTracker from './sections/fuel/FuelTracker'
import { useNotifications } from './hooks/useNotifications'

// Mounted inside StoreProvider — starts the notification polling loop
function NotificationEngine() {
  useNotifications()
  return null
}

export default function App() {
  return (
    <HashRouter>
      <NotificationEngine />
      <Routes>
        {/* Full-screen standalone routes — no Layout wrapper */}
        <Route path="/ledger" element={<Ledger />} />
        <Route path="/fuel"   element={<FuelTracker />} />

        {/* Standard app routes inside the Layout (nav + sidebar) */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="calendar"  element={<Calendar />} />
          <Route path="tasks"     element={<Tasks />} />
          <Route path="contacts"  element={<Contacts />} />
          <Route path="notes"     element={<Notes />} />
          <Route path="tools"     element={<Tools />} />
          <Route path="vault"     element={<Vault />} />
          <Route path="settings"  element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
