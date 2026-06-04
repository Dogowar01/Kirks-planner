import { useState } from 'react'
import { format, parseISO, startOfMonth, endOfMonth, startOfYear } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'

const aud = (n) => n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })

function EntryForm({ onSave, onClose }) {
  const [form, setForm] = useState({ businessId: 'signal9', date: format(new Date(), 'yyyy-MM-dd'), amount: '', source: '', note: '' })
  const f = k => e => setForm(s => ({ ...s, [k]: e.target.value }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, amount: Number(form.amount) }) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Business</label>
          <select className="input" value={form.businessId} onChange={f('businessId')}>
            <option value="signal9">Signal9 Studio</option>
            <option value="app">App Development</option>
          </select>
        </div>
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Date</label>
          <input type="date" className="input" value={form.date} onChange={f('date')} />
        </div>
      </div>
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Amount (AUD) *</label>
        <input required type="number" step="0.01" min="0.01" className="input" value={form.amount} onChange={f('amount')} placeholder="350.00" />
      </div>
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Source *</label>
        <input required className="input" value={form.source} onChange={f('source')} placeholder="e.g. Harvest Market — Print #3" />
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

const BIZ_COLORS = { signal9: '#D85A30', app: '#378ADD' }
const BIZ_LABELS = { signal9: 'Signal9 Studio', app: 'App Development' }

export default function Finance() {
  const { finance, addFinanceEntry, deleteFinanceEntry, setFinanceGoal } = useStore()
  const [tab, setTab] = useState('signal9')
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [monthOffset, setMonthOffset] = useState(0)

  const { entries = [], goals = {} } = finance
  const now = new Date()
  const viewMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
  const mStart = startOfMonth(viewMonth)
  const mEnd = endOfMonth(viewMonth)
  const yStart = startOfYear(now)

  const tabEntries = entries
    .filter(e => e.businessId === tab)
    .sort((a,b) => b.date.localeCompare(a.date))

  const monthEntries = tabEntries.filter(e => {
    const d = parseISO(e.date)
    return d >= mStart && d <= mEnd
  })

  const monthTotal = monthEntries.reduce((a, e) => a + e.amount, 0)
  const ytdTotal = tabEntries.filter(e => parseISO(e.date) >= yStart).reduce((a, e) => a + e.amount, 0)
  const monthGoal = goals[tab]?.monthly || 0
  const progress = monthGoal > 0 ? Math.min(monthTotal / monthGoal, 1) : 0

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">Finance</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={16}/> Add Income</button>
      </div>

      {/* Business tabs */}
      <div className="flex gap-2 mb-6">
        {['signal9', 'app'].map(id => (
          <button key={id} onClick={() => setTab(id)}
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
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card">
          <p className="text-text-tertiary text-[10px] uppercase tracking-wide mb-1">This Month</p>
          <p className="text-2xl font-mono font-semibold text-text-primary">{aud(monthTotal)}</p>
          {monthGoal > 0 && (
            <div className="mt-2">
              <div className="h-1 bg-bg-elevated rounded-full">
                <div className="h-1 rounded-full transition-all" style={{ width: `${progress * 100}%`, backgroundColor: BIZ_COLORS[tab] }} />
              </div>
              <p className="text-text-tertiary text-[10px] mt-1">Target: {aud(monthGoal)}</p>
            </div>
          )}
        </div>
        <div className="card">
          <p className="text-text-tertiary text-[10px] uppercase tracking-wide mb-1">YTD {new Date().getFullYear()}</p>
          <p className="text-2xl font-mono font-semibold text-text-primary">{aud(ytdTotal)}</p>
          <div className="mt-2">
            <label className="text-text-tertiary text-[10px]">Monthly target (AUD)</label>
            <input type="number" step="100" className="input text-xs py-1 mt-1"
              value={monthGoal}
              onChange={e => setFinanceGoal(tab, Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Entries */}
      {monthEntries.length === 0
        ? <p className="text-text-tertiary text-sm text-center py-8">No income recorded for {format(viewMonth, 'MMMM yyyy')}.</p>
        : <div className="space-y-2">
            {monthEntries.map(e => (
              <div key={e.id} className="card flex items-center gap-3">
                <div className="shrink-0 w-12 text-center">
                  <p className="text-text-tertiary text-[10px] font-mono">{format(parseISO(e.date), 'dd MMM')}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-sm truncate">{e.source}</p>
                  {e.note && <p className="text-text-tertiary text-xs truncate">{e.note}</p>}
                </div>
                <p className="text-text-primary font-mono text-sm font-semibold shrink-0">{aud(e.amount)}</p>
                <button onClick={() => setDeleteId(e.id)} className="p-1 text-text-tertiary hover:text-red-400 shrink-0">
                  <Trash2 size={14}/>
                </button>
              </div>
            ))}
          </div>
      }

      {showAdd && (
        <Modal title="Add Income" onClose={() => setShowAdd(false)}>
          <EntryForm onSave={(data) => { addFinanceEntry(data); setShowAdd(false) }} onClose={() => setShowAdd(false)} />
        </Modal>
      )}

      {deleteId && (
        <ConfirmDialog title="Delete Entry" message="Delete this income entry?"
          onConfirm={() => { deleteFinanceEntry(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)} />
      )}
    </div>
  )
}
