import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, isToday, isFuture, isPast, parseISO, startOfDay, addDays, isWithinInterval } from 'date-fns'
import { Bell, Plus, TrendingUp, Calendar, CheckSquare, Briefcase } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { CATEGORIES, BUSINESSES } from '../../lib/constants'
import CategoryBadge from '../../components/CategoryBadge'

function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-text-primary">
        Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}, Kirk.
      </h1>
      <p className="text-text-tertiary text-sm mt-1 font-mono">
        {format(now, "EEEE, d MMMM yyyy · HH:mm")}
      </p>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <button onClick={onClick} className="card text-left w-full hover:bg-bg-elevated transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-tertiary text-xs font-medium uppercase tracking-wide mb-2">{label}</p>
          <p className="text-3xl font-semibold text-text-primary font-mono">{value}</p>
        </div>
        <div className="p-2 rounded-lg" style={{ backgroundColor: color + '22' }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
    </button>
  )
}

function QuickAdd({ onAdd }) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState('personal')

  function handleKey(e) {
    if (e.key === 'Enter' && text.trim()) {
      onAdd({ text: text.trim(), category })
      setText('')
    }
  }

  return (
    <div className="card flex gap-2 items-center">
      <select value={category} onChange={e => setCategory(e.target.value)}
        className="input w-auto text-xs py-1.5 px-2 shrink-0">
        {Object.entries(CATEGORIES).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>
      <input
        className="input flex-1"
        placeholder="Quick-add a task… (Enter to save)"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKey}
      />
      <button onClick={() => { if (text.trim()) { onAdd({ text: text.trim(), category }); setText('') }}}
        className="btn-primary py-1.5 px-3">
        <Plus size={16} />
      </button>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { tasks, events, projects, notes, wordcount, settings, addTask } = useStore()

  const today = startOfDay(new Date())
  const in7 = addDays(today, 7)

  const openTasks = tasks.filter(t => !t.done)
  const upcomingEvents = events.filter(e => {
    const d = parseISO(e.date)
    return isWithinInterval(d, { start: today, end: in7 })
  })
  const activeProjects = projects.filter(p => p.status === 'active')

  const todayEvents = events
    .filter(e => isToday(parseISO(e.date)))
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))

  const topTasks = [...openTasks]
    .sort((a, b) => {
      if (a.reminder !== b.reminder) return b.reminder - a.reminder
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
      return a.createdAt.localeCompare(b.createdAt)
    })
    .slice(0, 5)

  const next5Events = [...events]
    .filter(e => !isPast(parseISO(e.date)) || isToday(parseISO(e.date)))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
    .slice(0, 5)

  return (
    <div className="p-4 md:p-6 max-w-4xl space-y-6">
      <LiveClock />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={CheckSquare} label="Open Tasks"    value={openTasks.length}      color="#D85A30" onClick={() => navigate('/tasks')} />
        <StatCard icon={Calendar}    label="Events (7d)"   value={upcomingEvents.length}  color="#378ADD" onClick={() => navigate('/calendar')} />
        <StatCard icon={Briefcase}   label="Active Projects" value={activeProjects.length} color="#1D9E75" onClick={() => navigate('/businesses')} />
      </div>

      {/* Quick Add */}
      <QuickAdd onAdd={(data) => addTask(data)} />

      {/* Today panel */}
      {todayEvents.length > 0 && (
        <section>
          <h2 className="text-text-tertiary text-xs font-medium uppercase tracking-wide mb-3">Today</h2>
          <div className="space-y-2">
            {todayEvents.map(ev => (
              <button key={ev.id} onClick={() => navigate('/calendar')}
                className="card w-full text-left flex items-center gap-3 hover:bg-bg-elevated transition-colors">
                <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: CATEGORIES[ev.category]?.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-sm font-medium truncate">{ev.title}</p>
                  {ev.time && <p className="text-text-tertiary text-xs font-mono">{ev.time}{ev.endTime ? ` – ${ev.endTime}` : ''}</p>}
                </div>
                {ev.reminder && <Bell size={12} className="text-text-tertiary shrink-0" />}
                <CategoryBadge category={ev.category} size="xs" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Top tasks */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-text-tertiary text-xs font-medium uppercase tracking-wide">Active Tasks</h2>
          <button onClick={() => navigate('/tasks')} className="text-text-tertiary text-xs hover:text-text-secondary">View all</button>
        </div>
        {topTasks.length === 0
          ? <p className="text-text-tertiary text-sm">No open tasks.</p>
          : <div className="space-y-2">
              {topTasks.map(t => (
                <button key={t.id} onClick={() => navigate('/tasks')}
                  className="card w-full text-left flex items-center gap-3 hover:bg-bg-elevated transition-colors">
                  <div className="w-4 h-4 rounded border shrink-0" style={{ borderColor: CATEGORIES[t.category]?.color }} />
                  <p className="text-text-primary text-sm flex-1 min-w-0 truncate">{t.text}</p>
                  {t.reminder && <Bell size={12} className="text-text-tertiary shrink-0" />}
                  <CategoryBadge category={t.category} size="xs" />
                </button>
              ))}
            </div>
        }
      </section>

      {/* Business pulse */}
      <section>
        <h2 className="text-text-tertiary text-xs font-medium uppercase tracking-wide mb-3">Business Pulse</h2>
        <div className="space-y-2">
          {Object.entries(BUSINESSES).map(([id, biz]) => {
            const bizProjects = projects.filter(p => p.businessId === id && p.status === 'active')
            const latestNote = notes.filter(n => n.category === id).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt))[0]
            return (
              <button key={id} onClick={() => navigate('/businesses')}
                className="card w-full text-left flex items-center gap-3 hover:bg-bg-elevated transition-colors">
                <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: biz.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-text-primary text-sm font-medium">{biz.label}</p>
                    <span className="text-text-tertiary text-xs">{bizProjects.length} active</span>
                  </div>
                  {latestNote && <p className="text-text-tertiary text-xs truncate mt-0.5">{latestNote.title}</p>}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Upcoming agenda */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-text-tertiary text-xs font-medium uppercase tracking-wide">Upcoming</h2>
          <button onClick={() => navigate('/calendar')} className="text-text-tertiary text-xs hover:text-text-secondary">Calendar</button>
        </div>
        {next5Events.length === 0
          ? <p className="text-text-tertiary text-sm">No upcoming events.</p>
          : <div className="space-y-2">
              {next5Events.map(ev => (
                <button key={ev.id} onClick={() => navigate('/calendar')}
                  className="card w-full text-left flex items-center gap-3 hover:bg-bg-elevated transition-colors">
                  <div className="shrink-0 text-center w-10">
                    <p className="text-text-tertiary text-[10px] font-mono uppercase">{format(parseISO(ev.date), 'MMM')}</p>
                    <p className="text-text-primary text-lg font-mono font-semibold leading-none">{format(parseISO(ev.date), 'd')}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm truncate">{ev.title}</p>
                    {ev.time && <p className="text-text-tertiary text-xs font-mono">{ev.time}</p>}
                  </div>
                  <CategoryBadge category={ev.category} size="xs" />
                </button>
              ))}
            </div>
        }
      </section>
    </div>
  )
}
