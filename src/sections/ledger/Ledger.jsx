import { useState, useMemo, useCallback, useRef } from 'react'
import { ArrowLeft, Plus, Trash2, Edit2, Download, Upload, X, RefreshCw, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid,
} from 'recharts'
import bgHub      from '../../assets/art-architectural.png'
import bgBP       from '../../assets/Brighterpathways.png'
import bgS9       from '../../assets/Signal9.png'
import bgApps     from '../../assets/Apps.png'
import bgHome     from '../../assets/Household.png'
import bgTravel   from '../../assets/Travel.png'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

export const LEDGER_KEY = 'ledger_v5'

export const ENTITIES = {
  bp:   { label: 'Brighter Pathways', short: 'BP',   color: '#8B5CF6', desc: 'Psychology practice & consulting', bg: bgBP },
  s9:   { label: 'Signal9 Studio',    short: 'S9',   color: '#3B82F6', desc: 'Fine art, prints & commissions',   bg: bgS9 },
  apps: { label: 'Signal9 Apps',      short: 'Apps', color: '#10B981', desc: 'Software, apps & digital products', bg: bgApps },
  home: { label: 'Household',         short: 'Home', color: '#94A3B8', desc: 'Personal & household expenses',    bg: bgHome },
}

const DEFAULT_CATEGORIES = {
  bp:   { income: ['Client fees','Consulting','Medicare','Workshop','Other income'], expense: ['Rent/rooms','Clinical supplies','Software/tools','Supervision','CPD/training','Marketing','Insurance','Phone/internet','Accounting','Printing','Travel','Meals','Other expense'] },
  s9:   { income: ['Print sales','Market sales','Online sales','Commissions','Licensing'], expense: ['Printing costs','Art supplies','Market fees','Packaging','Framing','Photography','Marketing','Software','Postage','Other expense'] },
  apps: { income: ['App sales','Gumroad','itch.io','Subscriptions','Consulting','API usage'], expense: ['Software/APIs','Hosting/domains','Anthropic API','Apple Developer','Google Play','Marketing','Equipment','Learning','Other expense'] },
  home: { income: ['Salary','Other income'], expense: ['Mortgage','Rates','Insurance','Electricity','Gas','Internet','Phone','Groceries','Fuel','Vehicle','Medical','Dental','Clothing','Dining out','Entertainment','School fees','Pets','Garden','Home maintenance','Other expense'] },
  travel: { expense: ['Accommodation','Flights','Transport','Meals','Activities','Shopping','Insurance','Visas/fees','Other travel'] },
}

// ─── UTILS ───────────────────────────────────────────────────────────────────

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2)
const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
export const getFY = (dateStr) => { const d = new Date(dateStr + 'T12:00:00'); const y = d.getFullYear(), m = d.getMonth(); return m >= 6 ? y : y - 1 }
export const currentFY = () => getFY(localDate())
const fyLabel = (fy) => `FY${fy}/${String(fy + 1).slice(2)}`
const fmtAUD = (n) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0)
const fmtAUDExact = (n) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n || 0)

// ─── STORAGE & MIGRATION ─────────────────────────────────────────────────────

function migrateFromV4() {
  try {
    const raw = localStorage.getItem('ledger_v4')
    if (!raw) return []
    const old = JSON.parse(raw)
    if (!old?.transactions || Array.isArray(old.transactions)) return []
    const entityMap = { Signal9: 's9', 'App Sales': 'apps' }
    const txns = []
    Object.entries(old.transactions).forEach(([biz, items]) => {
      const entity = entityMap[biz]
      if (!entity || !Array.isArray(items)) return
      items.forEach(t => txns.push({ id: t.id || uid(), date: t.date, entity, type: t.type === 'in' ? 'income' : 'expense', category: t.category || 'Other', description: t.description || '', amount: parseFloat(t.amount) || 0, gst: 'no', notes: t.notes || '' }))
    })
    return txns
  } catch { return [] }
}

function initData() {
  return { transactions: migrateFromV4(), trips: [], travelExpenses: [], categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)), rates: { USD: 1.52, JPY: 0.0098, updatedAt: null } }
}

export function loadLedger() {
  try {
    const raw = localStorage.getItem(LEDGER_KEY)
    if (!raw) return initData()
    const d = JSON.parse(raw)
    if (!d.categories) d.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES))
    if (!d.rates) d.rates = { USD: 1.52, JPY: 0.0098, updatedAt: null }
    if (!d.trips) d.trips = []
    if (!d.travelExpenses) d.travelExpenses = []
    return d
  } catch { return initData() }
}

function saveLedger(data) {
  try { localStorage.setItem(LEDGER_KEY, JSON.stringify(data)) } catch {}
}

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────

