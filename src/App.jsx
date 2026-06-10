import { useState } from 'react'
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
import Habits from './sections/habits/Habits'
import Journal from './sections/journal/Journal'
import Ambient from './sections/ambient/Ambient'
import Boards from './sections/boards/Boards'
import Hub from './sections/hub/Hub'
import Writing from './sections/writing/Writing'
import Review from './sections/review/Review'
import Routine from './sections/routine/Routine'
import Reading from './sections/reading/Reading'
import Focus from './sections/focus/Focus'
import BootScreen, { shouldShowBoot } from './components/BootScreen'
import { useNotifications } from './hooks/useNotifications'

function NotificationEngine() {
  useNotifications()
  return null
}

export default function App() {
  const [booting, setBooting] = useState(() => shouldShowBoot())

  return (
    <>
      {booting && <BootScreen onComplete={() => setBooting(false)} />}
      <HashRouter>
        <NotificationEngine />
        <Routes>
          {/* Full-screen standalone routes */}
          <Route path="/ledger"  element={<Ledger />} />
          <Route path="/fuel"    element={<FuelTracker />} />
          <Route path="/ambient" element={<Ambient />} />

          {/* Standard routes inside Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="hub"       element={<Hub />} />
            <Route path="calendar"  element={<Calendar />} />
            <Route path="tasks"     element={<Tasks />} />
            <Route path="contacts"  element={<Contacts />} />
            <Route path="notes"     element={<Notes />} />
            <Route path="tools"     element={<Tools />} />
            <Route path="vault"     element={<Vault />} />
            <Route path="habits"    element={<Habits />} />
            <Route path="journal"   element={<Journal />} />
            <Route path="boards"    element={<Boards />} />
            <Route path="writing"   element={<Writing />} />
            <Route path="review"    element={<Review />} />
            <Route path="routine"   element={<Routine />} />
            <Route path="reading"   element={<Reading />} />
            <Route path="focus"     element={<Focus />} />
            <Route path="settings"  element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </>
  )
}
