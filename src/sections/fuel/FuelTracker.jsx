import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus } from 'lucide-react'

// ── Storage ───────────────────────────────────────────────────────────────────

const FUEL_KEY = 'agenda-fuel-v1'
function load(key, fb) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb } catch { return fb } }
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }
function todayStr() { return new Date().toISOString().slice(0, 10) }

// ── Constants ─────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = {
  business: { label: 'Business Card', short: 'Business', color: '#60B8F0', bg: '#60B8F018', icon: '💳' },
  living:   { label: 'Living Card',   short: 'Living',   color: '#6DBF6D', bg: '#6DBF6D18', icon: '💚' },
  cash:     { label: 'Cash',          short: 'Cash',     color: '#F0D060', bg: '#F0D06018', icon: '💵' },
}

// ── FY helpers (Australian Jul–Jun) ──────────────────────────────────────────

function getCurrentFY() { const m = new Date().getMonth(), y = new Date().getFullYear(); return m >= 6 ? { start: y, end: y + 1 } : { start: y - 1, end: y } }
function fyLabel(fy) { return `FY ${fy.start}–${String(fy.end).slice(2)}` }
function inFY(dateStr, fy) { const d = new Date(dateStr); return d >= new Date(fy.start, 6, 1) && d <= new Date(fy.end, 5, 30, 23, 59, 59) }

function fuelTotals(entries) {
  const t = { total: 0, litres: 0, business: 0, living: 0, cash: 0, count: entries.length }
  entries.forEach(e => {
    t.total += e.cost || 0; t.litres += e.litres || 0
    if (e.paymentMethod === 'business') t.business += e.cost || 0
    else if (e.paymentMethod === 'living') t.living += e.cost || 0
    else if (e.paymentMethod === 'cash') t.cash += e.cost || 0
  })
  return t
}
function fmt$(n) { return n.toFixed(2) }
function fmtL(n) { return n > 0 ? `${n.toFixed(1)} L` : '' }