const S = {
  surface: { background: 'rgba(16,14,12,0.88)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 14 },
  card: (color) => ({ background: `linear-gradient(135deg, ${color}16, ${color}06, rgba(10,9,8,0.6))`, border: `0.5px solid ${color}35`, borderRadius: 16, clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)' }),
  input: { width: '100%', background: 'rgba(10,9,8,0.95)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#EDE8E0', fontFamily: '"DM Mono", monospace', fontSize: '0.82rem', padding: '9px 12px', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' },
  label: { display: 'block', fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(160,140,120,0.5)', marginBottom: 5 },
  chip: (color = '#C4522A') => ({ background: `${color}18`, border: `0.5px solid ${color}40`, color, borderRadius: 8, padding: '7px 13px', cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '0.56rem', letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: 5 }),
  solid: (color = '#C4522A') => ({ background: `linear-gradient(135deg, ${color}dd, ${color})`, border: `1px solid ${color}`, color: '#fff', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.1em', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }),
  th: { padding: '8px 10px', textAlign: 'left', color: 'rgba(160,140,120,0.35)', fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', letterSpacing: '0.15em', textTransform: 'uppercase', borderBottom: '0.5px solid rgba(255,255,255,0.05)', fontWeight: 400 },
  tip: { background: '#151210', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 8, fontFamily: '"DM Mono", monospace', fontSize: 11 },
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────

function Field({ label, children, style }) {
  return <div style={style}><label style={S.label}>{label}</label>{children}</div>
}

function MetricCard({ label, value, sub, color, style }) {
  return (
    <div style={{ ...S.surface, padding: '12px 14px', ...style }}>
      <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(160,140,120,0.4)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '1.05rem', fontWeight: 700, color: color || '#EDE8E0', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', color: 'rgba(160,140,120,0.35)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function EBadge({ entity }) {
  const e = ENTITIES[entity]; if (!e) return null
  return <span style={{ padding: '2px 7px', borderRadius: 20, fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', fontWeight: 700, background: `${e.color}18`, color: e.color, border: `0.5px solid ${e.color}35` }}>{e.short}</span>
}

function TBadge({ type }) {
  const m = { income: { c: '#10B981', l: 'IN' }, expense: { c: '#EF4444', l: 'OUT' } }[type] || { c: '#EF4444', l: 'OUT' }
  return <span style={{ padding: '2px 7px', borderRadius: 20, fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', fontWeight: 700, background: `${m.c}18`, color: m.c, border: `0.5px solid ${m.c}30` }}>{m.l}</span>
}

// ─── MODAL SHELL ─────────────────────────────────────────────────────────────

function ModalShell({ title, accent, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ ...S.surface, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', borderRadius: '18px 18px 0 0', padding: '20px 20px 36px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.1rem', color: accent || '#EDE8E0' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(160,140,120,0.4)', cursor: 'pointer', padding: 4 }}><X size={17} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Confirm({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ ...S.surface, padding: 24, maxWidth: 300, width: '100%' }}>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.78rem', color: '#EDE8E0', marginBottom: 20, lineHeight: 1.55 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onConfirm} style={S.solid('#EF4444')}>Delete</button>
          <button onClick={onCancel} style={S.chip()}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── TRANSACTION MODAL ───────────────────────────────────────────────────────

function TxnModal({ editData, categories, defaultEntity, onSave, onClose }) {
  const [f, setF] = useState({ date: localDate(), type: 'expense', entity: defaultEntity || 'bp', category: '', description: '', amount: '', gst: 'no', notes: '', ...(editData || {}) })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const accent = ENTITIES[f.entity]?.color || '#C4522A'

  const cats = useMemo(() => {
    const c = categories[f.entity]; if (!c) return []
    return f.type === 'income' ? (c.income || []) : (c.expense || [])
  }, [f.entity, f.type, categories])

  const save = () => {
    if (!f.date || !f.description.trim() || !f.amount) return
    onSave({ ...f, id: editData?.id || uid(), amount: parseFloat(f.amount) || 0 })
  }

  return (
    <ModalShell title={editData ? 'Edit Transaction' : 'New Transaction'} accent={accent} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Date"><input type="date" style={S.input} value={f.date} onChange={e => set('date', e.target.value)} /></Field>
          <Field label="Type">
            <select style={S.input} value={f.type} onChange={e => setF(p => ({ ...p, type: e.target.value, category: '' }))}>
              <option value="expense">Expense</option><option value="income">Income</option>
            </select>
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Entity">
            <select style={S.input} value={f.entity} onChange={e => setF(p => ({ ...p, entity: e.target.value, category: '' }))}>
              {Object.entries(ENTITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select style={S.input} value={f.category} onChange={e => set('category', e.target.value)}>
              <option value="">Select…</option>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Description">
          <input style={S.input} value={f.description} onChange={e => set('description', e.target.value)} placeholder="What was this for?" />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Amount (AUD)">
            <input type="number" step="0.01" min="0" style={S.input} value={f.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="GST">
            <select style={S.input} value={f.gst} onChange={e => set('gst', e.target.value)}>
              <option value="no">No / N/A</option><option value="yes">Yes — included</option><option value="exempt">Exempt</option>
            </select>
          </Field>
        </div>
        <Field label="Notes (optional)">
          <textarea style={{ ...S.input, minHeight: 52, resize: 'vertical' }} value={f.notes} onChange={e => set('notes', e.target.value)} placeholder="Receipt, supplier, project…" />
        </Field>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={save} style={S.solid(accent)}>Save</button>
          <button onClick={onClose} style={S.chip()}>Cancel</button>
        </div>
      </div>
    </ModalShell>
  )
}

// ─── TRIP MODAL ──────────────────────────────────────────────────────────────

function TripModal({ onSave, onClose }) {
  const [f, setF] = useState({ name: '', destination: '', currency: 'AUD', from: localDate(), to: '', notes: '' })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  return (
    <ModalShell title="New Trip" accent="#F59E0B" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Field label="Trip name">
          <input style={S.input} value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Tokyo March 2026" autoFocus />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Destination"><input style={S.input} value={f.destination} onChange={e => set('destination', e.target.value)} placeholder="Country / City" /></Field>
          <Field label="Currency">
            <select style={S.input} value={f.currency} onChange={e => set('currency', e.target.value)}>
              <option value="AUD">AUD</option><option value="USD">USD</option><option value="JPY">JPY</option>
            </select>
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Departure"><input type="date" style={S.input} value={f.from} onChange={e => set('from', e.target.value)} /></Field>
          <Field label="Return"><input type="date" style={S.input} value={f.to} onChange={e => set('to', e.target.value)} /></Field>
        </div>
        <Field label="Notes">
          <textarea style={{ ...S.input, minHeight: 52, resize: 'vertical' }} value={f.notes} onChange={e => set('notes', e.target.value)} placeholder="Purpose of travel…" />
        </Field>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={() => { if (!f.name.trim()) return; onSave({ ...f, id: uid() }) }} style={S.solid('#F59E0B')}>Create Trip</button>
          <button onClick={onClose} style={S.chip()}>Cancel</button>
        </div>
      </div>
    </ModalShell>
  )
}

// ─── TRAVEL EXPENSE MODAL ────────────────────────────────────────────────────

function TravelExpModal({ trips, rates, categories, defaultTripId, editData, onSave, onClose }) {
  const calcAUD = (amt, cur, r) => { const n = parseFloat(amt) || 0; if (cur === 'USD') return (n * (r.USD || 1.52)).toFixed(2); if (cur === 'JPY') return (n * (r.JPY || 0.0098)).toFixed(2); return n ? n.toFixed(2) : '' }
  const [f, setF] = useState({ tripId: defaultTripId || trips[0]?.id || '', date: localDate(), amount: '', currency: 'AUD', aud: '', category: categories.travel?.expense?.[0] || '', claimable: 'yes', description: '', notes: '', ...(editData || {}) })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const save = () => { if (!f.tripId || !f.amount || !f.description.trim()) return; onSave({ ...f, id: editData?.id || uid(), amount: parseFloat(f.amount) || 0, aud: parseFloat(f.aud) || 0 }) }
  return (
    <ModalShell title={editData ? 'Edit Expense' : 'Add Travel Expense'} accent="#F59E0B" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Trip">
            <select style={S.input} value={f.tripId} onChange={e => set('tripId', e.target.value)}>
              {trips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Date"><input type="date" style={S.input} value={f.date} onChange={e => set('date', e.target.value)} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <Field label="Amount">
            <input type="number" step="0.01" min="0" style={S.input} value={f.amount} onChange={e => { const v = e.target.value; setF(p => ({ ...p, amount: v, aud: calcAUD(v, p.currency, rates) })) }} placeholder="0.00" />
          </Field>
          <Field label="Currency">
            <select style={S.input} value={f.currency} onChange={e => { const cur = e.target.value; setF(p => ({ ...p, currency: cur, aud: calcAUD(p.amount, cur, rates) })) }}>
              <option value="AUD">AUD</option><option value="USD">USD</option><option value="JPY">JPY</option>
            </select>
          </Field>
          <Field label="AUD equiv.">
            <input type="number" step="0.01" style={S.input} value={f.aud} onChange={e => set('aud', e.target.value)} placeholder="Auto" />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Category">
            <select style={S.input} value={f.category} onChange={e => set('category', e.target.value)}>
              {(categories.travel?.expense || []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Claimable?">
            <select style={S.input} value={f.claimable} onChange={e => set('claimable', e.target.value)}>
              <option value="yes">Yes — business</option><option value="partial">Partial</option><option value="no">No — personal</option>
            </select>
          </Field>
        </div>
        <Field label="Description"><input style={S.input} value={f.description} onChange={e => set('description', e.target.value)} placeholder="Hotel, meal, transport…" /></Field>
        <Field label="Notes"><textarea style={{ ...S.input, minHeight: 46, resize: 'vertical' }} value={f.notes} onChange={e => set('notes', e.target.value)} placeholder="Receipt details…" /></Field>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={save} style={S.solid('#F59E0B')}>Save Expense</button>
          <button onClick={onClose} style={S.chip()}>Cancel</button>
        </div>
      </div>
    </ModalShell>
  )
}

// ─── TRANSACTION TABLE ───────────────────────────────────────────────────────

function TxnTable({ txns, showEntity, onEdit, onDelete }) {
  if (!txns.length) return (
    <div style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(160,140,120,0.22)', fontFamily: '"DM Mono", monospace', fontSize: '0.62rem', letterSpacing: '0.12em' }}>
      NO TRANSACTIONS
    </div>
  )
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
        <thead>
          <tr>
            <th style={S.th}>Date</th>
            {showEntity && <th style={S.th}>Entity</th>}
            <th style={S.th}>Type</th>
            <th style={S.th}>Category</th>
            <th style={S.th}>Description</th>
            <th style={{ ...S.th, textAlign: 'right' }}>Amount</th>
            <th style={S.th}></th>
          </tr>
        </thead>
        <tbody>
          {txns.map(t => {
            const isFuel = t._source === 'fuel'
            return (
              <tr key={t.id} style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)', opacity: isFuel ? 0.8 : 1 }}>
                <td style={{ padding: '9px 10px', color: 'rgba(160,140,120,0.5)', whiteSpace: 'nowrap', fontFamily: '"DM Mono", monospace' }}>{t.date}</td>
                {showEntity && <td style={{ padding: '9px 10px' }}><EBadge entity={t.entity} /></td>}
                <td style={{ padding: '9px 10px' }}><TBadge type={t.type} /></td>
                <td style={{ padding: '9px 10px', fontFamily: '"DM Mono", monospace' }}>
                  <span style={{ color: 'rgba(200,185,165,0.6)' }}>{t.category}</span>
                  {isFuel && <span style={{ marginLeft: 5, fontSize: '0.9em' }}>⛽</span>}
                </td>
                <td style={{ padding: '9px 10px', color: '#EDE8E0', fontFamily: '"DM Mono", monospace' }}>{t.description}</td>
                <td style={{ padding: '9px 10px', fontWeight: 700, color: t.type === 'income' ? '#10B981' : '#EF4444', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', textAlign: 'right', fontFamily: '"DM Mono", monospace' }}>
                  {t.type === 'income' ? '+' : '-'}{fmtAUDExact(t.amount)}
                </td>
                <td style={{ padding: '9px 4px', whiteSpace: 'nowrap' }}>
                  {!isFuel && onEdit   && <button onClick={() => onEdit(t)}    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(160,140,120,0.3)', padding: '2px 5px' }}><Edit2 size={11} /></button>}
                  {!isFuel && onDelete && <button onClick={() => onDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,77,106,0.3)', padding: '2px 5px' }}><Trash2 size={11} /></button>}
                  {isFuel && <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.4rem', color: 'rgba(160,140,120,0.3)', padding: '2px 6px' }}>FUEL</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── HUB VIEW ────────────────────────────────────────────────────────────────

function HubView({ data, onNavigate }) {
  const fy = currentFY()
  const fyTxns = data.transactions.filter(t => getFY(t.date) === fy)

  return (
    <div style={{ padding: '20px 16px', paddingBottom: 80 }}>

      {/* FY summary strip */}
      {data.transactions.length > 0 && (() => {
        const inc = fyTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
        const exp = fyTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        const net = inc - exp
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
            <MetricCard label={`${fyLabel(fy)} income`} value={fmtAUD(inc)} color="#10B981" />
            <MetricCard label="Expenses" value={fmtAUD(exp)} color="#EF4444" />
            <MetricCard label="Net" value={fmtAUD(net)} color={net >= 0 ? '#10B981' : '#EF4444'} />
          </div>
        )
      })()}

      {/* Section label */}
      <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(160,140,120,0.35)', marginBottom: 12 }}>Entities</div>

      {/* Entity cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {Object.entries(ENTITIES).map(([key, e], i) => {
          const inc = fyTxns.filter(t => t.entity === key && t.type === 'income').reduce((s, t) => s + t.amount, 0)
          const exp = fyTxns.filter(t => t.entity === key && t.type === 'expense').reduce((s, t) => s + t.amount, 0)
          const net = inc - exp
          const count = data.transactions.filter(t => t.entity === key).length
          return (
            <button key={key} onClick={() => onNavigate(key)}
              style={{ position: 'relative', overflow: 'hidden', border: `0.5px solid ${e.color}35`, borderRadius: 16, clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)', padding: '18px 16px', cursor: 'pointer', textAlign: 'left', animation: `phase-in 0.55s cubic-bezier(0.22,1,0.36,1) ${i * 0.06}s both`, display: 'block', width: '100%', background: '#0e0c0a', minHeight: 160 }}>
              {/* Card background image */}
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${e.bg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.22 }} />
              {/* Card colour overlay */}
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${e.color}22 0%, transparent 60%, rgba(8,7,6,0.6) 100%)` }} />
              {/* Content */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: `${e.color}cc`, marginBottom: 6 }}>{e.short}</div>
                <div style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '0.95rem', color: '#EDE8E0', marginBottom: 4, lineHeight: 1.2 }}>{e.label}</div>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.46rem', color: 'rgba(160,140,120,0.5)', marginBottom: 14, lineHeight: 1.4 }}>{e.desc}</div>
                <div style={{ borderTop: `0.5px solid ${e.color}25`, paddingTop: 10 }}>
                  {count > 0 ? (
                    <>
                      <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '1rem', fontWeight: 700, color: net >= 0 ? '#10B981' : '#EF4444', fontVariantNumeric: 'tabular-nums' }}>{fmtAUD(Math.abs(net))}</div>
                      <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.42rem', color: 'rgba(160,140,120,0.4)', marginTop: 2 }}>{net >= 0 ? 'net positive' : 'net negative'} · {count} records</div>
                    </>
                  ) : (
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.46rem', color: `${e.color}70` }}>No records yet</div>
                  )}
                </div>
              </div>
              <ChevronRight size={15} style={{ position: 'absolute', bottom: 14, right: 14, color: `${e.color}60` }} />
            </button>
          )
        })}
      </div>

      {/* Travel card — full width */}
      <button onClick={() => onNavigate('travel')}
        style={{ position: 'relative', overflow: 'hidden', border: '0.5px solid #F59E0B35', borderRadius: 16, clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)', padding: '18px 20px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20, animation: 'phase-in 0.55s cubic-bezier(0.22,1,0.36,1) 0.24s both', background: '#0e0c0a', minHeight: 80 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgTravel})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.2 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(8,7,6,0.3) 0%, rgba(8,7,6,0.7) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#F59E0Bbb', marginBottom: 5 }}>Travel</div>
          <div style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1rem', color: '#EDE8E0', marginBottom: 2 }}>Trips & Travel Expenses</div>
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.46rem', color: 'rgba(160,140,120,0.5)' }}>Receipts, forex & tax claimables</div>
        </div>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '1.1rem', fontWeight: 700, color: '#F59E0B' }}>{data.trips.length}</div>
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', color: 'rgba(160,140,120,0.45)' }}>{data.trips.length === 1 ? 'trip' : 'trips'}</div>
          <ChevronRight size={15} color="#F59E0B70" />
        </div>
      </button>

      {/* Tools row */}
      <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(160,140,120,0.35)', marginBottom: 12 }}>Tools</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, animation: 'phase-in 0.55s ease 0.3s both' }}>
        {[
          { key: 'reports', label: 'Reports' },
          { key: 'tax',     label: 'Tax' },
          { key: 'data',    label: 'Data' },
          { key: 'settings',label: 'Settings' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => onNavigate(key)} style={{ padding: '12px 8px', background: 'rgba(14,12,10,0.7)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 12, color: 'rgba(160,140,120,0.55)', fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s' }}>{label}</button>
        ))}
      </div>
    </div>
  )
}

// ─── FUEL BRIDGE ─────────────────────────────────────────────────────────────
// Read fuel entries and present them as virtual ledger transactions.
// They are never copied into ledger_v5 — fuel store stays the source of truth.

function loadFuelAsVirtual() {
  try {
    const raw = localStorage.getItem('agenda-fuel-v1')
    if (!raw) return []
    return JSON.parse(raw).map(f => ({
      id: 'fuel_' + f.id,
      date: f.date,
      entity: 'home',
      type: 'expense',
      category: 'Fuel',
      description: f.notes ? `Fuel — ${f.notes}` : `Fuel (${f.paymentMethod || ''})`,
      amount: f.cost || 0,
      gst: 'yes',
      notes: f.litres ? `${f.litres}L` : '',
      _source: 'fuel',
      _fuelId: f.id,
    }))
  } catch { return [] }
}

// Write a new fuel entry from the ledger side (Household › Fuel category)
function addFuelEntry({ date, cost, notes }) {
  try {
    const raw = localStorage.getItem('agenda-fuel-v1')
    const entries = raw ? JSON.parse(raw) : []
    const newEntry = { id: Date.now().toString(), date, cost, litres: 0, paymentMethod: 'living', notes: notes || '', createdAt: new Date().toISOString() }
    const updated = [newEntry, ...entries].sort((a, b) => b.date.localeCompare(a.date))
    localStorage.setItem('agenda-fuel-v1', JSON.stringify(updated))
  } catch {}
}

// ─── ENTITY VIEW ─────────────────────────────────────────────────────────────

function EntityView({ entity, data, onAdd, onDelete }) {
  const [typeF, setTypeF] = useState('all')
  const [fyF, setFyF]     = useState('all')
  const [search, setSearch] = useState('')
  const e = ENTITIES[entity]

  // For Household: merge virtual fuel entries
  const fuelVirtual = useMemo(() => entity === 'home' ? loadFuelAsVirtual() : [], [entity])

  const allTxns = useMemo(() => {
    const ledger = data.transactions.filter(t => t.entity === entity)
    if (entity !== 'home') return ledger
    // Exclude any ledger transactions that shadow a fuel entry (category=Fuel, source=fuel)
    const fuelIds = new Set(fuelVirtual.map(f => f._fuelId))
    const nonFuel = ledger.filter(t => !(t.category === 'Fuel' && t._source === 'fuel'))
    return [...nonFuel, ...fuelVirtual]
  }, [data, entity, fuelVirtual])

  const allFYs = useMemo(() =>
    [...new Set(allTxns.map(t => getFY(t.date)))].sort((a, b) => b - a)
  , [allTxns])

  const txns = useMemo(() => {
    let t = allTxns
    if (typeF !== 'all') t = t.filter(x => x.type === typeF)
    if (fyF  !== 'all') t = t.filter(x => getFY(x.date) === parseInt(fyF))
    if (search) t = t.filter(x => (x.description + x.category + (x.notes || '')).toLowerCase().includes(search.toLowerCase()))
    return t.sort((a, b) => b.date.localeCompare(a.date))
  }, [allTxns, typeF, fyF, search])

  const income  = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const net = income - expense

  const monthData = useMemo(() => {
    const months = {}
    allTxns.forEach(t => {
      const m = t.date.slice(0, 7)
      if (!months[m]) months[m] = { m, income: 0, expense: 0 }
      if (t.type === 'income')  months[m].income  += t.amount
      if (t.type === 'expense') months[m].expense += t.amount
    })
    const MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return Object.values(months).sort((a, b) => a.m.localeCompare(b.m)).slice(-6).map(m => ({ ...m, label: MO[parseInt(m.m.slice(5))-1] }))
  }, [allTxns])

  const fuelCount = fuelVirtual.length

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        <MetricCard label="Income"   value={fmtAUD(income)}  color="#10B981" />
        <MetricCard label="Expenses" value={fmtAUD(expense)} color="#EF4444" />
        <MetricCard label="Net"      value={fmtAUD(net)}     color={net >= 0 ? '#10B981' : '#EF4444'} />
      </div>

      {/* Fuel sync notice for Household */}
      {entity === 'home' && fuelCount > 0 && (
        <div style={{ ...S.surface, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, border: '0.5px solid rgba(251,191,36,0.2)' }}>
          <span style={{ fontSize: '1rem' }}>⛽</span>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', color: 'rgba(251,191,36,0.7)' }}>
            {fuelCount} fuel fill-up{fuelCount !== 1 ? 's' : ''} synced from Fuel Tracker — shown read-only below
          </span>
        </div>
      )}

      {/* Mini chart */}
      {monthData.length > 1 && (
        <div style={{ ...S.surface, padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(160,140,120,0.38)', marginBottom: 10 }}>Last 6 months</div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={monthData} margin={{ top: 0, right: 0, left: -26, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: 'rgba(160,140,120,0.5)', fontSize: 10, fontFamily: '"DM Mono"' }} />
              <YAxis tick={{ fill: 'rgba(160,140,120,0.35)', fontSize: 9 }} tickFormatter={v => v > 0 ? `$${(v/1000).toFixed(0)}k` : ''} />
              <Tooltip contentStyle={S.tip} formatter={v => fmtAUD(v)} />
              <Bar dataKey="income"  fill={e.color + '66'} name="Income"  radius={[3,3,0,0]} />
              <Bar dataKey="expense" fill="#EF444455"       name="Expense" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ ...S.surface, padding: '10px 12px', marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select style={{ ...S.input, width: 'auto', flex: 1, minWidth: 100 }} value={typeF} onChange={ev => setTypeF(ev.target.value)}>
          <option value="all">All types</option><option value="income">Income</option><option value="expense">Expense</option>
        </select>
        <select style={{ ...S.input, width: 'auto', flex: 1, minWidth: 100 }} value={fyF} onChange={ev => setFyF(ev.target.value)}>
          <option value="all">All years</option>
          {allFYs.map(fy => <option key={fy} value={fy}>{fyLabel(fy)}</option>)}
        </select>
        <input style={{ ...S.input, flex: 2, minWidth: 110 }} value={search} onChange={ev => setSearch(ev.target.value)} placeholder="Search…" />
      </div>

      {/* Table — fuel rows are read-only (no edit/delete) */}
      <div style={{ ...S.surface, overflow: 'hidden' }}>
        <TxnTable
          txns={txns}
          onEdit={t => !t._source && onAdd(t, entity)}
          onDelete={id => onDelete(id)}
        />
      </div>
    </div>
  )
}

// ─── TRAVEL VIEW ─────────────────────────────────────────────────────────────

function TravelView({ data, onAddTrip, onDeleteTrip, onAddExpense, onDeleteExpense }) {
  const { trips, travelExpenses } = data
  const TC = '#F59E0B'
  const totalAUD = travelExpenses.reduce((s, e) => s + (e.aud || 0), 0)
  const claimable = travelExpenses.filter(e => e.claimable !== 'no').reduce((s, e) => s + (e.aud || 0), 0)

  const clBadge = (cl) => {
    const map = { yes: { c: '#10B981', l: 'CLAIM' }, partial: { c: '#F59E0B', l: 'PARTIAL' }, no: { c: '#EF4444', l: 'PERSONAL' } }
    const m = map[cl] || map.no
    return <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.46rem', padding: '2px 6px', borderRadius: 20, background: `${m.c}18`, color: m.c, border: `0.5px solid ${m.c}35` }}>{m.l}</span>
  }

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={onAddTrip} style={S.chip(TC)}><Plus size={11} />New Trip</button>
        <button onClick={() => onAddExpense(null)} style={{ ...S.chip(TC), opacity: trips.length ? 1 : 0.4, pointerEvents: trips.length ? 'all' : 'none' }}><Plus size={11} />Add Expense</button>
      </div>

      {trips.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          <MetricCard label="Total Travel (AUD)" value={fmtAUD(totalAUD)} sub={`${trips.length} trip${trips.length !== 1 ? 's' : ''}`} color={TC} />
          <MetricCard label="Claimable" value={fmtAUD(claimable)} color="#10B981" />
        </div>
      )}

      {!trips.length
        ? <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(160,140,120,0.22)', fontFamily: '"DM Mono", monospace', fontSize: '0.62rem', letterSpacing: '0.12em' }}>NO TRIPS YET</div>
        : [...trips].sort((a, b) => b.from.localeCompare(a.from)).map(trip => {
            const exps = travelExpenses.filter(e => e.tripId === trip.id).sort((a, b) => b.date.localeCompare(a.date))
            const tripTotal = exps.reduce((s, e) => s + (e.aud || 0), 0)
            const tripClaim = exps.filter(e => e.claimable !== 'no').reduce((s, e) => s + (e.aud || 0), 0)
            return (
              <div key={trip.id} style={{ ...S.surface, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ background: `${TC}0e`, borderBottom: '0.5px solid rgba(255,255,255,0.05)', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '0.98rem', color: '#EDE8E0' }}>{trip.name}</div>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', color: 'rgba(160,140,120,0.5)', marginTop: 2 }}>{trip.destination}{trip.from ? ` · ${trip.from}` : ''}{trip.to ? ` → ${trip.to}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.58rem', color: '#10B981' }}>Claim: {fmtAUD(tripClaim)}</span>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', fontWeight: 700, color: TC }}>{fmtAUD(tripTotal)}</span>
                    <button onClick={() => onAddExpense(trip.id)} style={S.chip(TC)}><Plus size={10} /></button>
                    <button onClick={() => onDeleteTrip(trip.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,77,106,0.35)', padding: 4 }}><Trash2 size={12} /></button>
                  </div>
                </div>
                {exps.length ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"DM Mono", monospace', fontSize: '0.68rem' }}>
                      <thead><tr>{['Date','Category','Description','Amount','AUD','Claimable',''].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {exps.map(e => (
                          <tr key={e.id} style={{ borderBottom: '0.5px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '8px 10px', color: 'rgba(160,140,120,0.5)' }}>{e.date}</td>
                            <td style={{ padding: '8px 10px', color: 'rgba(200,185,165,0.6)' }}>{e.category}</td>
                            <td style={{ padding: '8px 10px', color: '#EDE8E0' }}>{e.description}</td>
                            <td style={{ padding: '8px 10px', fontVariantNumeric: 'tabular-nums', color: 'rgba(200,185,165,0.7)' }}>{e.currency === 'JPY' ? '¥' : e.currency === 'USD' ? 'US$' : 'A$'}{e.amount}</td>
                            <td style={{ padding: '8px 10px', color: 'rgba(160,140,120,0.55)', fontVariantNumeric: 'tabular-nums' }}>{fmtAUDExact(e.aud)}</td>
                            <td style={{ padding: '8px 10px' }}>{clBadge(e.claimable)}</td>
                            <td style={{ padding: '8px 4px' }}><button onClick={() => onDeleteExpense(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,77,106,0.3)', padding: 4 }}><Trash2 size={11} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p style={{ padding: '12px 14px', color: 'rgba(160,140,120,0.25)', fontFamily: '"DM Mono", monospace', fontSize: '0.58rem' }}>No expenses yet</p>}
              </div>
            )
          })
      }
    </div>
  )
}

// ─── REPORTS VIEW ────────────────────────────────────────────────────────────

function ReportsView({ data }) {
  const [period, setPeriod] = useState('fy')
  const now = new Date()

  const filtered = useMemo(() => {
    const txns = data.transactions
    if (period === 'fy')      return txns.filter(t => getFY(t.date) === currentFY())
    if (period === 'month')   { const m = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`; return txns.filter(t => t.date.slice(0,7) === m) }
    if (period === 'quarter') { const q = Math.floor(now.getMonth()/3), y = now.getFullYear(); return txns.filter(t => { const d = new Date(t.date+'T12:00:00'); return d.getFullYear()===y && Math.floor(d.getMonth()/3)===q }) }
    return txns
  }, [data, period])

  const cashflow = useMemo(() => {
    const months = {}
    filtered.forEach(t => {
      const m = t.date.slice(0,7)
      if (!months[m]) months[m] = { m, income: 0, expense: 0 }
      if (t.type==='income')  months[m].income  += t.amount
      if (t.type==='expense') months[m].expense += t.amount
    })
    const MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return Object.values(months).sort((a,b) => a.m.localeCompare(b.m)).map(m => ({ ...m, label: MO[parseInt(m.m.slice(5))-1]+' '+m.m.slice(2,4) }))
  }, [filtered])

  const catData = useMemo(() => {
    const c = {}; filtered.filter(t => t.type==='expense').forEach(t => { c[t.category] = (c[t.category]||0)+t.amount })
    return Object.entries(c).sort((a,b) => b[1]-a[1]).slice(0,8).map(([name,value]) => ({ name, value }))
  }, [filtered])

  const pills = [{ k:'fy',l:'This FY' },{ k:'month',l:'This month' },{ k:'quarter',l:'This quarter' },{ k:'all',l:'All time' }]

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {pills.map(p => (
          <button key={p.k} onClick={() => setPeriod(p.k)} style={{ padding: '6px 14px', borderRadius: 20, fontFamily: '"DM Mono", monospace', fontSize: '0.56rem', letterSpacing: '0.08em', cursor: 'pointer', border: '0.5px solid', borderColor: period===p.k ? '#C4522A' : 'rgba(255,255,255,0.1)', background: period===p.k ? '#C4522A22' : 'transparent', color: period===p.k ? '#C4522A' : 'rgba(160,140,120,0.5)' }}>{p.l}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={{ ...S.surface, padding: 14 }}>
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(160,140,120,0.4)', marginBottom: 10 }}>Monthly Cash Flow</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={cashflow} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tick={{ fill: 'rgba(160,140,120,0.5)', fontSize: 9, fontFamily: '"DM Mono"' }} />
              <YAxis tick={{ fill: 'rgba(160,140,120,0.35)', fontSize: 9 }} tickFormatter={v => v > 0 ? `$${(v/1000).toFixed(0)}k` : ''} />
              <Tooltip contentStyle={S.tip} formatter={v => fmtAUD(v)} />
              <Line type="monotone" dataKey="income"  stroke="#10B981" strokeWidth={2} dot={false} name="Income" />
              <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} dot={false} name="Expense" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ ...S.surface, padding: 14 }}>
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(160,140,120,0.4)', marginBottom: 10 }}>Top Expense Categories</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={catData} layout="vertical" margin={{ top: 0, right: 0, left: 80, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: 'rgba(160,140,120,0.35)', fontSize: 9 }} tickFormatter={v => `$${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(160,140,120,0.6)', fontSize: 8, fontFamily: '"DM Mono"' }} width={80} />
              <Tooltip contentStyle={S.tip} formatter={v => fmtAUD(v)} />
              <Bar dataKey="value" fill="#C4522A88" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Entity comparison */}
      <div style={{ ...S.surface, padding: 14 }}>
        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(160,140,120,0.4)', marginBottom: 10 }}>Income vs Expenses by Entity</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={Object.entries(ENTITIES).map(([k, e]) => ({ name: e.short, income: filtered.filter(t => t.entity===k&&t.type==='income').reduce((s,t)=>s+t.amount,0), expense: filtered.filter(t => t.entity===k&&t.type==='expense').reduce((s,t)=>s+t.amount,0) }))} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: 'rgba(160,140,120,0.55)', fontSize: 10, fontFamily: '"DM Mono"' }} />
            <YAxis tick={{ fill: 'rgba(160,140,120,0.35)', fontSize: 9 }} tickFormatter={v => v > 0 ? `$${(v/1000).toFixed(0)}k` : ''} />
            <Tooltip contentStyle={S.tip} formatter={v => fmtAUD(v)} />
            <Bar dataKey="income"  fill="#10B98166" name="Income"  radius={[3,3,0,0]} />
            <Bar dataKey="expense" fill="#EF444455" name="Expense" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── TAX VIEW ────────────────────────────────────────────────────────────────

function dlCSV(rows, filename) {
  const csv = rows.map(r => r.map(c => '"' + String(c||'').replace(/"/g,'""') + '"').join(',')).join('\n')
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = filename; a.click()
}

function TaxView({ data }) {
  const allFYs = useMemo(() => { const fys = [...new Set(data.transactions.map(t => getFY(t.date)))].sort((a,b)=>b-a); return fys.length ? fys : [currentFY()] }, [data])
  const [fy, setFy] = useState(() => allFYs[0])
  const fyTxns = data.transactions.filter(t => getFY(t.date) === fy)
  const travelClaim = data.travelExpenses.filter(e => e.claimable !== 'no' && getFY(e.date) === fy)

  const exportCSV = () => {
    const rows = [['Date','Entity','Type','Category','Description','Amount AUD','GST','Notes']]
    fyTxns.sort((a,b)=>a.date.localeCompare(b.date)).forEach(t => rows.push([t.date, ENTITIES[t.entity]?.label||t.entity, t.type, t.category, t.description, t.amount, t.gst, t.notes||'']))
    dlCSV(rows, `tax-${fyLabel(fy)}.csv`)
  }

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <select style={{ ...S.input, width: 'auto' }} value={fy} onChange={e => setFy(parseInt(e.target.value))}>
          {allFYs.map(f => <option key={f} value={f}>{fyLabel(f)}</option>)}
        </select>
        <button onClick={exportCSV} style={S.chip()}><Download size={11} />Export CSV</button>
      </div>
      {Object.entries(ENTITIES).map(([key, e]) => {
        const et = fyTxns.filter(t => t.entity === key); if (!et.length) return null
        const income  = et.filter(t => t.type==='income').reduce((s,t)=>s+t.amount,0)
        const expense = et.filter(t => t.type==='expense').reduce((s,t)=>s+t.amount,0)
        const gstIn   = et.filter(t => t.type==='income'&&t.gst==='yes').reduce((s,t)=>s+t.amount/11,0)
        const gstOut  = et.filter(t => t.type==='expense'&&t.gst==='yes').reduce((s,t)=>s+t.amount/11,0)
        const catExp  = {}; et.filter(t => t.type==='expense').forEach(t => { catExp[t.category] = (catExp[t.category]||0)+t.amount })
        return (
          <div key={key} style={{ ...S.surface, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontFamily: '"DM Mono", monospace', padding: '3px 10px', borderRadius: 20, fontSize: '0.56rem', fontWeight: 700, background: `${e.color}18`, color: e.color, border: `0.5px solid ${e.color}35` }}>{e.label}</span>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', padding: '2px 7px', background: '#F59E0B12', color: '#F59E0B', border: '0.5px solid #F59E0B28', borderRadius: 6 }}>{fyLabel(fy)}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
              <MetricCard label="Income"        value={fmtAUD(income)}          color="#10B981" />
              <MetricCard label="Expenses"      value={fmtAUD(expense)}         color="#EF4444" />
              <MetricCard label="Net"           value={fmtAUD(income-expense)}  color={income-expense>=0?'#10B981':'#EF4444'} />
              <MetricCard label="GST collected" value={fmtAUD(gstIn)}           sub={`Paid: ${fmtAUD(gstOut)}`} />
            </div>
            {Object.entries(catExp).sort((a,b)=>b[1]-a[1]).map(([cat,amt]) => (
              <div key={cat} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'0.5px solid rgba(255,255,255,0.04)', fontFamily: '"DM Mono", monospace', fontSize:'0.68rem' }}>
                <span style={{ color:'rgba(200,185,165,0.7)' }}>{cat}</span>
                <span style={{ color:'#EF4444', fontVariantNumeric:'tabular-nums' }}>{fmtAUDExact(amt)}</span>
              </div>
            ))}
          </div>
        )
      })}
      {travelClaim.length > 0 && (
        <div style={{ ...S.surface, padding: 16, marginBottom: 12 }}>
          <div style={{ fontFamily: '"DM Mono", monospace', display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
            <span style={{ padding:'3px 10px', borderRadius:20, fontSize:'0.56rem', fontWeight:700, background:'#F59E0B18', color:'#F59E0B', border:'0.5px solid #F59E0B35' }}>Travel (Claimable)</span>
          </div>
          <div style={{ fontFamily: '"DM Mono", monospace', display:'flex', justifyContent:'space-between', padding:'7px 0', fontSize:'0.7rem' }}>
            <span style={{ color:'rgba(200,185,165,0.7)' }}>Business travel expenses</span>
            <span style={{ color:'#EF4444', fontVariantNumeric:'tabular-nums' }}>{fmtAUDExact(travelClaim.reduce((s,e)=>s+(e.aud||0),0))}</span>
          </div>
        </div>
      )}
      {!fyTxns.length && <div style={{ textAlign:'center', padding:'3rem', color:'rgba(160,140,120,0.22)', fontFamily:'"DM Mono", monospace', fontSize:'0.62rem', letterSpacing:'0.12em' }}>NO TRANSACTIONS FOR {fyLabel(fy)}</div>}
    </div>
  )
}

// ─── DATA VIEW ───────────────────────────────────────────────────────────────

function DataView({ data, onRestore }) {
  const [format, setFormat] = useState('json')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate]     = useState('')
  const fileRef = useRef()

  const doExport = () => {
    if (format === 'json') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})); a.download = `ledger-backup-${localDate()}.json`; a.click(); return }
    let txns = [...data.transactions]
    if (fromDate) txns = txns.filter(t => t.date >= fromDate)
    if (toDate)   txns = txns.filter(t => t.date <= toDate)
    if (format === 'csv-travel') {
      const rows = [['Trip','Date','Category','Description','Amount','Currency','AUD','Claimable','Notes']]
      data.travelExpenses.forEach(e => { const trip = data.trips.find(t=>t.id===e.tripId); rows.push([trip?.name||'',e.date,e.category,e.description,e.amount,e.currency,e.aud,e.claimable,e.notes||'']) })
      dlCSV(rows,'travel-expenses.csv'); return
    }
    const entity = format.replace('csv-','')
    const filtered = entity === 'all' ? txns : txns.filter(t => t.entity === entity)
    const rows = [['Date','Entity','Type','Category','Description','Amount AUD','GST','Notes']]
    filtered.sort((a,b)=>a.date.localeCompare(b.date)).forEach(t => rows.push([t.date,ENTITIES[t.entity]?.label||t.entity,t.type,t.category,t.description,t.amount,t.gst,t.notes||'']))
    dlCSV(rows, `${entity}-transactions.csv`)
  }

  const doImport = () => {
    const file = fileRef.current?.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const imp = JSON.parse(ev.target.result)
        const merged = { ...data }
        if (imp.transactions) { const ids = new Set(data.transactions.map(t=>t.id)); merged.transactions = [...data.transactions, ...imp.transactions.filter(t=>!ids.has(t.id))] }
        if (imp.trips)         { const ids = new Set(data.trips.map(t=>t.id));         merged.trips = [...data.trips, ...imp.trips.filter(t=>!ids.has(t.id))] }
        if (imp.travelExpenses){ const ids = new Set(data.travelExpenses.map(t=>t.id));merged.travelExpenses = [...data.travelExpenses, ...imp.travelExpenses.filter(t=>!ids.has(t.id))] }
        onRestore(merged)
      } catch { alert('Error reading file — check format') }
    }
    reader.readAsText(file)
  }

  return (
    <div style={{ paddingBottom: 60, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div style={{ ...S.surface, padding: 18 }}>
        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(160,140,120,0.4)', marginBottom: 14 }}>Export</div>
        <Field label="Format" style={{ marginBottom: 10 }}>
          <select style={S.input} value={format} onChange={e => setFormat(e.target.value)}>
            <option value="json">Full backup (JSON)</option>
            <option value="csv-all">All transactions (CSV)</option>
            <option value="csv-bp">Brighter Pathways (CSV)</option>
            <option value="csv-s9">Signal9 Studio (CSV)</option>
            <option value="csv-apps">Signal9 Apps (CSV)</option>
            <option value="csv-home">Household (CSV)</option>
            <option value="csv-travel">Travel (CSV)</option>
          </select>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <Field label="From"><input type="date" style={S.input} value={fromDate} onChange={e => setFromDate(e.target.value)} /></Field>
          <Field label="To"><input type="date" style={S.input} value={toDate} onChange={e => setToDate(e.target.value)} /></Field>
        </div>
        <button onClick={doExport} style={S.chip()}><Download size={12} />Download</button>
      </div>
      <div style={{ ...S.surface, padding: 18 }}>
        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(160,140,120,0.4)', marginBottom: 14 }}>Import</div>
        <Field label="JSON backup" style={{ marginBottom: 14 }}>
          <input type="file" ref={fileRef} accept=".json" style={{ ...S.input, cursor: 'pointer' }} />
        </Field>
        <button onClick={doImport} style={S.chip('#10B981')}><Upload size={12} />Import & Merge</button>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: 'rgba(160,140,120,0.35)', marginTop: 10, lineHeight: 1.5 }}>Merges with existing data. Export a backup first.</p>
      </div>
    </div>
  )
}

// ─── SETTINGS VIEW ───────────────────────────────────────────────────────────

function SettingsView({ data, onUpdate }) {
  const [usd, setUsd] = useState(data.rates.USD)
  const [jpy, setJpy] = useState(data.rates.JPY)
  const [catEntity, setCatEntity] = useState('bp')
  const [catName, setCatName] = useState('')

  const saveRates = () => onUpdate({ ...data, rates: { USD: parseFloat(usd)||1.52, JPY: parseFloat(jpy)||0.0098, updatedAt: new Date().toLocaleDateString('en-AU') } })

  const fetchRates = async () => {
    try {
      const d = await fetch('https://api.exchangerate-api.com/v4/latest/AUD').then(r=>r.json())
      const newU = parseFloat((1/d.rates.USD).toFixed(4)), newJ = parseFloat((1/d.rates.JPY).toFixed(6))
      setUsd(newU); setJpy(newJ)
      onUpdate({ ...data, rates: { USD: newU, JPY: newJ, updatedAt: new Date().toLocaleDateString('en-AU') } })
    } catch { alert('Could not fetch live rates') }
  }

  const addCat = () => {
    if (!catName.trim()) return
    const cats = JSON.parse(JSON.stringify(data.categories))
    const ec = cats[catEntity]
    if (!(ec.expense||[]).includes(catName) && !(ec.income||[]).includes(catName)) {
      if (ec.expense) ec.expense = [...ec.expense, catName.trim()]
      else if (ec.income) ec.income = [...ec.income, catName.trim()]
      onUpdate({ ...data, categories: cats }); setCatName('')
    }
  }

  const removeCat = (entity, name, type) => {
    const cats = JSON.parse(JSON.stringify(data.categories))
    if (cats[entity][type]) cats[entity][type] = cats[entity][type].filter(c => c !== name)
    onUpdate({ ...data, categories: cats })
  }

  const clearAll = () => {
    if (!confirm('Delete ALL ledger data permanently? Export a backup first.')) return
    if (!confirm('Are you sure? This cannot be undone.')) return
    onUpdate(initData())
  }

  const cats = data.categories[catEntity]

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={{ ...S.surface, padding: 16 }}>
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(160,140,120,0.4)', marginBottom: 14 }}>Exchange Rates → AUD</div>
          <Field label="USD → AUD" style={{ marginBottom: 10 }}><input type="number" step="0.001" style={S.input} value={usd} onChange={e=>setUsd(e.target.value)} /></Field>
          <Field label="JPY → AUD" style={{ marginBottom: 14 }}><input type="number" step="0.0001" style={S.input} value={jpy} onChange={e=>setJpy(e.target.value)} /></Field>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveRates} style={S.chip()}>Save</button>
            <button onClick={fetchRates} style={S.chip()}><RefreshCw size={11} />Fetch Live</button>
          </div>
          {data.rates.updatedAt && <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: 'rgba(160,140,120,0.35)', marginTop: 10 }}>Updated: {data.rates.updatedAt}</p>}
        </div>
        <div style={{ ...S.surface, padding: 16 }}>
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(160,140,120,0.4)', marginBottom: 14 }}>Custom Categories</div>
          <Field label="Entity" style={{ marginBottom: 10 }}>
            <select style={S.input} value={catEntity} onChange={e=>setCatEntity(e.target.value)}>
              <option value="bp">Brighter Pathways</option><option value="s9">Signal9 Studio</option>
              <option value="apps">Signal9 Apps</option><option value="home">Household</option><option value="travel">Travel</option>
            </select>
          </Field>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input style={{ ...S.input, flex: 1 }} value={catName} onChange={e=>setCatName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCat()} placeholder="New category…" />
            <button onClick={addCat} style={S.chip()}>Add</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxHeight: 120, overflowY: 'auto' }}>
            {['income','expense'].flatMap(type => (cats?.[type]||[]).map(c => (
              <span key={c+type} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 8px', background:'rgba(255,255,255,0.05)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:20, fontFamily:'"DM Mono", monospace', fontSize:'0.56rem', color:'rgba(200,185,165,0.6)' }}>
                {c}
                <button onClick={()=>removeCat(catEntity,c,type)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,77,106,0.4)', padding:'0 2px', fontSize:12, lineHeight:1 }}>×</button>
              </span>
            )))}
          </div>
        </div>
      </div>
      <div style={{ ...S.surface, padding: 16, border: '0.5px solid rgba(239,68,68,0.18)' }}>
        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#EF4444', marginBottom: 8 }}>Danger Zone</div>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: 'rgba(160,140,120,0.4)', marginBottom: 12 }}>Permanently delete all ledger data. Export a backup first.</p>
        <button onClick={clearAll} style={S.solid('#EF4444')}><Trash2 size={12} />Clear All Data</button>
      </div>
    </div>
  )
}

// ─── MAIN LEDGER ─────────────────────────────────────────────────────────────

const ENTITY_KEYS = ['bp','s9','apps','home']

const VIEW_META = {
  hub:      { title: 'Ledger',          accent: '#C4522A' },
  bp:       { title: 'Brighter Pathways', accent: '#8B5CF6' },
  s9:       { title: 'Signal9 Studio',   accent: '#3B82F6' },
  apps:     { title: 'Signal9 Apps',     accent: '#10B981' },
  home:     { title: 'Household',        accent: '#94A3B8' },
  travel:   { title: 'Travel',           accent: '#F59E0B' },
  reports:  { title: 'Reports',          accent: '#C4522A' },
  tax:      { title: 'Tax Summary',      accent: '#C4522A' },
  data:     { title: 'Import / Export',  accent: '#C4522A' },
  settings: { title: 'Settings',         accent: '#C4522A' },
}

export default function Ledger() {
  const navigate = useNavigate()
  const [data, setData]           = useState(() => loadLedger())
  const [view, setView]           = useState('hub')
  const [txnModal, setTxnModal]   = useState(null)
  const [tripModal, setTripModal] = useState(false)
  const [travelModal, setTravelModal] = useState(null)
  const [confirm, setConfirm]     = useState(null)

  const update = useCallback((next) => { setData(next); saveLedger(next) }, [])

  const saveTxn = (tx) => {
    const txns = data.transactions.find(t => t.id === tx.id)
      ? data.transactions.map(t => t.id === tx.id ? tx : t)
      : [...data.transactions, tx]
    update({ ...data, transactions: txns })
    // Mirror to fuel tracker if this is a Household fuel expense
    if (tx.entity === 'home' && tx.category === 'Fuel' && tx.type === 'expense' && !tx._source) {
      addFuelEntry({ date: tx.date, cost: tx.amount, notes: tx.description || tx.notes || '' })
    }
    setTxnModal(null)
  }
  const deleteTxn = (id) => setConfirm({ message: 'Delete this transaction?', onConfirm: () => { update({ ...data, transactions: data.transactions.filter(t => t.id !== id) }); setConfirm(null) } })
  const saveTrip = (trip) => { update({ ...data, trips: [...data.trips, trip] }); setTripModal(false) }
  const deleteTrip = (id) => setConfirm({ message: 'Delete trip and all its expenses?', onConfirm: () => { update({ ...data, trips: data.trips.filter(t=>t.id!==id), travelExpenses: data.travelExpenses.filter(e=>e.tripId!==id) }); setConfirm(null) } })
  const saveTravelExp = (ex) => {
    const exps = data.travelExpenses.find(e => e.id === ex.id) ? data.travelExpenses.map(e => e.id === ex.id ? ex : e) : [...data.travelExpenses, ex]
    update({ ...data, travelExpenses: exps }); setTravelModal(null)
  }
  const deleteTravelExp = (id) => setConfirm({ message: 'Delete this expense?', onConfirm: () => { update({ ...data, travelExpenses: data.travelExpenses.filter(e=>e.id!==id) }); setConfirm(null) } })

  const meta = VIEW_META[view] || VIEW_META.hub
  const isHub = view === 'hub'

  // Background image: hub uses architectural, entity views use their own
  const viewBg = isHub ? bgHub : (ENTITIES[view]?.bg || bgHub)

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#080706', overflowY: 'auto', fontFamily: '"DM Mono", monospace', color: '#EDE8E0' }}>

      {/* Background art */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: `url(${viewBg})`, backgroundSize: 'cover', backgroundPosition: 'center top', opacity: isHub ? 0.12 : 0.18, pointerEvents: 'none', zIndex: 0, transition: 'opacity 0.4s' }} />
      {/* Dark overlay so text remains readable */}
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(to bottom, rgba(8,7,6,0.55) 0%, rgba(8,7,6,0.82) 40%, rgba(8,7,6,0.97) 100%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── HEADER — padded for iPhone notch / status bar ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(8,7,6,0.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `0.5px solid ${isHub ? 'rgba(196,82,42,0.2)' : meta.accent + '30'}` }}>
        {/* Safe-area top spacer for iPhone notch */}
        <div style={{ height: 'env(safe-area-inset-top, 0px)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
          <button
            onClick={() => isHub ? navigate('/dashboard') : setView('hub')}
            style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, cursor: 'pointer', color: 'rgba(200,180,160,0.8)', padding: '8px 10px', display: 'flex', alignItems: 'center', flexShrink: 0, minWidth: 44, minHeight: 44, justifyContent: 'center' }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            {!isHub && <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.4rem', letterSpacing: '0.22em', color: 'rgba(160,140,120,0.4)', textTransform: 'uppercase', marginBottom: 1 }}>Ledger</div>}
            <div style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: '1.05rem', color: isHub ? '#EDE8E0' : meta.accent, textShadow: isHub ? 'none' : `0 0 20px ${meta.accent}50`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {meta.title}
            </div>
          </div>
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.4rem', letterSpacing: '0.12em', color: 'rgba(160,140,120,0.3)', textTransform: 'uppercase', flexShrink: 0 }}>{fyLabel(currentFY())}</div>
          {ENTITY_KEYS.includes(view) && (
            <button onClick={() => setTxnModal({ entity: view })} style={{ ...S.chip(meta.accent), padding: '8px 14px', flexShrink: 0, minHeight: 40 }}>
              <Plus size={13} />ADD
            </button>
          )}
          {view === 'travel' && (
            <button onClick={() => setTripModal(true)} style={{ ...S.chip('#F59E0B'), padding: '8px 14px', flexShrink: 0, minHeight: 40 }}>
              <Plus size={13} />TRIP
            </button>
          )}
        </div>
      </div>

      {/* ── CONTENT ── */}
      {/* Convergence entrance: four quadrant layers slide inward from each corner */}
      <div key={view} style={{ position: 'relative', zIndex: 1 }}>
        {[
          { anim: 'converge-top-left',     clip: 'polygon(0 0, 50% 0, 50% 50%, 0 50%)' },
          { anim: 'converge-top-right',    clip: 'polygon(50% 0, 100% 0, 100% 50%, 50% 50%)' },
          { anim: 'converge-bottom-left',  clip: 'polygon(0 50%, 50% 50%, 50% 100%, 0 100%)' },
          { anim: 'converge-bottom-right', clip: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)' },
        ].map(({ anim, clip }, i) => (
          <div key={anim} style={{
            position: i === 0 ? 'relative' : 'absolute',
            inset: 0,
            animation: `${anim} 0.65s cubic-bezier(0.22,1,0.36,1) both`,
            clipPath: clip,
            WebkitClipPath: clip,
          }}>
            <div style={{ padding: isHub ? 0 : 16, maxWidth: 860, margin: '0 auto' }}>
              {isHub && <HubView data={data} onNavigate={setView} />}
              {ENTITY_KEYS.includes(view) && (
                <EntityView entity={view} data={data}
                  onAdd={(tx, entity) => setTxnModal({ edit: tx, entity: entity || view })}
                  onDelete={deleteTxn} />
              )}
              {view === 'travel' && (
                <TravelView data={data}
                  onAddTrip={() => setTripModal(true)}
                  onDeleteTrip={deleteTrip}
                  onAddExpense={(tid) => setTravelModal({ tripId: tid })}
                  onDeleteExpense={deleteTravelExp} />
              )}
              {view === 'reports'  && <ReportsView  data={data} />}
              {view === 'tax'      && <TaxView      data={data} />}
              {view === 'data'     && <DataView     data={data} onRestore={update} />}
              {view === 'settings' && <SettingsView data={data} onUpdate={update} />}
            </div>
          </div>
        ))}
      </div>

      {/* ── MODALS ── */}
      {txnModal && (
        <TxnModal
          editData={txnModal.edit || null}
          categories={data.categories}
          defaultEntity={txnModal.entity || (ENTITY_KEYS.includes(view) ? view : 'bp')}
          onSave={saveTxn}
          onClose={() => setTxnModal(null)}
        />
      )}
      {tripModal && <TripModal onSave={saveTrip} onClose={() => setTripModal(false)} />}
      {travelModal !== null && (
        <TravelExpModal
          trips={data.trips}
          rates={data.rates}
          categories={data.categories}
          defaultTripId={travelModal?.tripId || null}
          editData={travelModal?.edit || null}
          onSave={saveTravelExp}
          onClose={() => setTravelModal(null)}
        />
      )}
      {confirm && <Confirm message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  )
}
