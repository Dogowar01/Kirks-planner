import { useEffect, useRef, useCallback } from 'react'
import { useStore } from './useStore'

// How many minutes before a reminder we fire the notification
const LEAD_MINUTES = 0
const CHECK_INTERVAL_MS = 60 * 1000 // every 60 s

function parseReminderDate(task) {
  if (!task.reminder || !task.reminderDate) return null
  const dateStr = task.reminderDate
  const timeStr = task.reminderTime || '09:00'
  // Combine into ISO-ish string: "2026-06-05T09:00:00"
  try {
    return new Date(`${dateStr}T${timeStr}:00`)
  } catch {
    return null
  }
}

function parseEventReminderDate(event) {
  if (!event.reminder) return null
  // Events store reminder as reminderDate (a date string) or fall back to start date
  const dateStr = event.reminderDate || event.start
  if (!dateStr) return null
  try {
    // If dateStr already has a T it's ISO; otherwise treat as date at 08:00
    if (dateStr.includes('T')) return new Date(dateStr)
    return new Date(`${dateStr}T08:00:00`)
  } catch {
    return null
  }
}

async function fireNotification(title, body, tag) {
  // Mark as fired in sessionStorage so we don't re-fire in the same session
  const key = `notif_fired_${tag}`
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, '1')

  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  try {
    const reg = await navigator.serviceWorker?.ready
    if (reg?.showNotification) {
      await reg.showNotification(title, {
        body,
        tag,
        icon: '/Kirks-planner/icons/icon-192.png',
        badge: '/Kirks-planner/icons/icon-192.png',
        vibrate: [200, 100, 200],
      })
    } else {
      new Notification(title, { body, tag })
    }
  } catch (err) {
    // Fallback to basic Notification if SW not available
    try { new Notification(title, { body, tag }) } catch {}
  }
}

function checkReminders(tasks, events) {
  const now = new Date()

  // Tasks
  for (const task of tasks) {
    if (task.done) continue
    const fireAt = parseReminderDate(task)
    if (!fireAt) continue
    const diffMs = fireAt - now + LEAD_MINUTES * 60 * 1000
    // Fire if within the past 5 minutes or up to 1 minute in the future
    if (diffMs >= -5 * 60 * 1000 && diffMs <= 60 * 1000) {
      fireNotification(
        '📋 Task Reminder',
        task.title || task.text || 'You have a task due',
        `task-${task.id}`
      )
    }
  }

  // Events
  for (const event of events) {
    const fireAt = parseEventReminderDate(event)
    if (!fireAt) continue
    const diffMs = fireAt - now + LEAD_MINUTES * 60 * 1000
    if (diffMs >= -5 * 60 * 1000 && diffMs <= 60 * 1000) {
      fireNotification(
        '📅 Event Reminder',
        event.title || 'You have an event',
        `event-${event.id}`
      )
    }
  }
}

export function useNotifications() {
  const { tasks, events, settings, updateSettings } = useStore()
  const intervalRef = useRef(null)

  // Run a check
  const runCheck = useCallback(() => {
    checkReminders(tasks, events)
  }, [tasks, events])

  // Start polling when notifications are enabled
  useEffect(() => {
    if (!settings?.notificationsEnabled) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    // Immediate check
    runCheck()
    // Then every 60 s
    intervalRef.current = setInterval(runCheck, CHECK_INTERVAL_MS)
    return () => clearInterval(intervalRef.current)
  }, [settings?.notificationsEnabled, runCheck])

  // Request permission and enable in settings
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported'
    if (Notification.permission === 'granted') {
      updateSettings({ notificationsEnabled: true })
      return 'granted'
    }
    const result = await Notification.requestPermission()
    if (result === 'granted') {
      updateSettings({ notificationsEnabled: true })
    }
    return result
  }, [updateSettings])

  const disable = useCallback(() => {
    updateSettings({ notificationsEnabled: false })
  }, [updateSettings])

  return {
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
    enabled: !!settings?.notificationsEnabled,
    requestPermission,
    disable,
  }
}