function groupFuelByMonth(entries) {
  const g = {}
  entries.forEach(e => {
    const d = new Date(e.date), key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!g[key]) g[key] = { key, label: d.toLocaleDateString([], { month: 'long', year: 'numeric' }), month: d.toLocaleDateString([], { month: 'short' }), entries: [] }
    g[key].entries.push(e)
  })
  return Object.values(g).sort((a, b) => b.key.localeCompare(a.key))
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  overlay:        { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  modal:          { background: '#1C1C1C', borderRadius: '28px 28px 0 0', padding: '26px 20px', paddingBottom: 'max(36px,calc(24px + env(safe-area-inset-bottom)))', width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 },
  modalHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle:     { fontSize: 20, fontWeight: 800, color: '#F5F0E8' },
  closeBtn:       { background: '#2A2A2A', border: 'none', color: '#888', fontSize: 20, cursor: 'pointer', padding: '10px 16px', borderRadius: 10, lineHeight: 1 },
  label:          { fontSize: 13, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6, marginTop: 16, display: 'block' },
  input:          { background: '#222', border: '2px solid #2E2E2E', borderRadius: 14, color: '#F5F0E8', padding: '16px 18px', fontSize: 18, fontWeight: 600, width: '100%', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' },
  saveBtn:        { background: '#F0D060', border: 'none', borderRadius: 16, color: '#141414', padding: 19, fontSize: 19, fontWeight: 800, cursor: 'pointer', marginTop: 20, letterSpacing: .5, width: '100%' },
  payMethodBtn:   { background: '#222', border: '2px solid #2E2E2E', color: '#888', borderRadius: 14, padding: '17px 18px', fontSize: 17, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', boxSizing: 'border-box' },
  fuelSummaryCard:{ background: '#1C1C1C', borderRadius: 16, padding: '20px 18px' },
  fyNavBtn:       { background: '#242424', border: 'none', color: '#888', fontSize: 28, width: 50, height: 50, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  monthHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 4px 10px', cursor: 'pointer' },
  fuelEntry:      { background: '#1C1C1C', borderRadius: 14, padding: '16px 0', display: 'flex', overflow: 'hidden', cursor: 'pointer' },
  fuelEntryStripe:{ width: 5, borderRadius: '14px 0 0 14px', flexShrink: 0, marginRight: 16 },
  empty:          { color: '#444', textAlign: 'center', marginTop: 60, fontSize: 17, lineHeight: 2, whiteSpace: 'pre-line', fontWeight: 500 },
  hint:           { textAlign: 'center', color: '#444', fontSize: 13, marginTop: 6, fontStyle: 'italic' },
}

// ── SwipeCard ─────────────────────────────────────────────────────────────────

function SwipeCard({ onSwipeRight, onSwipeLeft, rightIcon = '✓', rightColor = '#6DBF6D', children }) {
  const wrapRef = useRef(null), innerRef = useRef(null), THRESH = 72
  useEffect(() => {
    const wrap = wrapRef.current, inner = innerRef.current; if (!wrap || !inner) return
    let sx = 0, sy = 0, drag = false, cur = 0
    const hr = () => wrap.querySelector('.sh-r'), hl = () => wrap.querySelector('.sh-l')
    function snap(to, cb) { inner.style.transition = 'transform .22s ease'; inner.style.transform = `translateX(${to}px)`; const _r = hr(), _l = hl(); if (_r) _r.style.opacity = '0'; if (_l) _l.style.opacity = '0'; setTimeout(() => { inner.style.transition = 'none'; inner.style.transform = 'translateX(0)'; if (cb) cb() }, 230) }
    function ts(e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; drag = false; cur = 0; inner.style.transition = 'none' }
    function tm(e) { const dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy; if (!drag) { if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) drag = true; else if (Math.abs(dy) > 8) return; else return } e.preventDefault(); cur = Math.max(-115, Math.min(115, dx)); inner.style.transform = `translateX(${cur}px)`; const _r = hr(), _l = hl(); if (_r) _r.style.opacity = cur > 0 ? String(Math.min(1, cur / THRESH)) : '0'; if (_l) _l.style.opacity = cur < 0 ? String(Math.min(1, -cur / THRESH)) : '0' }
    function te() { if (!drag) return; drag = false; if (cur > THRESH) snap(160, onSwipeRight); else if (cur < -THRESH) snap(-160, onSwipeLeft); else snap(0) }
    wrap.addEventListener('touchstart', ts, { passive: true }); wrap.addEventListener('touchmove', tm, { passive: false }); wrap.addEventListener('touchend', te, { passive: true })
    return () => { wrap.removeEventListener('touchstart', ts); wrap.removeEventListener('touchmove', tm); wrap.removeEventListener('touchend', te) }
  }, [onSwipeRight, onSwipeLeft])
  return (
    <div ref={wrapRef} style={{ position: 'relative', borderRadius: 14, overflow: 'hidden' }}>
      <div className="sh-r" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 22px', background: rightColor + '2A', opacity: 0 }}><span style={{ fontSize: 26, fontWeight: 800 }}>{rightIcon}</span></div>
      <div className="sh-l" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 22px', background: '#FF5C5C2A', opacity: 0 }}><span style={{ fontSize: 22 }}>🗑</span></div>
      <div ref={innerRef} style={{ position: 'relative', willChange: 'transform' }}>{children}</div>
    </div>
  )
}

// ── FuelEntry ─────────────────────────────────────────────────────────────────

function FuelEntry({ entry, onEdit }) {
  const pm = PAYMENT_METHODS[entry.paymentMethod] || PAYMENT_METHODS.cash
  const d = new Date(entry.date)
  const dateStr = d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
  return (
    <div style={S.fuelEntry} onClick={onEdit}>
      <div style={{ ...S.fuelEntryStripe, background: pm.color }} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, paddingRight: 14, minWidth: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 21, fontWeight: 800, color: '#F5F0E8' }}>${fmt$(entry.cost)}</span>
            {entry.litres > 0 && <span style={{ fontSize: 14, color: '#888', fontWeight: 600 }}>{fmtL(entry.litres)}</span>}
            {entry.litres > 0 && entry.cost > 0 && <span style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>${(entry.cost / entry.litres).toFixed(3)}/L</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>{dateStr}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: pm.color, background: pm.bg, borderRadius: 5, padding: '2px 8px' }}>{pm.icon} {pm.short}</span>
            {entry.notes && <span style={{ fontSize: 13, color: '#555', fontStyle: 'italic', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 140 }}>{entry.notes}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── FuelChart ─────────────────────────────────────────────────────────────────

function FuelChart({ months }) {
  const totals = months.map(m => ({ label: m.month, total: fuelTotals(m.entries).total }))
  const max = Math.max(...totals.map(t => t.total), 1)
  const W = 360, H = 110, PAD_L = 4, PAD_R = 4, PAD_TOP = 8, BAR_GAP = 6
  const count = totals.length
  const barW = (W - PAD_L - PAD_R - (count - 1) * BAR_GAP) / count
  return (
    <div style={{ background: '#1C1C1C', borderRadius: 14, padding: '16px 16px 12px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Monthly Spend</div>
      <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: '100%', overflow: 'visible' }}>
        {totals.map((t, i) => {
          const x = PAD_L + i * (barW + BAR_GAP)
          const barH = t.total > 0 ? Math.max(4, ((t.total / max) * (H - PAD_TOP))) : 0
          const y = H - barH
          const isLast = i === totals.length - 1
          return (
            <g key={t.label}>
              <rect x={x} y={y} width={barW} height={barH} rx={4} fill={isLast ? '#F0D060' : '#3A3A3A'} />
              {t.total > 0 && <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill={isLast ? '#F0D060' : '#777'} fontSize="10" fontWeight="700" fontFamily="Outfit,sans-serif">${Math.round(t.total)}</text>}
              <text x={x + barW / 2} y={H + 16} textAnchor="middle" fill="#555" fontSize="11" fontWeight="600" fontFamily="Outfit,sans-serif">{t.label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── MonthGroup ────────────────────────────────────────────────────────────────

function MonthGroup({ group, onEdit, onDelete }) {
  const [open, setOpen] = useState(true)
  const totals = fuelTotals(group.entries)
  const sorted = [...group.entries].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <div>
      <div style={S.monthHeader} onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#F5F0E8' }}>{group.label}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#666' }}>{totals.count} fill-up{totals.count !== 1 ? 's' : ''}</span>
          {totals.litres > 0 && <span style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>{fmtL(totals.litres)}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#F0D060' }}>${fmt$(totals.total)}</span>
          <span style={{ color: '#444', fontSize: 14 }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && totals.total > 0 && (
        <div style={{ display: 'flex', gap: 7, paddingBottom: 10, flexWrap: 'wrap' }}>
          {['business', 'living', 'cash'].filter(k => totals[k] > 0).map(k => {
            const pm = PAYMENT_METHODS[k]
            return <span key={k} style={{ fontSize: 13, fontWeight: 700, color: pm.color, background: pm.bg, borderRadius: 6, padding: '4px 10px' }}>{pm.icon} ${fmt$(totals[k])}</span>
          })}
        </div>
      )}
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 6 }}>
          {sorted.map(entry => (
            <SwipeCard key={entry.id} onSwipeRight={() => onEdit(entry)} onSwipeLeft={() => onDelete(entry.id)} rightIcon="✏" rightColor="#888">
              <FuelEntry entry={entry} onEdit={() => onEdit(entry)} />
            </SwipeCard>
          ))}
        </div>
      )}
    </div>
  )
}

// ── FuelForm ──────────────────────────────────────────────────────────────────

function FuelForm({ initial, onSave, onClose }) {
  const [date, setDate] = useState(initial?.date || todayStr())
  const [cost, setCost] = useState(initial?.cost != null ? String(initial.cost) : '')
  const [litres, setLitres] = useState(initial?.litres > 0 ? String(initial.litres) : '')
  const [paymentMethod, setPaymentMethod] = useState(initial?.paymentMethod || 'business')
  const [notes, setNotes] = useState(initial?.notes || '')

  function handleSave() {
    const c = parseFloat(cost)
    if (isNaN(c) || c <= 0) return
    onSave({ date, cost: Math.round(c * 100) / 100, litres: litres ? Math.round(parseFloat(litres) * 10) / 10 : 0, paymentMethod, notes: notes.trim() })
  }
  const cph = litres && cost && parseFloat(litres) > 0 ? `$${(parseFloat(cost) / parseFloat(litres)).toFixed(3)}/L` : ''

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <span style={S.modalTitle}>{initial ? 'Edit Fill-up' : 'Record Fill-up'}</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <label style={S.label}>Date</label>
        <input style={S.input} type="date" value={date} onChange={e => setDate(e.target.value)} />
        <label style={S.label}>Total cost ($)</label>
        <input style={{ ...S.input, fontSize: 22, fontWeight: 800, color: '#F0D060' }} type="number" inputMode="decimal" placeholder="0.00" step="0.01" min="0" value={cost} onChange={e => setCost(e.target.value)} />
        <label style={S.label}>Litres (optional)</label>
        <div style={{ position: 'relative' }}>
          <input style={S.input} type="number" inputMode="decimal" placeholder="0.0" step="0.1" min="0" value={litres} onChange={e => setLitres(e.target.value)} />
          {cph && <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#888', fontWeight: 700, pointerEvents: 'none' }}>{cph}</span>}
        </div>
        <label style={S.label}>Paid with</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(PAYMENT_METHODS).map(([k, pm]) => (
            <button key={k} style={{ ...S.payMethodBtn, ...(paymentMethod === k ? { background: pm.bg, borderColor: pm.color, color: pm.color } : {}) }} onClick={() => setPaymentMethod(k)}>
              <span style={{ fontSize: 20 }}>{pm.icon}</span>
              <span style={{ fontWeight: 700 }}>{pm.label}</span>
              {paymentMethod === k && <span style={{ marginLeft: 'auto', fontWeight: 800 }}>✓</span>}
            </button>
          ))}
        </div>
        <label style={S.label}>Notes (optional)</label>
        <input style={S.input} placeholder="e.g. Shell Launceston…" value={notes} onChange={e => setNotes(e.target.value)} />
        <button style={S.saveBtn} onClick={handleSave}>{initial ? 'Save Changes' : 'Save Fill-up'}</button>
      </div>
    </div>
  )
}

// ── FuelView ──────────────────────────────────────────────────────────────────

function FuelView({ entries, onEdit, onDelete }) {
  const [viewFY, setViewFY] = useState(() => getCurrentFY())
  const curFY = getCurrentFY()
  const fyEntries = entries.filter(e => inFY(e.date, viewFY))
  const fyTotals = fuelTotals(fyEntries)
  const months = groupFuelByMonth(fyEntries)
  function shiftFY(dir) { setViewFY(fy => ({ start: fy.start + dir, end: fy.end + dir })) }

  if (entries.length === 0) return <div style={S.empty}>{'No fuel entries yet.\nTap + to record your first fill-up.'}</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* FY summary */}
      <div style={S.fuelSummaryCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button style={S.fyNavBtn} onClick={() => shiftFY(-1)}>‹</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#666', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>Financial Year</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#F5F0E8' }}>{fyLabel(viewFY)}</div>
          </div>
          <button style={{ ...S.fyNavBtn, opacity: viewFY.start >= curFY.start ? .35 : 1 }} onClick={() => { if (viewFY.start < curFY.start) shiftFY(1) }}>›</button>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 16, borderBottom: '1px solid #2A2A2A', paddingBottom: 16 }}>
          <div style={{ fontSize: 38, fontWeight: 800, color: '#F0D060', letterSpacing: -1 }}>${fmt$(fyTotals.total)}</div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 4, fontWeight: 600 }}>
            {fyTotals.count} fill-up{fyTotals.count !== 1 ? 's' : ''}{fyTotals.litres > 0 ? ` · ${fmtL(fyTotals.litres)}` : ''}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[{ k: 'business', v: fyTotals.business }, { k: 'living', v: fyTotals.living }, { k: 'cash', v: fyTotals.cash }].map(({ k, v }) => {
            const pm = PAYMENT_METHODS[k]
            return (
              <div key={k} style={{ background: '#1A1A1A', borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: `1px solid ${pm.color}22` }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{pm.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: pm.color }}>${fmt$(v)}</div>
                <div style={{ fontSize: 10, color: '#555', fontWeight: 700, marginTop: 2, textTransform: 'uppercase', letterSpacing: .5 }}>{pm.short}</div>
              </div>
            )
          })}
        </div>
      </div>

      {months.length > 1 && <FuelChart months={months.slice(0, 6).reverse()} />}

      {months.length === 0
        ? <div style={{ color: '#444', textAlign: 'center', fontSize: 15, padding: '20px 0' }}>No entries for {fyLabel(viewFY)}</div>
        : months.map(group => <MonthGroup key={group.key} group={group} onEdit={onEdit} onDelete={onDelete} />)
      }
      <p style={S.hint}>Swipe left on an entry to delete · swipe right to edit</p>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function FuelTracker() {
  const navigate = useNavigate()
  const [fuel, setFuel] = useState(() => load(FUEL_KEY, []))
  const [showForm, setShowForm] = useState(false)
  const [editFuel, setEditFuel] = useState(null)

  useEffect(() => { save(FUEL_KEY, fuel) }, [fuel])

  function saveFuel(data) {
    if (editFuel) {
      setFuel(prev => [...prev.filter(e => e.id !== editFuel.id), { ...editFuel, ...data }].sort((a, b) => b.date.localeCompare(a.date)))
    } else {
      setFuel(prev => [{ ...data, id: Date.now().toString(), createdAt: new Date().toISOString() }, ...prev].sort((a, b) => b.date.localeCompare(a.date)))
    }
    setShowForm(false); setEditFuel(null)
  }

  function deleteFuel(id) { setFuel(prev => prev.filter(x => x.id !== id)) }

  return (
    <div style={{ minHeight: '100vh', background: '#141414', color: '#F5F0E8', fontFamily: "'Outfit','Helvetica Neue',Arial,sans-serif" }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
        paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
        paddingBottom: 12,
        background: 'rgba(20,20,20,0.95)',
        borderBottom: '1px solid #222',
        position: 'sticky', top: 0, zIndex: 10,
        backdropFilter: 'blur(12px)',
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#F0D060', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 15, fontWeight: 700, padding: '8px 0', fontFamily: 'inherit' }}>
          <ChevronLeft size={20} strokeWidth={2.5} /> Back
        </button>
        <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: .5 }}>⛽ Fuel Tracker</span>
        <button
          onClick={() => { setEditFuel(null); setShowForm(true) }}
          style={{ background: '#F0D06020', border: '2px solid #F0D060', color: '#F0D060', borderRadius: 12, width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 16px calc(env(safe-area-inset-bottom) + 24px)', maxWidth: 600, margin: '0 auto' }}>
        <FuelView
          entries={fuel}
          onEdit={e => { setEditFuel(e); setShowForm(true) }}
          onDelete={deleteFuel}
        />
      </div>

      {showForm && (
        <FuelForm
          initial={editFuel}
          onSave={saveFuel}
          onClose={() => { setShowForm(false); setEditFuel(null) }}
        />
      )}
    </div>
  )
}
