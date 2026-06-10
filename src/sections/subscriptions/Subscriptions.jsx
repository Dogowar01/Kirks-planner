import { useState, useMemo } from 'react'
import { Plus, Trash2, Pencil, CreditCard } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import SectionShell from '../../components/SectionShell'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import bgImg from '../../assets/art-newyork.jpg'

const ACCENT = '#10B981'

const FREQUENCIES = [
  { id: 'weekly',   label: 'Weekly',   factor: 52/12 },
  { id: 'monthly',  label: 'Monthly',  factor: 1 },
  { id: 'yearly',   label: 'Yearly',   factor: 1/12 },
]

const CATEGORIES = [
  { id: 'streaming',  label: 'Streaming',  color: '#E50914' },
  { id: 'software',   label: 'Software',   color: '#3B82F6' },
  { id: 'health',     label: 'Health',     color: '#10B981' },
  { id: 'music',      label: 'Music',      color: '#A855F7' },
  { id: 'finance',    label: 'Finance',    color: '#F5C842' },
  { id: 'gaming',     label: 'Gaming',     color: '#F97316' },
  { id: 'other',      label: 'Other',      color: '#A09890' },
]

const fmt = (n) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 }).format(n)

function toMonthly(amount, freqId) {
  const f = FREQUENCIES.find(x => x.id === freqId) || FREQUENCIES[1]
  return amount * f.factor
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000)
  return diff
}

