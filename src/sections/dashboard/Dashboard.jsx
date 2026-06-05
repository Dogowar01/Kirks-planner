import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, isToday, isPast, parseISO, startOfDay, addDays, isWithinInterval, startOfMonth, endOfMonth, differenceInDays } from 'date-fns'
import { Bell, Plus, Calendar, CheckSquare, Briefcase, TrendingUp, Target, Pencil, Trash2, X, ChevronRight } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { BUSINESSES } from '../../lib/constants'
import CategoryBadge from '../../components/CategoryBadge'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
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
  const [prev, setPrev] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const opts = { cache: 'no-store' }
    const base = 'https://api.frankfurter.dev/v1'
    const yesterday = new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10)
    Promise.all([
      fetch(`${base}/latest?from=AUD&to=USD,JPY`, opts).then(r => r.json()),
      fetch(`${base}/${yesterday}?from=AUD&to=USD,JPY`, opts).then(r => r.json()),
    ])
      .then(([today, prior]) => {
        if (today.rates?.USD) { setRates(today.rates); setPrev(prior.rates) }
        else setError(true)
      })
      .catch(() => setError(true))
  }, [])

  return { rates, prev, error }
}

const PLUM       = '#C084FC'
const PLUM_GLOW  = 'rgba(192,132,252,0.6)'
const PLUM_DIM   = 'rgba(192,132,252,0.45)'

function usePinnedCountdown(settings) {
  const [tick, setTick] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const pinnedId = settings?.pinnedCountdownId
  if (!pinnedId) return null

  let events = []
  try { events = JSON.parse(localStorage.getItem('s9_countdowns') || '[]') } catch {}
  const ev = events.find(e => e.id === pinnedId)
  if (!ev) return null

  const ms = new Date(ev.date).getTime() - tick
  if (ms <= 0) return { label: ev.label, date: ev.date, arrived: true }
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return { label: ev.label, date: ev.date, d, h, m, s, arrived: false }
}

