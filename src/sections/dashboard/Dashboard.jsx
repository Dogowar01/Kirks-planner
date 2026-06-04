import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, isToday, isPast, parseISO, startOfDay, addDays, isWithinInterval, startOfMonth, endOfMonth, startOfYear } from 'date-fns'
import { Bell, Plus, Calendar, CheckSquare, Briefcase, TrendingUp } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { BUSINESSES } from '../../lib/constants'
import CategoryBadge from '../../components/CategoryBadge'
import Modal from '../../components/Modal'
import heroBg from '../../assets/art-newyork.jpg'

const CAT_COLORS = {
  signal9:  '#C4522A',
  app:      '#3B82F6',
  writing:  '#7C3AED',
  personal: '#7F77DD',
}

const WMO_CODES = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Showers', 81: 'Heavy showers', 82: 'Violent showers',
  95: 'Thunderstorm', 96: 'Hail storm', 99: 'Heavy hail storm',
}

function useWeather() {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weathercode,windspeed_10m&timezone=auto`
        )
        const json = await res.json()
        setData({
          temp: Math.round(json.current.temperature_2m),
          code: json.current.weathercode,
          wind: Math.round(json.current.windspeed_10m),
        })
      } catch {}
    }, () => {})
  }, [])

  return data
}

function useRates() {
  const [rates, setRates] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('https://api.frankfurter.app/latest?from=AUD&to=USD,JPY')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(json => {
        if (json.rates?.USD && json.rates?.JPY) setRates(json.rates)
        else setError(true)
      })
      .catch(() => setError(true))
  }, [])

  return { rates, error }
}

function LiveClock() {
  const [now, setNow] = useState(new Date())
  const weather = useWeather()
  const { rates, error: ratesError } = useRates()

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  const hour = now.getHours()
  const greeting = hour < 5 ? 'Still awake,' : hour < 12 ? 'Good morning,' : hour < 17 ? 'Good afternoon,' : 'Good evening,'

  return (
    <div className="relative overflow-hidden"
      style={{
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        minHeight: 200,
      }}>

      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 30%',
        opacity: 0.45,
      }} />

      {/* Gradient overlay to keep text readable */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(13,12,11,0.85) 0%, rgba(13,12,11,0.55) 60%, rgba(16,13,20,0.75) 100%)',
      }} />

      {/* Warm orb */}
      <div style={{
        position: 'absolute', top: -60, right: -40,
        width: 260, height: 260,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(196,82,42,0.14) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -80, left: 60,
        width: 200, height: 200,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.09) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div className="relative px-6 pt-10 pb-6">
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: '#5C5650', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
          {format(now, "EEEE · d MMMM yyyy")}
        </p>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: 'clamp(1.6rem, 5vw, 2.4rem)', color: '#EDE8E0', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          {greeting} Kirk.
        </h1>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', color: '#5C5650', marginTop: 6, marginBottom: 16 }}>
          {format(now, "HH:mm")}
        </p>

        {/* Live data strip */}
        <div className="flex gap-4 flex-wrap" style={{ marginTop: 4 }}>
          {/* Weather */}
          {weather && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '1.4rem', color: '#EDE8E0' }}>
                {weather.temp}°
              </span>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#5C5650', letterSpacing: '0.08em' }}>
                {WMO_CODES[weather.code] || 'Unknown'} · {weather.wind} km/h
              </span>
            </div>
          )}

          {/* Divider */}
          {weather && (rates || ratesError) && (
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', alignSelf: 'center' }} />
          )}

          {/* Exchange rates */}
          {(rates || ratesError) && (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#5C5650', letterSpacing: '0.1em', textTransform: 'uppercase' }}>USD</span>
                <span style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '1.1rem', color: '#9A9088' }}>
                  {rates ? rates.USD?.toFixed(4) : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#5C5650', letterSpacing: '0.1em', textTransform: 'uppercase' }}>JPY</span>
                <span style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '1.1rem', color: '#9A9088' }}>
                  {rates ? rates.JPY?.toFixed(2) : '—'}
                </span>
              </div>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#3D3A36', alignSelf: 'center' }}>1 AUD</span>
            </>
          )}

          {/* Loading states */}
          {!weather && (
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#3D3A36' }}>loading weather…</span>
          )}
        </div>
      </div>
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

const aud = (n) => Math.abs(n).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })

const BIZ_COLORS = { signal9: '#C4522A', app: '#3B82F6' }
const BIZ_LABELS = { signal9: 'Signal9 Studio', app: 'App Development' }

const BIZ_CATS = {
  signal9: ['Print', 'Market', 'Commission', 'Workshop', 'Digital', 'Other'],
  app:     ['Gumroad', 'App Store', 'Freelance', 'Consulting', 'Subscription', 'Other'],
}
const EXPENSE_CATS = {
  signal9: ['Supplies', 'Printing', 'Market Fees', 'Software', 'Equipment', 'Marketing', 'Other'],
  app:     ['Software', 'Hosting', 'Tools', 'Marketing', 'Equipment', 'Freelance', 'Other'],
}

function QuickEntryForm({ onSave, onClose }) {
  const [form, setForm] = useState({ businessId: 'signal9', type: 'income', date: format(new Date(), 'yyyy-MM-dd'), amount: '', category: 'Print', source: '', note: '' })
  const f = k => e => setForm(s => ({ ...s, [k]: e.target.value }))

  function handleBizChange(e) {
    const biz = e.target.value
    setForm(s => ({ ...s, businessId: biz, category: (s.type === 'income' ? BIZ_CATS[biz] : EXPENSE_CATS[biz])?.[0] || 'Other' }))
  }
  function handleTypeChange(t) {
    setForm(s => ({ ...s, type: t, category: (t === 'income' ? BIZ_CATS[s.businessId] : EXPENSE_CATS[s.businessId])?.[0] || 'Other' }))
  }

  const cats = form.type === 'income' ? (BIZ_CATS[form.businessId] || []) : (EXPENSE_CATS[form.businessId] || [])

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, amount: Number(form.amount) }) }} className="space-y-4">
      {/* Type toggle */}
      <div className="flex gap-2">
        {['income', 'expense'].map(t => (
          <button key={t} type="button" onClick={() => handleTypeChange(t)}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              fontFamily: '"DM Mono", monospace', letterSpacing: '0.08em', textTransform: 'uppercase',
              background: form.type === t ? (t === 'income' ? 'rgba(45,158,90,0.2)' : 'rgba(220,38,38,0.15)') : '#1F1C19',
              color: form.type === t ? (t === 'income' ? '#2D9E5A' : '#DC2626') : '#9A9088',
            }}>
            {t === 'income' ? '+ Income' : '− Expense'}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Business</label>
          <select className="input" value={form.businessId} onChange={handleBizChange}>
            <option value="signal9">Signal9 Studio</option>
            <option value="app">App Development</option>
          </select>
        </div>
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Date</label>
          <input type="date" className="input" value={form.date} onChange={f('date')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Amount (AUD) *</label>
          <input required type="number" step="0.01" min="0.01" className="input" value={form.amount} onChange={f('amount')} placeholder="350.00" />
        </div>
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Category</label>
          <select className="input" value={form.category} onChange={f('category')}>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-text-secondary text-xs mb-1 block">{form.type === 'income' ? 'Source' : 'Payee'} *</label>
        <input required className="input" value={form.source} onChange={f('source')}
          placeholder={form.type === 'income' ? 'e.g. Harvest Market' : 'e.g. Officeworks'} />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary">Save Entry</button>
      </div>
    </form>
  )
}

function BusinessLedger({ onNavigate }) {
  const { finance, addFinanceEntry } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const { entries = [], goals = {} } = finance

  const now = new Date()
  const mStart = startOfMonth(now)
  const mEnd   = endOfMonth(now)
  const yStart = startOfYear(now)

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#5C5650', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          Business Ledger
        </p>
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)} className="btn-ghost text-xs py-1"><Plus size={12}/> Entry</button>
          <button onClick={onNavigate} style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#5C5650', letterSpacing: '0.1em' }}>
            FINANCE →
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {['signal9', 'app'].map(bizId => {
          const color = BIZ_COLORS[bizId]
          const label = BIZ_LABELS[bizId]
          const bizEntries = entries.filter(e => e.businessId === bizId)

          const monthEntries = bizEntries.filter(e => { const d = parseISO(e.date); return d >= mStart && d <= mEnd })
          const monthIncome  = monthEntries.filter(e => (e.type || 'income') === 'income').reduce((a, e) => a + e.amount, 0)
          const monthExpense = monthEntries.filter(e => e.type === 'expense').reduce((a, e) => a + e.amount, 0)
          const monthNet     = monthIncome - monthExpense

          const ytdIncome  = bizEntries.filter(e => parseISO(e.date) >= yStart && (e.type || 'income') === 'income').reduce((a, e) => a + e.amount, 0)
          const ytdExpense = bizEntries.filter(e => parseISO(e.date) >= yStart && e.type === 'expense').reduce((a, e) => a + e.amount, 0)
          const ytdNet     = ytdIncome - ytdExpense

          const monthGoal = goals[bizId]?.monthly || 0
          const progress  = monthGoal > 0 ? Math.min(monthIncome / monthGoal, 1) : 0
          const recent    = [...bizEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)

          return (
            <div key={bizId} className="card" style={{ borderColor: color + '22' }}>
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#9A9088', letterSpacing: '0.08em', flex: 1 }}>{label}</p>
              </div>

              {/* P&L strip */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#5C5650', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Income</p>
                  <p style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '1rem', color: '#2D9E5A', lineHeight: 1 }}>{aud(monthIncome)}</p>
                </div>
                <div>
                  <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#5C5650', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Outgoings</p>
                  <p style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '1rem', color: monthExpense > 0 ? '#DC2626' : '#5C5650', lineHeight: 1 }}>{aud(monthExpense)}</p>
                </div>
                <div>
                  <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#5C5650', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Net</p>
                  <p style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '1rem', color: monthNet >= 0 ? '#2D9E5A' : '#DC2626', lineHeight: 1 }}>
                    {monthNet < 0 ? '−' : ''}{aud(monthNet)}
                  </p>
                </div>
              </div>

              {/* Goal progress bar */}
              {monthGoal > 0 && (
                <div className="mb-3">
                  <div className="h-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-0.5 rounded-full transition-all duration-500"
                      style={{ width: `${progress * 100}%`, backgroundColor: progress >= 1 ? '#2D9E5A' : color }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: '#5C5650' }}>
                      {Math.round(progress * 100)}% of {aud(monthGoal)} goal
                    </p>
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: '#5C5650' }}>
                      YTD net: <span style={{ color: ytdNet >= 0 ? '#2D9E5A' : '#DC2626' }}>{ytdNet < 0 ? '−' : ''}{aud(ytdNet)}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Recent entries mini-ledger */}
              {recent.length > 0 && (
                <div className="space-y-1.5 pt-2" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
                  {recent.map(e => {
                    const isExp = e.type === 'expense'
                    return (
                      <div key={e.id} className="flex items-center gap-2">
                        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#5C5650', width: 38, flexShrink: 0 }}>
                          {format(parseISO(e.date), 'dd MMM')}
                        </p>
                        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: isExp ? '#DC2626' : '#2D9E5A', width: 22, flexShrink: 0 }}>
                          {isExp ? 'EXP' : 'INC'}
                        </p>
                        <p className="flex-1 min-w-0 truncate" style={{ fontSize: '0.7rem', color: '#9A9088' }}>{e.source}</p>
                        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: isExp ? '#DC2626' : '#EDE8E0', fontWeight: 600, flexShrink: 0 }}>
                          {isExp ? '−' : '+'}{aud(e.amount)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}

              {recent.length === 0 && (
                <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#3D3A36' }}>No entries yet.</p>
              )}
            </div>
          )
        })}
      </div>

      {showAdd && (
        <Modal title="Add Entry" onClose={() => setShowAdd(false)}>
          <QuickEntryForm
            onSave={(data) => { addFinanceEntry(data); setShowAdd(false) }}
            onClose={() => setShowAdd(false)} />
        </Modal>
      )}
    </section>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { tasks, events, projects, notes, addTask } = useStore()

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

        {/* Business Ledger */}
        <BusinessLedger onNavigate={() => navigate('/finance')} />

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