function SubCard({ sub, onEdit, onDelete, index }) {
  const cat = CATEGORIES.find(c => c.id === sub.category) || CATEGORIES[6]
  const monthly = toMonthly(sub.amount, sub.frequency)
  const days = daysUntil(sub.renewalDate)
  const anim = index % 2 === 0
    ? `phase-in-left 0.7s cubic-bezier(0.22,1,0.36,1) ${index * 0.04}s both`
    : `phase-in-right 0.7s cubic-bezier(0.22,1,0.36,1) ${index * 0.04}s both`

  return (
    <div style={{
      background: 'rgba(14,12,11,0.85)', border: '0.5px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '14px 16px', animation: anim,
      clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      {/* Color bar */}
      <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: cat.color, flexShrink: 0, boxShadow: `0 0 6px ${cat.color}60` }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: '1rem', color: '#EDE8E0', margin: '0 0 3px' }}>{sub.name}</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: cat.color, background: `${cat.color}20`, padding: '2px 7px', borderRadius: 4, letterSpacing: '0.1em' }}>{cat.label}</span>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: 'rgba(160,140,120,0.5)', letterSpacing: '0.08em' }}>{FREQUENCIES.find(f => f.id === sub.frequency)?.label}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.95rem', fontWeight: 700, color: ACCENT, textShadow: `0 0 10px ${ACCENT}50` }}>{fmt(sub.amount)}</div>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: 'rgba(160,140,120,0.4)', letterSpacing: '0.08em' }}>{fmt(monthly)}/mo</div>
          </div>
        </div>
        {sub.renewalDate && (
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: days !== null && days <= 7 ? '#F97316' : days !== null && days <= 30 ? '#F5C842' : 'rgba(160,140,120,0.4)', letterSpacing: '0.08em', marginTop: 4 }}>
            {days === null ? '' : days < 0 ? 'Overdue' : days === 0 ? 'Renews today' : `Renews in ${days}d · ${new Date(sub.renewalDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={() => onEdit(sub)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: `${ACCENT}50`, padding: 4 }}><Pencil size={13} /></button>
        <button onClick={() => onDelete(sub.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,77,106,0.4)', padding: 4 }}><Trash2 size={13} /></button>
      </div>
    </div>
  )
}

const EMPTY = { name: '', amount: '', frequency: 'monthly', category: 'other', renewalDate: '' }

export default function Subscriptions() {
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const totalMonthly = useMemo(() =>
    subscriptions.reduce((s, sub) => s + toMonthly(parseFloat(sub.amount) || 0, sub.frequency), 0)
  , [subscriptions])

  const totalYearly = totalMonthly * 12

  const upcoming = useMemo(() =>
    subscriptions.filter(s => { const d = daysUntil(s.renewalDate); return d !== null && d >= 0 && d <= 30 })
      .sort((a,b) => a.renewalDate.localeCompare(b.renewalDate))
  , [subscriptions])

  const byCategory = useMemo(() => {
    const map = {}
    subscriptions.forEach(s => {
      const m = toMonthly(parseFloat(s.amount) || 0, s.frequency)
      map[s.category] = (map[s.category] || 0) + m
    })
    return Object.entries(map).sort((a,b) => b[1]-a[1])
  }, [subscriptions])

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (sub) => { setEditing(sub.id); setForm({ name: sub.name, amount: String(sub.amount), frequency: sub.frequency, category: sub.category, renewalDate: sub.renewalDate || '' }); setShowForm(true) }

  const save = () => {
    if (!form.name.trim() || !form.amount) return
    const data = { ...form, amount: parseFloat(form.amount) }
    if (editing) updateSubscription(editing, data)
    else addSubscription(data)
    setShowForm(false)
  }

  const inputStyle = {
    background: 'rgba(13,12,11,0.9)', border: `1px solid ${ACCENT}30`, borderRadius: 8,
    color: '#EDE8E0', fontFamily: '"DM Mono", monospace', fontSize: '0.85rem',
    padding: '0.55rem 0.75rem', outline: 'none', width: '100%', boxSizing: 'border-box', colorScheme: 'dark',
  }
  const label = (t) => <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: `${ACCENT}80`, display: 'block', marginBottom: '0.3rem' }}>{t}</span>

  return (
    <SectionShell accent={ACCENT} bgImage={bgImg}>
      <PageHeader subtitle="FINANCE" title="Subscriptions" accent={ACCENT} showBack>
        <button onClick={openAdd} style={{ background: `${ACCENT}20`, border: `1px solid ${ACCENT}50`, color: ACCENT, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} />ADD
        </button>
      </PageHeader>

      <div className="p-4 max-w-2xl" style={{ paddingBottom: '3rem' }}>

        {/* Cost summary */}
        {subscriptions.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'MONTHLY TOTAL', value: fmt(totalMonthly), color: ACCENT },
              { label: 'YEARLY TOTAL',  value: fmt(totalYearly),  color: '#F5C842' },
            ].map(({ label: l, value, color }) => (
              <div key={l} style={{ background: 'rgba(14,12,11,0.8)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.42rem', color: 'rgba(160,140,120,0.5)', letterSpacing: '0.18em', marginBottom: 6 }}>{l}</div>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '1.1rem', fontWeight: 700, color, textShadow: `0 0 12px ${color}50` }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming renewals */}
        {upcoming.length > 0 && (
          <div style={{ background: 'rgba(249,115,22,0.08)', border: '0.5px solid rgba(249,115,22,0.25)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: 'rgba(249,115,22,0.8)', letterSpacing: '0.18em', marginBottom: 8 }}>⚡ RENEWING WITHIN 30 DAYS</div>
            {upcoming.map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.62rem', color: '#EDE8E0' }}>{s.name}</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.62rem', color: '#F97316' }}>{new Date(s.renewalDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
              </div>
            ))}
          </div>
        )}

        {/* Category breakdown */}
        {byCategory.length > 0 && (
          <div style={{ background: 'rgba(14,12,11,0.6)', border: '0.5px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: 'rgba(160,140,120,0.5)', letterSpacing: '0.18em', marginBottom: 10 }}>BY CATEGORY</div>
            {byCategory.map(([catId, amt]) => {
              const cat = CATEGORIES.find(c => c.id === catId) || CATEGORIES[6]
              const pct = totalMonthly > 0 ? (amt / totalMonthly) * 100 : 0
              return (
                <div key={catId} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: cat.color }}>{cat.label}</span>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: 'rgba(160,140,120,0.6)' }}>{fmt(amt)}/mo</span>
                  </div>
                  <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: cat.color, borderRadius: 1, boxShadow: `0 0 4px ${cat.color}80` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* List */}
        {subscriptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: `${ACCENT}40` }}>
            <CreditCard size={32} style={{ margin: '0 auto 1rem', display: 'block' }} />
            <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.1rem', marginBottom: '0.5rem', color: `${ACCENT}60` }}>No subscriptions yet</p>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.1em' }}>Track what you're paying for</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...subscriptions].sort((a,b) => toMonthly(b.amount,b.frequency)-toMonthly(a.amount,a.frequency)).map((s,i) => (
              <SubCard key={s.id} sub={s} onEdit={openEdit} onDelete={setDeleteId} index={i} />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.3rem', color: ACCENT, margin: '0 0 1.5rem', textShadow: `0 0 16px ${ACCENT}50` }}>{editing ? 'Edit Subscription' : 'Add Subscription'}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>{label('Name')}<input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Netflix, Spotify…" style={inputStyle} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>{label('Amount ($)')}<input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} placeholder="0.00" style={inputStyle} /></div>
              <div>
                {label('Frequency')}
                <select value={form.frequency} onChange={e => setForm(f => ({...f, frequency: e.target.value}))} style={{ ...inputStyle, appearance: 'none' }}>
                  {FREQUENCIES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              {label('Category')}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CATEGORIES.map(c => (
                  <button key={c.id} type="button" onClick={() => setForm(f => ({...f, category: c.id}))}
                    style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', letterSpacing: '0.08em', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', border: `0.5px solid ${form.category === c.id ? c.color : 'rgba(255,255,255,0.1)'}`, background: form.category === c.id ? `${c.color}25` : 'transparent', color: form.category === c.id ? c.color : 'rgba(160,140,120,0.6)' }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>{label('Next Renewal Date (optional)')}<input type="date" value={form.renewalDate} onChange={e => setForm(f => ({...f, renewalDate: e.target.value}))} style={inputStyle} /></div>
          </div>
          <button onClick={save} style={{ marginTop: '1.5rem', width: '100%', background: `linear-gradient(135deg, ${ACCENT}40, ${ACCENT}22)`, border: `1px solid ${ACCENT}70`, borderRadius: 10, color: ACCENT, fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1rem', padding: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
            {editing ? 'Save Changes' : 'Add Subscription'}
          </button>
        </Modal>
      )}

      {deleteId && (
        <ConfirmDialog message="Delete this subscription?" onConfirm={() => { deleteSubscription(deleteId); setDeleteId(null) }} onCancel={() => setDeleteId(null)} />
      )}
    </SectionShell>
  )
}
