import { useState, useMemo } from 'react'
import { format, parseISO, startOfMonth, endOfMonth, startOfYear, subMonths, eachMonthOfInterval } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useStore } from '../../hooks/useStore'
import Modal from '../../components/Modal'
import SectionShell from '../../components/SectionShell'
import bgImg from '../../assets/art-newyork.jpg'
import ConfirmDialog from '../../components/ConfirmDialog'

const aud = (n) => Math.abs(n).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })

const BIZ_COLORS  = { signal9: '#C4522A', app: '#3B82F6' }
const BIZ_LABELS  = { signal9: 'Signal9 Studio', app: 'App Development' }

const BIZ_CATS = {
  signal9: ['Print', 'Market', 'Commission', 'Workshop', 'Digital', 'Other'],
  app:     ['Gumroad', 'App Store', 'Freelance', 'Consulting', 'Subscription', 'Other'],
}
const EXPENSE_CATS = {
  signal9: ['Supplies', 'Printing', 'Market Fees', 'Software', 'Equipment', 'Marketing', 'Other'],
  app:     ['Software', 'Hosting', 'Tools', 'Marketing', 'Equipment', 'Freelance', 'Other'],
}

function EntryForm({ bizId, onSave, onClose }) {
  const [form, setForm] = useState({
    businessId: bizId,
    type: 'income',
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    category: BIZ_CATS[bizId]?.[0] || 'Other',
    source: '',
    note: '',
  })
  const f = k => e => setForm(s => ({ ...s, [k]: e.target.value }))

  const cats = form.type === 'income' ? (BIZ_CATS[bizId] || []) : (EXPENSE_CATS[bizId] || [])

  function handleTypeChange(e) {
    const t = e.target.value
    const defaultCat = (t === 'income' ? BIZ_CATS[bizId] : EXPENSE_CATS[bizId])?.[0] || 'Other'
    setForm(s => ({ ...s, type: t, category: defaultCat }))
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, amount: Number(form.amount) }) }} className="space-y-4">
      {/* Type toggle */}
      <div className="flex gap-2">
        {['income', 'expense'].map(t => (
          <button key={t} type="button"
            onClick={() => handleTypeChange({ target: { value: t } })}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: form.type === t ? (t === 'income' ? 'rgba(45,158,90,0.2)' : 'rgba(220,38,38,0.15)') : '#1F1C19',
              color: form.type === t ? (t === 'income' ? '#2D9E5A' : '#DC2626') : '#9A9088',
              fontFamily: '"DM Mono", monospace',
              fontSize: '0.7rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
            {t === 'income' ? '+ Income' : '− Expense'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Date</label>
          <input type="date" className="input" value={form.date} onChange={f('date')} />
        </div>
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Amount (AUD) *</label>
          <input required type="number" step="0.01" min="0.01" className="input" value={form.amount} onChange={f('amount')} placeholder="350.00" />
        </div>
      </div>

      <div>
        <label className="text-text-secondary text-xs mb-1 block">Category</label>
        <select className="input" value={form.category} onChange={f('category')}>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="text-text-secondary text-xs mb-1 block">{form.type === 'income' ? 'Source' : 'Payee'} *</label>
        <input required className="input" value={form.source} onChange={f('source')}
          placeholder={form.type === 'income' ? 'e.g. Harvest Market — Print #3' : 'e.g. Officeworks'} />
      </div>

      <div>
        <label className="text-text-secondary text-xs mb-1 block">Note</label>
        <input className="input" value={form.note} onChange={f('note')} placeholder="Optional" />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary">Save Entry</button>
      </div>
    </form>
  )
}

function MonthlyChart({ entries, bizId, goal }) {
  const color = BIZ_COLORS[bizId]
  const months = eachMonthOfInterval({ start: subMonths(new Date(), 5), end: new Date() })
  const data = months.map(m => {
    const key = format(m, 'yyyy-MM')
    const monthEntries = entries.filter(e => e.date.startsWith(key))
    const income = monthEntries.filter(e => (e.type || 'income') === 'income').reduce((a, e) => a + e.amount, 0)
    const expense = monthEntries.filter(e => e.type === 'expense').reduce((a, e) => a + e.amount, 0)
    return { label: format(m, 'MMM'), income, expense, net: income - expense }
  })

  return (
    <div className="card mb-4">
      <p className="text-text-tertiary text-[10px] uppercase tracking-wide mb-3">6-Month Overview</p>
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={data} barGap={2} barSize={10}>
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#6B6762' }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: '#282826', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: '#A8A49C' }}
            formatter={(v, name) => [aud(v), name.charAt(0).toUpperCase() + name.slice(1)]}
          />
          <Bar dataKey="income" radius={[2,2,0,0]}>
            {data.map((_, i) => <Cell key={i} fill={color + 'CC'} />)}
          </Bar>
          <Bar dataKey="expense" radius={[2,2,0,0]}>
            {data.map((_, i) => <Cell key={i} fill="rgba(220,38,38,0.6)" />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-1 justify-end">
        <div className="flex items-center gap-1.5 text-[9px] text-text-tertiary">
          <div className="w-2 h-2 rounded-sm" style={{ background: color }}/> Income
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-text-tertiary">
          <div className="w-2 h-2 rounded-sm bg-red-700/60"/> Expense
        </div>
      </div>
    </div>
  )
}

export default function Finance() {
  const { finance, addFinanceEntry, deleteFinanceEntry, setFinanceGoal } = useStore()
  const [tab, setTab] = useState('signal9')
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [monthOffset, setMonthOffset] = useState(0)
  const [typeFilter, setTypeFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')

  const { entries = [], goals = {} } = finance
  const now = new Date()
  const viewMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
  const mStart = startOfMonth(viewMonth)
  const mEnd   = endOfMonth(viewMonth)
  const yStart = startOfYear(now)

  const tabEntries = entries
    .filter(e => e.businessId === tab)
    .sort((a, b) => b.date.localeCompare(a.date))

  const monthEntries = tabEntries.filter(e => {
    const d = parseISO(e.date)
    return d >= mStart && d <= mEnd
  })

  const filtered = monthEntries
    .filter(e => typeFilter === 'all' || (e.type || 'income') === typeFilter)
    .filter(e => catFilter  === 'all' || e.category === catFilter)

  const monthIncome  = monthEntries.filter(e => (e.type || 'income') === 'income').reduce((a, e) => a + e.amount, 0)
  const monthExpense = monthEntries.filter(e => e.type === 'expense').reduce((a, e) => a + e.amount, 0)
  const monthNet     = monthIncome - monthExpense

  const ytdIncome  = tabEntries.filter(e => parseISO(e.date) >= yStart && (e.type || 'income') === 'income').reduce((a, e) => a + e.amount, 0)
  const ytdExpense = tabEntries.filter(e => parseISO(e.date) >= yStart && e.type === 'expense').reduce((a, e) => a + e.amount, 0)
  const ytdNet     = ytdIncome - ytdExpense

  const monthGoal = goals[tab]?.monthly || 0
  const progress  = monthGoal > 0 ? Math.min(monthIncome / monthGoal, 1) : 0

  const allCats = [...new Set(monthEntries.map(e => e.category).filter(Boolean))]
  const color = BIZ_COLORS[tab]

  return (
    <SectionShell accent="#D4A017" bgImage={bgImg}>
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title" style={{ color: '#D4A017' }}>Finance</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={16}/> Add Entry</button>
      </div>

      {/* Business tabs */}
      <div className="flex gap-2 mb-6">
        {['signal9', 'app'].map(id => (
          <button key={id} onClick={() => { setTab(id); setCatFilter('all'); setTypeFilter('all') }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'text-white' : 'bg-bg-elevated text-text-secondary hover:text-text-primary'}`}
            style={tab === id ? { backgroundColor: BIZ_COLORS[id] } : {}}>
            {BIZ_LABELS[id]}
          </button>
        ))}
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setMonthOffset(o => o + 1)} className="btn-ghost text-xs py-1">←</button>
        <span className="text-text-primary text-sm font-medium flex-1 text-center">{format(viewMonth, 'MMMM yyyy')}</span>
        <button onClick={() => setMonthOffset(o => Math.max(0, o - 1))} className="btn-ghost text-xs py-1" disabled={monthOffset === 0}>→</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card">
          <p className="text-text-tertiary text-[10px] uppercase tracking-wide mb-1">Income</p>
          <p className="text-xl font-mono font-semibold" style={{ color: '#2D9E5A' }}>{aud(monthIncome)}</p>
          {monthGoal > 0 && (
            <div className="mt-2">
              <div className="h-0.5 bg-bg-elevated rounded-full">
                <div className="h-0.5 rounded-full transition-all" style={{ width: `${progress * 100}%`, backgroundColor: progress >= 1 ? '#2D9E5A' : color }} />
              </div>
              <p className="text-text-tertiary text-[9px] mt-1">Goal: {aud(monthGoal)}</p>
            </div>
          )}
        </div>
        <div className="card">
          <p className="text-text-tertiary text-[10px] uppercase tracking-wide mb-1">Outgoings</p>
          <p className="text-xl font-mono font-semibold" style={{ color: monthExpense > 0 ? '#DC2626' : '#5C5650' }}>{aud(monthExpense)}</p>
          <div className="mt-2">
            <label className="text-text-tertiary text-[9px]">Monthly goal (AUD)</label>
            <input type="number" step="100" className="input text-xs py-0.5 mt-1"
              value={monthGoal}
              onChange={e => setFinanceGoal(tab, Number(e.target.value))} />
          </div>
        </div>
        <div className="card">
          <p className="text-text-tertiary text-[10px] uppercase tracking-wide mb-1">Net</p>
          <p className="text-xl font-mono font-semibold" style={{ color: monthNet >= 0 ? '#2D9E5A' : '#DC2626' }}>
            {monthNet < 0 ? '−' : ''}{aud(monthNet)}
          </p>
          <p className="text-text-tertiary text-[9px] mt-2">YTD net: <span style={{ color: ytdNet >= 0 ? '#2D9E5A' : '#DC2626' }}>{ytdNet < 0 ? '−' : ''}{aud(ytdNet)}</span></p>
        </div>
      </div>

      {/* 6-month chart */}
      <MonthlyChart entries={tabEntries} bizId={tab} goal={monthGoal} />

      {/* Filters */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {['all', 'income', 'expense'].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className="px-3 py-1 rounded-full text-xs transition-colors"
            style={{
              fontFamily: '"DM Mono", monospace',
              background: typeFilter === t ? (t === 'expense' ? 'rgba(220,38,38,0.2)' : t === 'income' ? 'rgba(45,158,90,0.2)' : 'rgba(255,255,255,0.1)') : '#1F1C19',
              color: typeFilter === t ? (t === 'expense' ? '#DC2626' : t === 'income' ? '#2D9E5A' : '#EDE8E0') : '#9A9088',
            }}>
            {t === 'all' ? 'All' : t === 'income' ? '+ Income' : '− Expense'}
          </button>
        ))}
        {allCats.length > 0 && (
          <select className="input text-xs py-1 ml-auto w-auto"
            value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="all">All categories</option>
            {allCats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Entries */}
      {filtered.length === 0
        ? <p className="text-text-tertiary text-sm text-center py-8">No entries for {format(viewMonth, 'MMMM yyyy')}.</p>
        : <div className="space-y-1.5">
            {filtered.map(e => {
              const isExpense = e.type === 'expense'
              return (
                <div key={e.id} className="card flex items-center gap-3"
                  style={{ borderColor: isExpense ? 'rgba(220,38,38,0.12)' : 'transparent' }}>
                  <div className="shrink-0 w-12 text-center">
                    <p className="text-text-tertiary text-[10px] font-mono">{format(parseISO(e.date), 'dd MMM')}</p>
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: isExpense ? '#DC2626' : '#2D9E5A', marginTop: 2, letterSpacing: '0.05em' }}>
                      {isExpense ? 'EXP' : 'INC'}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm truncate">{e.source}</p>
                    <div className="flex gap-2 mt-0.5">
                      {e.category && <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#5C5650' }}>{e.category}</span>}
                      {e.note && <span className="text-text-tertiary text-[10px] truncate">{e.note}</span>}
                    </div>
                  </div>
                  <p className="font-mono text-sm font-semibold shrink-0"
                    style={{ color: isExpense ? '#DC2626' : '#EDE8E0' }}>
                    {isExpense ? '−' : '+'}{aud(e.amount)}
                  </p>
                  <button onClick={() => setDeleteId(e.id)} className="p-1 text-text-tertiary hover:text-red-400 shrink-0">
                    <Trash2 size={14}/>
                  </button>
                </div>
              )
            })}
          </div>
      }

      {showAdd && (
        <Modal title="Add Entry" onClose={() => setShowAdd(false)}>
          <EntryForm bizId={tab}
            onSave={(data) => { addFinanceEntry(data); setShowAdd(false) }}
            onClose={() => setShowAdd(false)} />
        </Modal>
      )}

      {deleteId && (
        <ConfirmDialog title="Delete Entry" message="Delete this entry?"
          onConfirm={() => { deleteFinanceEntry(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)} />
      )}
    </div>
    </SectionShell>
  )
}
