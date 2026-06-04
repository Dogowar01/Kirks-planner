import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './sections/Layout'
import Dashboard from './sections/dashboard/Dashboard'
import Calendar from './sections/calendar/Calendar'
import Tasks from './sections/tasks/Tasks'
import Businesses from './sections/businesses/Businesses'
import Contacts from './sections/contacts/Contacts'
import Notes from './sections/notes/Notes'
import WordCount from './sections/wordcount/WordCount'
import Finance from './sections/finance/Finance'
import Settings from './sections/settings/Settings'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="calendar"   element={<Calendar />} />
          <Route path="tasks"      element={<Tasks />} />
          <Route path="businesses" element={<Businesses />} />
          <Route path="contacts"   element={<Contacts />} />
          <Route path="notes"      element={<Notes />} />
          <Route path="wordcount"  element={<WordCount />} />
          <Route path="finance"    element={<Finance />} />
          <Route path="settings"   element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
