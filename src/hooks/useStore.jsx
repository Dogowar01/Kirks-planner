import { useState, useCallback, useEffect, createContext, useContext } from 'react'
import { v4 as uuid } from 'uuid'
import { storage, KEYS } from '../lib/storage'
import { getSeedData } from '../lib/seed'

const StoreContext = createContext(null)

function initStore() {
  const hasData = storage.get(KEYS.projects)
  if (!hasData) {
    const seed = getSeedData()
    storage.set(KEYS.projects,  seed.projects)
    storage.set(KEYS.events,    seed.events)
    storage.set(KEYS.tasks,     seed.tasks)
    storage.set(KEYS.notes,     seed.notes)
    storage.set(KEYS.finance,   seed.finance)
    storage.set(KEYS.settings,  seed.settings)
    storage.set(KEYS.contacts,  seed.contacts)
    storage.set(KEYS.missions,  seed.missions)
    return seed
  }
  return {
    projects:  storage.get(KEYS.projects)  || [],
    events:    storage.get(KEYS.events)    || [],
    tasks:     storage.get(KEYS.tasks)     || [],
    contacts:  storage.get(KEYS.contacts)  || [],
    notes:     storage.get(KEYS.notes)     || [],
    finance:   storage.get(KEYS.finance)   || { entries: [], goals: { signal9: { monthly: 0 }, app: { monthly: 0 } } },
    settings:  storage.get(KEYS.settings)  || { displayName: 'Kirk', theme: 'dark', notificationsEnabled: false, firedReminders: [] },
    missions:  storage.get(KEYS.missions)  || [],
  }
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(() => initStore())

  const persist = useCallback((key, value) => {
    storage.set(key, value)
    setState(s => ({ ...s, [keyToField(key)]: value }))
  }, [])

  function keyToField(key) {
    const map = {
      [KEYS.projects]:  'projects',
      [KEYS.events]:    'events',
      [KEYS.tasks]:     'tasks',
      [KEYS.contacts]:  'contacts',
      [KEYS.notes]:     'notes',
      [KEYS.finance]:   'finance',
      [KEYS.settings]:  'settings',
      [KEYS.missions]:  'missions',
    }
    return map[key]
  }

  // ── Projects ──
  const addProject = useCallback((data) => {
    const item = { id: uuid(), ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    const next = [...state.projects, item]
    persist(KEYS.projects, next)
    return item
  }, [state.projects, persist])

  const updateProject = useCallback((id, data) => {
    const next = state.projects.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p)
    persist(KEYS.projects, next)
  }, [state.projects, persist])

  const deleteProject = useCallback((id) => {
    persist(KEYS.projects, state.projects.filter(p => p.id !== id))
  }, [state.projects, persist])

  // ── Events ──
  const addEvent = useCallback((data) => {
    const item = { id: uuid(), ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    const next = [...state.events, item]
    persist(KEYS.events, next)
    return item
  }, [state.events, persist])

  const updateEvent = useCallback((id, data) => {
    const next = state.events.map(e => e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e)
    persist(KEYS.events, next)
  }, [state.events, persist])

  const deleteEvent = useCallback((id) => {
    persist(KEYS.events, state.events.filter(e => e.id !== id))
  }, [state.events, persist])

  // ── Tasks ──
  const addTask = useCallback((data) => {
    const item = { id: uuid(), done: false, doneAt: null, reminder: false, reminderDate: null, reminderTime: null, priority: 'normal', note: '', projectId: null, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    const next = [...state.tasks, item]
    persist(KEYS.tasks, next)
    return item
  }, [state.tasks, persist])

  const updateTask = useCallback((id, data) => {
    const next = state.tasks.map(t => {
      if (t.id !== id) return t
      const updated = { ...t, ...data, updatedAt: new Date().toISOString() }
      if (data.done === true && !t.done) updated.doneAt = new Date().toISOString()
      if (data.done === false) updated.doneAt = null
      return updated
    })
    persist(KEYS.tasks, next)
  }, [state.tasks, persist])

  const deleteTask = useCallback((id) => {
    persist(KEYS.tasks, state.tasks.filter(t => t.id !== id))
  }, [state.tasks, persist])

  // ── Contacts ──
  const addContact = useCallback((data) => {
    const item = { id: uuid(), ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    persist(KEYS.contacts, [...state.contacts, item])
    return item
  }, [state.contacts, persist])

  const updateContact = useCallback((id, data) => {
    persist(KEYS.contacts, state.contacts.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c))
  }, [state.contacts, persist])

  const deleteContact = useCallback((id) => {
    persist(KEYS.contacts, state.contacts.filter(c => c.id !== id))
  }, [state.contacts, persist])

  // ── Notes ──
  const addNote = useCallback((data) => {
    const item = { id: uuid(), pinned: false, tags: [], projectId: null, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    persist(KEYS.notes, [...state.notes, item])
    return item
  }, [state.notes, persist])

  const updateNote = useCallback((id, data) => {
    persist(KEYS.notes, state.notes.map(n => n.id === id ? { ...n, ...data, updatedAt: new Date().toISOString() } : n))
  }, [state.notes, persist])

  const deleteNote = useCallback((id) => {
    persist(KEYS.notes, state.notes.filter(n => n.id !== id))
  }, [state.notes, persist])

  // ── Finance ──
  const addFinanceEntry = useCallback((data) => {
    const item = { id: uuid(), ...data, createdAt: new Date().toISOString() }
    const next = { ...state.finance, entries: [...state.finance.entries, item] }
    persist(KEYS.finance, next)
    return item
  }, [state.finance, persist])

  const deleteFinanceEntry = useCallback((id) => {
    const next = { ...state.finance, entries: state.finance.entries.filter(e => e.id !== id) }
    persist(KEYS.finance, next)
  }, [state.finance, persist])

  const setFinanceGoal = useCallback((businessId, monthly) => {
    const next = { ...state.finance, goals: { ...state.finance.goals, [businessId]: { monthly } } }
    persist(KEYS.finance, next)
  }, [state.finance, persist])

  // ── Missions ──
  const addMission = useCallback((data) => {
    const item = { id: uuid(), status: 'active', businessId: null, targetDate: null, definedDone: '', ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    persist(KEYS.missions, [...state.missions, item])
    return item
  }, [state.missions, persist])

  const updateMission = useCallback((id, data) => {
    persist(KEYS.missions, state.missions.map(m => m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m))
  }, [state.missions, persist])

  const deleteMission = useCallback((id) => {
    persist(KEYS.missions, state.missions.filter(m => m.id !== id))
  }, [state.missions, persist])

  // ── Settings ──
  const updateSettings = useCallback((data) => {
    const next = { ...state.settings, ...data }
    persist(KEYS.settings, next)
  }, [state.settings, persist])

  // ── Export / Import ──
  const exportData = useCallback(() => {
    const data = { version: 1, exportedAt: new Date().toISOString(), ...state }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `signal9-planner-backup-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [state])

  const importData = useCallback((json) => {
    try {
      const data = JSON.parse(json)
      if (data.projects)  persist(KEYS.projects,  data.projects)
      if (data.events)    persist(KEYS.events,    data.events)
      if (data.tasks)     persist(KEYS.tasks,     data.tasks)
      if (data.contacts)  persist(KEYS.contacts,  data.contacts)
      if (data.notes)     persist(KEYS.notes,     data.notes)
      if (data.finance)   persist(KEYS.finance,   data.finance)
      if (data.settings)  persist(KEYS.settings,  data.settings)
      if (data.missions)  persist(KEYS.missions,  data.missions)
      return true
    } catch { return false }
  }, [persist])

  const clearAllData = useCallback(() => {
    Object.values(KEYS).forEach(k => storage.remove(k))
    const seed = getSeedData()
    setState(seed)
    Object.entries({
      [KEYS.projects]: seed.projects,
      [KEYS.events]:   seed.events,
      [KEYS.tasks]:    seed.tasks,
      [KEYS.notes]:    seed.notes,
      [KEYS.finance]:  seed.finance,
      [KEYS.settings]: seed.settings,
      [KEYS.missions]: seed.missions,
    }).forEach(([k,v]) => storage.set(k,v))
  }, [])

  const value = {
    ...state,
    addProject, updateProject, deleteProject,
    addEvent, updateEvent, deleteEvent,
    addTask, updateTask, deleteTask,
    addContact, updateContact, deleteContact,
    addNote, updateNote, deleteNote,
    addFinanceEntry, deleteFinanceEntry, setFinanceGoal,
    addMission, updateMission, deleteMission,
    updateSettings,
    exportData, importData, clearAllData,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