function LiveClock() {
  const [now, setNow] = useState(new Date())
  const weather = useWeather()
  const { rates, prev, error: ratesError } = useRates()
  const { settings } = useStore()
  const pinned = usePinnedCountdown(settings)

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
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: '#A09890', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
          {format(now, "EEEE · d MMMM yyyy")}
        </p>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: 'clamp(1.6rem, 5vw, 2.4rem)', color: '#EDE8E0', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          {greeting} Kirk.
        </h1>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', color: '#A09890', marginTop: 6, marginBottom: 16 }}>
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
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#A09890', letterSpacing: '0.08em' }}>
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
              {[['USD', 4], ['JPY', 2]].map(([ccy, dp]) => {
                const val = rates?.[ccy]
                const pval = prev?.[ccy]
                const up = val && pval ? val > pval : null
                return (
                  <div key={ccy} style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#A09890', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{ccy}</span>
                    <span style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '1.1rem', color: '#C8BFB5' }}>
                      {val ? val.toFixed(dp) : '—'}
                    </span>
                    {up !== null && (
                      <span style={{ fontSize: '0.65rem', lineHeight: 1, alignSelf: 'center', color: up ? '#4ade80' : '#f87171' }}>
                        {up ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                )
              })}
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#7A7470', alignSelf: 'center' }}>1 AUD</span>
            </>
          )}

          {/* Loading states */}
          {!weather && (
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#7A7470' }}>loading weather…</span>
          )}
          {!rates && !ratesError && (
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#7A7470' }}>loading rates…</span>
          )}
        </div>

        {/* Pinned countdown */}
        {pinned && (
          <div style={{
            marginTop: 16,
            padding: '12px 14px',
            borderRadius: 10,
            background: 'rgba(192,132,252,0.06)',
            border: `0.5px solid ${PLUM}30`,
            boxShadow: `0 0 20px ${PLUM}10`,
          }}>
            {/* Label row */}
            <div className="flex items-center gap-2 mb-2">
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: PLUM, boxShadow: `0 0 6px ${PLUM_GLOW}`, flexShrink: 0, display: 'block' }} />
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: PLUM_DIM, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.9 }}>
                {pinned.label}
              </p>
            </div>

            {pinned.arrived ? (
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', color: PLUM }}>🎉 This day has arrived!</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: 8, justifyContent: 'start' }}>
                {[['d', pinned.d, 'Days'], ['h', pinned.h, 'Hrs'], ['m', pinned.m, 'Min'], ['s', pinned.s, 'Sec']].map(([k, val, lbl]) => (
                  <div key={k} style={{ textAlign: 'center', minWidth: 42 }}>
                    <p style={{
                      fontFamily: '"Share Tech Mono", "DM Mono", monospace',
                      fontSize: '1.6rem',
                      lineHeight: 1,
                      color: PLUM,
                      textShadow: `0 0 16px ${PLUM_GLOW}, 0 0 30px ${PLUM}50`,
                      letterSpacing: '-0.02em',
                    }}>
                      {String(val).padStart(2, '0')}
                    </p>
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: PLUM_DIM, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>
                      {lbl}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#5C5650', marginTop: 8, letterSpacing: '0.06em' }}>
              {new Date(pinned.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <button onClick={onClick} className="card text-left w-full transition-all duration-150 hover:border-white/10 group">
      <div className="flex items-start justify-between">
        <div>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#A09890', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>
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
        style={{ background: '#1F1C19', color: '#C8BFB5', border: '0.5px solid rgba(255,255,255,0.08)', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem' }}>
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
    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#A09890', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>
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
              color: form.type === t ? (t === 'income' ? '#2D9E5A' : '#DC2626') : '#C8BFB5',
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

function FinancePulse({ onNavigate }) {
  const { finance, addFinanceEntry } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const { entries = [] } = finance

  const now = new Date()
  const mStart = startOfMonth(now)
  const mEnd   = endOfMonth(now)

  // Combined month totals across both businesses
  const monthEntries = entries.filter(e => { const d = parseISO(e.date); return d >= mStart && d <= mEnd })
  const monthIncome  = monthEntries.filter(e => (e.type || 'income') === 'income').reduce((a, e) => a + e.amount, 0)
  const monthExpense = monthEntries.filter(e => e.type === 'expense').reduce((a, e) => a + e.amount, 0)
  const monthNet     = monthIncome - monthExpense

  // Last 4 entries across all businesses, newest first
  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 4)

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#A09890', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          Finance
        </p>
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)} className="btn-ghost text-xs py-1"><Plus size={12}/> Entry</button>
          <button onClick={onNavigate} style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#A09890', letterSpacing: '0.1em' }}>
            ALL →
          </button>
        </div>
      </div>

      <div className="card">
        {/* Month net summary */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#A09890', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
              {format(now, 'MMMM')} net
            </p>
            <p style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '1.8rem', lineHeight: 1, color: monthNet >= 0 ? '#2D9E5A' : '#DC2626' }}>
              {monthNet < 0 ? '−' : '+'}{aud(monthNet)}
            </p>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: '#A09890', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>In</p>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', color: '#2D9E5A' }}>{aud(monthIncome)}</p>
            </div>
            <div>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: '#A09890', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Out</p>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', color: monthExpense > 0 ? '#DC2626' : '#A09890' }}>{aud(monthExpense)}</p>
            </div>
          </div>
        </div>

        {/* Recent entries */}
        {recent.length > 0 ? (
          <div className="space-y-2" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
            {recent.map(e => {
              const isExp = e.type === 'expense'
              const color = BIZ_COLORS[e.businessId] || '#C8BFB5'
              return (
                <div key={e.id} className="flex items-center gap-2">
                  <div className="w-1 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#A09890', width: 36, flexShrink: 0 }}>
                    {format(parseISO(e.date), 'dd MMM')}
                  </p>
                  <p className="flex-1 min-w-0 truncate" style={{ fontSize: '0.7rem', color: '#C8BFB5' }}>{e.source}</p>
                  <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', color: isExp ? '#DC2626' : '#2D9E5A', fontWeight: 600, flexShrink: 0 }}>
                    {isExp ? '−' : '+'}{aud(e.amount)}
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#7A7470' }}>No entries yet.</p>
        )}
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

// ─── Missions ─────────────────────────────────────────────────────────────────

const BIZ_ACCENT = { signal9: '#C4522A', app: '#3B82F6', writing: '#7C3AED', personal: '#7F77DD' }
const BIZ_LABEL  = { signal9: 'Signal9', app: 'App Dev', writing: 'Writing', personal: 'Personal' }

function MissionForm({ initial = {}, onSave, onClose }) {
  const [form, setForm] = useState({
    title: '', definedDone: '', businessId: 'app', targetDate: '', status: 'active',
    ...initial,
  })
  const f = k => e => setForm(s => ({ ...s, [k]: e.target.value }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Mission title *</label>
        <input required className="input" placeholder="e.g. Launch Tether on App Store"
          value={form.title} onChange={f('title')} />
      </div>
      <div>
        <label className="text-text-secondary text-xs mb-1 block">What does done look like?</label>
        <input className="input" placeholder="e.g. App is live, first 50 downloads"
          value={form.definedDone} onChange={f('definedDone')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Business arm</label>
          <select className="input" value={form.businessId} onChange={f('businessId')}>
            <option value="signal9">Signal9</option>
            <option value="app">App Dev</option>
            <option value="writing">Writing</option>
            <option value="personal">Personal</option>
          </select>
        </div>
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Target date</label>
          <input type="date" className="input" value={form.targetDate} onChange={f('targetDate')} />
        </div>
      </div>
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Status</label>
        <div className="flex gap-2">
          {['active', 'paused', 'complete'].map(s => (
            <button key={s} type="button"
              onClick={() => setForm(prev => ({ ...prev, status: s }))}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize"
              style={{
                fontFamily: '"DM Mono", monospace', letterSpacing: '0.06em',
                background: form.status === s
                  ? s === 'active' ? 'rgba(45,158,90,0.2)' : s === 'complete' ? 'rgba(59,130,246,0.2)' : 'rgba(92,86,80,0.3)'
                  : '#1F1C19',
                color: form.status === s
                  ? s === 'active' ? '#2D9E5A' : s === 'complete' ? '#60A5FA' : '#A09890'
                  : '#C8BFB5',
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary">Save Mission</button>
      </div>
    </form>
  )
}

function MissionsWidget({ onNavigateToTasks }) {
  const { missions, tasks, addMission, updateMission, deleteMission } = useStore()
  const [showAdd, setShowAdd]       = useState(false)
  const [editing, setEditing]       = useState(null)   // mission object being edited
  const [deleteId, setDeleteId]     = useState(null)
  const [expanded, setExpanded]     = useState(null)   // mission id expanded to show tasks

  const active = missions
    .filter(m => m.status !== 'complete')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, 5)

  const completed = missions.filter(m => m.status === 'complete')

  function taskStats(missionId) {
    const linked = tasks.filter(t => t.missionId === missionId)
    const done   = linked.filter(t => t.done).length
    return { total: linked.length, done }
  }

  function daysLabel(targetDate) {
    if (!targetDate) return null
    const diff = differenceInDays(new Date(targetDate), new Date())
    if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`, color: '#f87171' }
    if (diff === 0) return { label: 'due today', color: '#FBBF24' }
    return { label: `${diff}d left`, color: diff < 7 ? '#FBBF24' : '#A09890' }
  }

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#A09890', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            Active Missions
          </p>
          {active.length > 0 && (
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#5C5650',
              background: '#1F1C19', border: '0.5px solid rgba(255,255,255,0.07)',
              borderRadius: 999, padding: '1px 6px' }}>
              {active.length}/5
            </span>
          )}
        </div>
        {active.length < 5 && (
          <button onClick={() => setShowAdd(true)} className="btn-ghost text-xs py-1">
            <Plus size={12} /> Mission
          </button>
        )}
      </div>

      {/* Empty state */}
      {active.length === 0 && (
        <button onClick={() => setShowAdd(true)}
          className="card w-full flex flex-col items-center justify-center gap-2 py-6 hover:border-white/10 transition-colors"
          style={{ borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.08)' }}>
          <Target size={20} style={{ color: '#5C5650' }} />
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#5C5650', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            No active missions — add one
          </p>
          <p style={{ fontSize: '0.7rem', color: '#7A7470', maxWidth: 220, textAlign: 'center', lineHeight: 1.5 }}>
            What are the 3–5 things you're actively driving right now?
          </p>
        </button>
      )}

      {/* Mission cards */}
      {active.length > 0 && (
        <div className="space-y-2">
          {active.map(m => {
            const color = BIZ_ACCENT[m.businessId] || '#A09890'
            const { total, done } = taskStats(m.id)
            const pct = total > 0 ? Math.round((done / total) * 100) : 0
            const days = daysLabel(m.targetDate)
            const isExpanded = expanded === m.id
            const linkedTasks = tasks.filter(t => t.missionId === m.id && !t.done).slice(0, 4)

            return (
              <div key={m.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Top accent bar */}
                <div style={{ height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />

                <div style={{ padding: '12px 14px' }}>
                  {/* Row 1: title + actions */}
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p style={{ fontSize: '0.875rem', color: '#EDE8E0', fontWeight: 500, lineHeight: 1.3 }}>
                          {m.title}
                        </p>
                        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color, letterSpacing: '0.1em',
                          background: color + '18', border: `0.5px solid ${color}40`, borderRadius: 999, padding: '1px 5px' }}>
                          {BIZ_LABEL[m.businessId] || m.businessId}
                        </span>
                        {m.status === 'paused' && (
                          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#A09890', letterSpacing: '0.1em',
                            background: 'rgba(92,86,80,0.2)', borderRadius: 999, padding: '1px 5px' }}>
                            PAUSED
                          </span>
                        )}
                      </div>
                      {m.definedDone && (
                        <p style={{ fontSize: '0.7rem', color: '#7A7470', marginTop: 3, lineHeight: 1.4 }}>
                          ✓ {m.definedDone}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setEditing(m)}
                        className="p-1 rounded transition-colors hover:bg-white/5" style={{ color: '#5C5650' }}>
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => setDeleteId(m.id)}
                        className="p-1 rounded transition-colors hover:bg-red-900/20" style={{ color: '#5C5650' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: progress + days */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1" style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2,
                        background: pct === 100 ? '#2D9E5A' : color,
                        boxShadow: pct > 0 ? `0 0 6px ${color}80` : 'none',
                        transition: 'width 0.4s ease' }} />
                    </div>
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#A09890', flexShrink: 0 }}>
                      {total > 0 ? `${done}/${total} tasks` : 'no linked tasks'}
                    </p>
                    {days && (
                      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: days.color, flexShrink: 0 }}>
                        {days.label}
                      </p>
                    )}
                  </div>

                  {/* Row 3: quick actions */}
                  <div className="flex items-center gap-3 mt-2.5">
                    <button onClick={() => setExpanded(isExpanded ? null : m.id)}
                      className="flex items-center gap-1 transition-colors"
                      style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#5C5650', letterSpacing: '0.08em' }}>
                      <ChevronRight size={10} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                      {isExpanded ? 'HIDE TASKS' : 'TASKS'}
                    </button>
                    <button onClick={() => updateMission(m.id, { status: m.status === 'active' ? 'complete' : 'active' })}
                      className="transition-colors"
                      style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem',
                        color: m.status === 'complete' ? '#2D9E5A' : '#5C5650', letterSpacing: '0.08em' }}>
                      {m.status === 'complete' ? '✓ COMPLETE' : 'MARK DONE'}
                    </button>
                  </div>

                  {/* Expanded task list */}
                  {isExpanded && (
                    <div style={{ marginTop: 10, borderTop: '0.5px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                      {linkedTasks.length === 0 ? (
                        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#5C5650' }}>
                          No open tasks linked to this mission. Add tasks in the Tasks tab and assign this mission.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {linkedTasks.map(t => (
                            <div key={t.id} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                              <p style={{ fontSize: '0.75rem', color: '#C8BFB5', flex: 1, minWidth: 0 }} className="truncate">{t.text}</p>
                              {t.priority === 'high' && (
                                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#C4522A' }}>HIGH</span>
                              )}
                            </div>
                          ))}
                          {tasks.filter(t => t.missionId === m.id && !t.done).length > 4 && (
                            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#5C5650' }}>
                              +{tasks.filter(t => t.missionId === m.id && !t.done).length - 4} more
                            </p>
                          )}
                        </div>
                      )}
                      <button onClick={() => onNavigateToTasks(m.id)}
                        style={{ marginTop: 8, fontFamily: '"DM Mono", monospace', fontSize: '0.55rem',
                          color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        VIEW ALL IN TASKS →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Completed missions count */}
      {completed.length > 0 && (
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#5C5650', marginTop: 10, letterSpacing: '0.1em' }}>
          {completed.length} mission{completed.length !== 1 ? 's' : ''} completed
        </p>
      )}

      {/* Modals */}
      {showAdd && (
        <Modal title="New Mission" onClose={() => setShowAdd(false)}>
          <MissionForm onSave={data => { addMission(data); setShowAdd(false) }} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Mission" onClose={() => setEditing(null)}>
          <MissionForm initial={editing} onSave={data => { updateMission(editing.id, data); setEditing(null) }} onClose={() => setEditing(null)} />
        </Modal>
      )}
      {deleteId && (
        <ConfirmDialog title="Delete Mission"
          message="Delete this mission? Tasks linked to it won't be deleted, just unlinked."
          onConfirm={() => { deleteMission(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)} />
      )}
    </section>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { tasks, events, projects, notes, addTask } = useStore()
  const [missionFilter, setMissionFilter] = useState(null)

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

        {/* Missions */}
        <MissionsWidget onNavigateToTasks={(missionId) => {
          setMissionFilter(missionId)
          navigate('/tasks')
        }} />

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
                    {ev.time && <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: '#A09890' }}>{ev.time}{ev.endTime ? ` — ${ev.endTime}` : ''}</p>}
                  </div>
                  {ev.reminder && <Bell size={11} style={{ color: '#A09890' }} />}
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
            <button onClick={() => navigate('/tasks')} style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#A09890', letterSpacing: '0.1em' }}>
              ALL →
            </button>
          </div>
          {topTasks.length === 0
            ? <p style={{ color: '#A09890', fontSize: '0.875rem' }}>No open tasks.</p>
            : <div className="space-y-2">
                {topTasks.map(t => (
                  <button key={t.id} onClick={() => navigate('/tasks')}
                    className="card w-full text-left flex items-center gap-3 hover:border-white/10 transition-colors">
                    <div className="w-3.5 h-3.5 rounded-sm border shrink-0" style={{ borderColor: CAT_COLORS[t.category] + '80' }} />
                    <p className="text-sm flex-1 min-w-0 truncate" style={{ color: '#C8BFB5' }}>{t.text}</p>
                    {t.reminder && <Bell size={11} style={{ color: '#A09890' }} />}
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
                      <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#A09890' }}>{bizProjects.length} active</span>
                    </div>
                    {latestNote && <p className="text-xs truncate mt-0.5" style={{ color: '#A09890' }}>{latestNote.title}</p>}
                  </div>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#A09890' }}>→</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Finance Pulse */}
        <FinancePulse onNavigate={() => navigate('/finance')} />

        {/* Upcoming */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <SectionLabel>Upcoming</SectionLabel>
            <button onClick={() => navigate('/calendar')} style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#A09890', letterSpacing: '0.1em' }}>
              CALENDAR →
            </button>
          </div>
          {next5Events.length === 0
            ? <p style={{ color: '#A09890', fontSize: '0.875rem' }}>No upcoming events.</p>
            : <div className="space-y-2">
                {next5Events.map(ev => (
                  <button key={ev.id} onClick={() => navigate('/calendar')}
                    className="card w-full text-left flex items-center gap-3 hover:border-white/10 transition-colors">
                    <div className="shrink-0 text-center w-9">
                      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#A09890', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {format(parseISO(ev.date), 'MMM')}
                      </p>
                      <p style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '1.3rem', color: '#EDE8E0', lineHeight: 1 }}>
                        {format(parseISO(ev.date), 'd')}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: '#C8BFB5' }}>{ev.title}</p>
                      {ev.time && <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: '#A09890' }}>{ev.time}</p>}
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
