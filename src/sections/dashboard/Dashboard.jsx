import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, isToday, isPast, parseISO, startOfDay, addDays, isWithinInterval } from 'date-fns'
import { Bell, Plus, Calendar, CheckSquare, Briefcase } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { BUSINESSES } from '../../lib/constants'
import CategoryBadge from '../../components/CategoryBadge'

const CAT_COLORS = {
  signal9:  '#C4522A',
  app:      '#3B82F6',
  writing:  '#7C3AED',
  personal: '#7F77DD',
}

function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  const hour = now.getHours()
  const greeting = hour < 5 ? 'Still awake,' : hour < 12 ? 'Good morning,' : hour < 17 ? 'Good afternoon,' : 'Good evening,'

  return (
    <div className="relative px-6 pt-10 pb-8 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #111009 0%, #0D0C0B 50%, #100D14 100%)',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
      }}>

      {/* Atmospheric orb — pulled from the triptych painting */}
      <div style={{
        position: 'absolute', top: -60, right: -40,
        width: 240, height: 240,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(196,82,42,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -80, left: 60,
        width: 180, height: 180,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: '#5C5650', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
        {format(now, "EEEE · d MMMM yyyy")}
      </p>
      <h1 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: 'clamp(1.6rem, 5vw, 2.4rem)', color: '#EDE8E0', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
        {greeting} Kirk.
      </h1>
      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', color: '#5C5650', marginTop: 8 }}>
        {format(now, "HH:mm")}
      </p>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <button onClick={onClick} className="card text-left w-full transition-all duration-150 hover:border-white/10 group">
      <div className="flex items-start justify-between">
        <div>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#5C5650', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>
            {label}
          </p>
          <p style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '2rem', color: '#EDE8E0', lineHeight: 1 }}>
            {value}
          </p>
        </div>
        <div className="p-2 rounded-lg mt-1" style={{ background: color + '18' }}>
          <Icon size={16} style={{ color }} strokeWidth={1.5} />
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
    <div className="flex gap-2 items-center"
      style={{ background: '#161412', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 12px' }}>
      <select value={category} onChange={e => setCategory(e.target.value)}
        className="text-xs py-1 px-2 rounded-md outline-none shrink-0"
        style={{ background: '#1F1C19', color: '#9A9088', border: '0.5px solid rgba(255,255,255,0.08)', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem' }}>
        <option value="signal9">Signal9</option>
        <option value="app">App Dev</option>
        <option value="writing">Writing</option>
        <option value="personal">Personal</option>
      </select>
      <input
        className="flex-1 bg-transparent outline-none text-sm"
        style={{ color: '#EDE8E0', fontFamily: '"DM Sans", sans-serif' }}
        placeholder="Quick-add a task… press Enter"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKey}
      />
      <button onClick={() => { if (text.trim()) { onAdd({ text: text.trim(), category }); setText('') }}}
        style={{ background: '#C4522A', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem' }}>
        <Plus size={14} />
      </button>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#5C5650', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>
      {children}
    </p>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { tasks, events, projects, notes, settings, addTask } = useStore()

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
      const pd = { high: 0, normal: 1, low: 2 }
      if (pd[a.priority] !== pd[b.priority]) return pd[a.priority] - pd[b.priority]
      return a.createdAt.localeCompare(b.createdAt)
    })
    .slice(0, 5)

  const next5Events = [...events]
    .filter(e => !isPast(parseISO(e.date)) || isToday(parseISO(e.date)))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
    .slice(0, 5)

  return (
    <div>
      <LiveClock />

      <div className="p-5 md:p-6 max-w-3xl space-y-7">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={CheckSquare} label="Open Tasks"      value={openTasks.length}       color="#C4522A" onClick={() => navigate('/tasks')} />
          <StatCard icon={Calendar}    label="Events (7d)"     value={upcomingEvents.length}   color="#3B82F6" onClick={() => navigate('/calendar')} />
          <StatCard icon={Briefcase}   label="Active Projects" value={activeProjects.length}   color="#7C3AED" onClick={() => navigate('/businesses')} />
        </div>

        {/* Quick Add */}
        <QuickAdd onAdd={(data) => addTask(data)} />

        {/* Today */}
        {todayEvents.length > 0 && (
          <section>
            <SectionLabel>Today</SectionLabel>
            <div className="space-y-2">
              {todayEvents.map(ev => (
                <button key={ev.id} onClick={() => navigate('/calendar')}
                  className="card w-full text-left flex items-center gap-3 hover:border-white/10 transition-colors">
                  <div className="w-0.5 h-8 rounded-full shrink-0" style={{ background: CAT_COLORS[ev.category] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: '#EDE8E0' }}>{ev.title}</p>
                    {ev.time && <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: '#5C5650' }}>{ev.time}{ev.endTime ? ` — ${ev.endTime}` : ''}</p>}
                  </div>
                  {ev.reminder && <Bell size={11} style={{ color: '#5C5650' }} />}
                  <CategoryBadge category={ev.category} size="xs" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Top tasks */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <SectionLabel>Active Tasks</SectionLabel>
            <button onClick={() => navigate('/tasks')} style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#5C5650', letterSpacing: '0.1em' }}>
              ALL →
            </button>
          </div>
          {topTasks.length === 0
            ? <p style={{ color: '#5C5650', fontSize: '0.875rem' }}>No open tasks.</p>
            : <div className="space-y-2">
                {topTasks.map(t => (
                  <button key={t.id} onClick={() => navigate('/tasks')}
                    className="card w-full text-left flex items-center gap-3 hover:border-white/10 transition-colors">
                    <div className="w-3.5 h-3.5 rounded-sm border shrink-0" style={{ borderColor: CAT_COLORS[t.category] + '80' }} />
                    <p className="text-sm flex-1 min-w-0 truncate" style={{ color: '#9A9088' }}>{t.text}</p>
                    {t.reminder && <Bell size={11} style={{ color: '#5C5650' }} />}
                    {t.priority === 'high' && <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#C4522A', letterSpacing: '0.1em' }}>HIGH</span>}
                  </button>
                ))}
              </div>
          }
        </section>

        {/* Business pulse */}
        <section>
          <SectionLabel>Business Pulse</SectionLabel>
          <div className="space-y-2">
            {Object.entries(BUSINESSES).map(([id, biz]) => {
              const bizProjects = projects.filter(p => p.businessId === id && p.status === 'active')
              const latestNote = notes.filter(n => n.category === id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
              const color = CAT_COLORS[id] || biz.color
              return (
                <button key={id} onClick={() => navigate('/businesses')}
                  className="card w-full text-left flex items-center gap-3 hover:border-white/10 transition-colors group">
                  <div className="w-0.5 h-10 rounded-full shrink-0" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium" style={{ color: '#EDE8E0' }}>{biz.label}</p>
                      <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#5C5650' }}>{bizProjects.length} active</span>
                    </div>
                    {latestNote && <p className="text-xs truncate mt-0.5" style={{ color: '#5C5650' }}>{latestNote.title}</p>}
                  </div>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#5C5650' }}>→</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Upcoming */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <SectionLabel>Upcoming</SectionLabel>
            <button onClick={() => navigate('/calendar')} style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#5C5650', letterSpacing: '0.1em' }}>
              CALENDAR →
            </button>
          </div>
          {next5Events.length === 0
            ? <p style={{ color: '#5C5650', fontSize: '0.875rem' }}>No upcoming events.</p>
            : <div className="space-y-2">
                {next5Events.map(ev => (
                  <button key={ev.id} onClick={() => navigate('/calendar')}
                    className="card w-full text-left flex items-center gap-3 hover:border-white/10 transition-colors">
                    <div className="shrink-0 text-center w-9">
                      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#5C5650', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {format(parseISO(ev.date), 'MMM')}
                      </p>
                      <p style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '1.3rem', color: '#EDE8E0', lineHeight: 1 }}>
                        {format(parseISO(ev.date), 'd')}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: '#9A9088' }}>{ev.title}</p>
                      {ev.time && <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: '#5C5650' }}>{ev.time}</p>}
                    </div>
                    <CategoryBadge category={ev.category} size="xs" />
                  </button>
                ))}
              </div>
          }
        </section>
      </div>
    </div>
  )
}
