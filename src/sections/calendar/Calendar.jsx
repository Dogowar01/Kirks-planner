import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, parseISO, isSameDay, addMonths, subMonths, addDays } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Bell, Trash2, Search, MapPin, ExternalLink } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { CATEGORIES } from '../../lib/constants'
import SectionShell from '../../components/SectionShell'
import bgImg from '../../assets/art-abstract.jpg'
import CategoryBadge from '../../components/CategoryBadge'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'

const QUICK_FILTERS = [
  { label: 'Market',     q: 'market' },
  { label: 'Art',        q: 'art exhibition' },
  { label: 'Craft fair', q: 'craft fair' },
  { label: 'Community',  q: 'community' },
  { label: 'Festival',   q: 'festival' },
  { label: 'Food',       q: 'food market' },
]

function EventSearchModal({ onClose, onAdd }) {
  const [location, setLocation] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [quickAdd, setQuickAdd] = useState({ title: '', date: format(new Date(), 'yyyy-MM-dd'), time: '' })

  function openGoogle(q) {
    const keyword = q || activeFilter || 'local events'
    const loc = location.trim() || 'near me'
    const query = encodeURIComponent(`${keyword} ${loc}`)
    window.open(`https://www.google.com/search?q=${query}&ibp=htl;events`, '_blank', 'noopener,noreferrer')
  }

  function handleQuickAdd(e) {
    e.preventDefault()
    if (!quickAdd.title) return
    onAdd({
      title: quickAdd.title,
      date: quickAdd.date,
      time: quickAdd.time,
      endTime: '',
      category: 'personal',
      note: '',
      reminder: true,
      reminderMinutes: 1440,
      recurring: 'none',
    })
    setQuickAdd({ title: '', date: format(new Date(), 'yyyy-MM-dd'), time: '' })
  }

  return (
    <Modal title="Find Local Events" onClose={onClose}>
      <div className="space-y-4">
        <p style={{ color: '#9A9088', fontSize: '0.8rem', lineHeight: 1.5 }}>
          Search Google Events — it aggregates Eventbrite, Facebook, Humanitix, council sites and more. No account needed.
        </p>

        {/* Quick filter chips */}
        <div className="flex gap-1.5 flex-wrap">
          {QUICK_FILTERS.map(f => (
            <button key={f.q}
              onClick={() => setActiveFilter(activeFilter === f.q ? '' : f.q)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
              style={{
                background: activeFilter === f.q ? 'rgba(59,130,246,0.2)' : '#1F1C19',
                color: activeFilter === f.q ? '#3B82F6' : '#9A9088',
                fontFamily: '"DM Mono", monospace',
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Location + search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#5C5650' }} />
            <input className="input pl-8" placeholder="Suburb or city…" value={location}
              onChange={e => setLocation(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && openGoogle()} />
          </div>
          <button onClick={() => openGoogle()} className="btn-primary shrink-0 flex items-center gap-1.5">
            <ExternalLink size={14} /> Search
          </button>
        </div>

        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#5C5650' }}>
          Opens Google Events in a new tab · find what you like · come back and add it below
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

        {/* Quick-add form */}
        <div>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#5C5650', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
            Add to calendar
          </p>
          <form onSubmit={handleQuickAdd} className="space-y-3">
            <input required className="input" placeholder="Event name" value={quickAdd.title}
              onChange={e => setQuickAdd(s => ({ ...s, title: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <input type="date" className="input" value={quickAdd.date}
                onChange={e => setQuickAdd(s => ({ ...s, date: e.target.value }))} />
              <input type="time" className="input" value={quickAdd.time}
                onChange={e => setQuickAdd(s => ({ ...s, time: e.target.value }))} />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={onClose} className="btn-ghost">Done</button>
              <button type="submit" className="btn-primary"><Plus size={14} /> Add Event</button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  )
}

function EventForm({ initial = {}, onSave, onClose }) {
  const [form, setForm] = useState({
    title: '', date: format(new Date(), 'yyyy-MM-dd'), time: '', endTime: '',
    category: 'personal', note: '', reminder: false, reminderMinutes: 30, recurring: 'none',
    ...initial
  })
  const f = k => e => setForm(s => ({ ...s, [k]: e.target.value }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Title *</label>
        <input required className="input" value={form.title} onChange={f('title')} placeholder="Event name" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="text-text-secondary text-xs mb-1 block">Date *</label>
          <input required type="date" className="input" value={form.date} onChange={f('date')} />
        </div>
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Category</label>
          <select className="input" value={form.category} onChange={f('category')}>
            {Object.entries(CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Start Time</label>
          <input type="time" className="input" value={form.time} onChange={f('time')} />
        </div>
        <div>
          <label className="text-text-secondary text-xs mb-1 block">End Time</label>
          <input type="time" className="input" value={form.endTime} onChange={f('endTime')} />
        </div>
      </div>
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Recurring</label>
        <select className="input" value={form.recurring} onChange={f('recurring')}>
          <option value="none">One-time</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="ev-rem" checked={form.reminder} onChange={e => setForm(s => ({ ...s, reminder: e.target.checked }))} className="accent-signal9" />
        <label htmlFor="ev-rem" className="text-text-secondary text-sm">Set reminder</label>
        {form.reminder && (
          <select className="input w-auto text-xs ml-2" value={form.reminderMinutes} onChange={f('reminderMinutes')}>
            <option value={15}>15 min before</option>
            <option value={30}>30 min before</option>
            <option value={60}>1 hr before</option>
            <option value={1440}>1 day before</option>
          </select>
        )}
      </div>
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Note</label>
        <textarea className="input h-20 resize-none" value={form.note} onChange={f('note')} />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary">Save Event</button>
      </div>
    </form>
  )
}

function expandRecurring(events, viewStart, viewEnd) {
  const result = []
  for (const ev of events) {
    result.push(ev)
    if (ev.recurring === 'none') continue
    const base = parseISO(ev.date)
    for (let i = 1; i <= 52; i++) {
      const d = ev.recurring === 'weekly' ? addDays(base, 7 * i) : addMonths(base, i)
      if (d > viewEnd) break
      if (d >= viewStart) result.push({ ...ev, id: `${ev.id}_r${i}`, date: format(d, 'yyyy-MM-dd'), _recurring: true })
    }
  }
  return result
}

export default function Calendar() {
  const { events, addEvent, updateEvent, deleteEvent } = useStore()
  const [month, setMonth] = useState(new Date())
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addDate, setAddDate] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const expanded = expandRecurring(events, calStart, calEnd)

  function eventsOnDay(day) {
    return expanded.filter(e => isSameDay(parseISO(e.date), day))
      .sort((a,b) => (a.time||'').localeCompare(b.time||''))
  }

  const upcoming = [...events]
    .filter(e => parseISO(e.date) >= startOfMonth(new Date()))
    .sort((a,b) => a.date.localeCompare(b.date) || (a.time||'').localeCompare(b.time||''))
    .slice(0, 14)

  return (
    <SectionShell accent="#3B82F6" bgImage={bgImg}>
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title" style={{ color: '#3B82F6' }}>Calendar</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowSearch(true)} className="btn-ghost text-xs">
            <Search size={14} /> Find Events
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-xs">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => setMonth(m => subMonths(m, 1))} className="btn-ghost p-2"><ChevronLeft size={16}/></button>
        <button onClick={() => setMonth(new Date())} className="text-text-secondary text-sm hover:text-text-primary flex-1 text-center font-display font-semibold text-lg text-text-primary">
          {format(month, 'MMMM yyyy')}
        </button>
        <button onClick={() => setMonth(m => addMonths(m, 1))} className="btn-ghost p-2"><ChevronRight size={16}/></button>
      </div>

      {/* Category legend */}
      <div className="flex gap-3 flex-wrap mb-4">
        {Object.entries(CATEGORIES).map(([k,v]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs text-text-tertiary">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
            {v.label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-text-tertiary py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-bg-elevated rounded-card overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {days.map(day => {
          const dayEvents = eventsOnDay(day)
          const isCurrentMonth = isSameMonth(day, month)
          const isSelectedDay = selected && isSameDay(day, selected)
          return (
            <button key={day.toISOString()}
              onClick={() => { setSelected(day); setAddDate(format(day, 'yyyy-MM-dd')) }}
              className={`min-h-[60px] p-1.5 text-left transition-colors ${isCurrentMonth ? 'bg-bg-surface' : 'bg-bg-base'} ${isSelectedDay ? 'ring-1 ring-signal9' : ''} hover:bg-bg-elevated`}>
              <span className={`text-xs font-mono ${isToday(day) ? 'w-5 h-5 rounded-full bg-signal9 text-white flex items-center justify-center text-[10px]' : isCurrentMonth ? 'text-text-primary' : 'text-text-tertiary'}`}>
                {format(day, 'd')}
              </span>
              <div className="flex gap-0.5 flex-wrap mt-1">
                {dayEvents.slice(0,3).map((e, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORIES[e.category]?.color }} />
                ))}
                {dayEvents.length > 3 && <span className="text-[8px] text-text-tertiary">+{dayEvents.length - 3}</span>}
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected day events */}
      {selected && eventsOnDay(selected).length > 0 && (
        <div className="mt-4">
          <p className="text-text-tertiary text-xs font-medium uppercase tracking-wide mb-2">
            {format(selected, 'EEEE, d MMMM')}
          </p>
          <div className="space-y-2">
            {eventsOnDay(selected).map(ev => (
              <div key={ev.id} className="card flex items-start gap-3">
                <div className="w-1 h-full min-h-[32px] rounded-full shrink-0" style={{ backgroundColor: CATEGORIES[ev.category]?.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-sm font-medium">{ev.title}</p>
                  {ev.time && <p className="text-text-tertiary text-xs font-mono">{ev.time}{ev.endTime ? ` – ${ev.endTime}` : ''}</p>}
                  {ev.note && <p className="text-text-tertiary text-xs mt-1">{ev.note}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {ev.reminder && <Bell size={12} className="text-text-tertiary"/>}
                  {!ev._recurring && (
                    <>
                      <button onClick={() => setEditEvent(ev)} className="text-text-tertiary hover:text-text-secondary text-xs p-1">Edit</button>
                      <button onClick={() => setDeleteId(ev.id)} className="p-1 text-text-tertiary hover:text-red-400"><Trash2 size={14}/></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming list */}
      <div className="mt-6">
        <h2 className="text-text-tertiary text-xs font-medium uppercase tracking-wide mb-3">Upcoming</h2>
        {upcoming.length === 0
          ? <p className="text-text-tertiary text-sm">No upcoming events.</p>
          : <div className="space-y-2">
              {upcoming.map(ev => (
                <div key={ev.id} className="card flex items-center gap-3">
                  <div className="shrink-0 w-10 text-center">
                    <p className="text-text-tertiary text-[10px] font-mono uppercase">{format(parseISO(ev.date), 'MMM')}</p>
                    <p className="text-text-primary font-mono font-semibold text-lg leading-none">{format(parseISO(ev.date), 'd')}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm truncate">{ev.title}</p>
                    {ev.time && <p className="text-text-tertiary text-xs font-mono">{ev.time}</p>}
                  </div>
                  <CategoryBadge category={ev.category} size="xs" />
                  {ev.reminder && <Bell size={12} className="text-text-tertiary"/>}
                </div>
              ))}
            </div>
        }
      </div>

      {(showAdd || addDate) && !editEvent && (
        <Modal title="Add Event" onClose={() => { setShowAdd(false); setAddDate(null) }}>
          <EventForm initial={addDate ? { date: addDate } : {}}
            onSave={(data) => { addEvent(data); setShowAdd(false); setAddDate(null) }}
            onClose={() => { setShowAdd(false); setAddDate(null) }} />
        </Modal>
      )}

      {editEvent && (
        <Modal title="Edit Event" onClose={() => setEditEvent(null)}>
          <EventForm initial={editEvent}
            onSave={(data) => { updateEvent(editEvent.id, data); setEditEvent(null) }}
            onClose={() => setEditEvent(null)} />
        </Modal>
      )}

      {deleteId && (
        <ConfirmDialog title="Delete Event" message="Delete this event?"
          onConfirm={() => { deleteEvent(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)} />
      )}

      {showSearch && (
        <EventSearchModal
          onClose={() => setShowSearch(false)}
          onAdd={(data) => { addEvent(data) }}
        />
      )}
    </div>
    </SectionShell>
  )
}
