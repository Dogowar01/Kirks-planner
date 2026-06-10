import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, Download, Upload, Fuel, Zap, TrendingDown, TrendingUp } from 'lucide-react'
import BottomNav from '../../components/BottomNav'
import HoloRings from '../../components/HoloRings'

// ── Storage ───────────────────────────────────────────────────────────────────

const FUEL_KEY = 'agenda-fuel-v1'
function load(key, fb) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb } catch { return fb } }
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }
function todayStr() { return new Date().toISOString().slice(0, 10) }

// ── Constants ─────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = {
  business: { label: 'Business Card', short: 'Biz',     color: '#00C8FF', bg: 'rgba(0,200,255,0.08)',  icon: '💳' },
  living:   { label: 'Living Card',   short: 'Living',  color: '#00FF9D', bg: 'rgba(0,255,157,0.08)', icon: '💚' },
  cash:     { label: 'Cash',          short: 'Cash',    color: '#FFB700', bg: 'rgba(255,183,0,0.08)',  icon: '💵' },
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
function fmtL(n) { return n > 0 ? `${n.toFixed(1)}L` : '' }

function groupFuelByMonth(entries) {
  const g = {}
  entries.forEach(e => {
    const d = new Date(e.date), key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!g[key]) g[key] = { key, label: d.toLocaleDateString([], { month: 'long', year: 'numeric' }), month: d.toLocaleDateString([], { month: 'short' }).toUpperCase(), entries: [] }
    g[key].entries.push(e)
  })
  return Object.values(g).sort((a, b) => b.key.localeCompare(a.key))
}

// ── SwipeCard (preserved) ────────────────────────────────────────────────────

function SwipeCard({ onSwipeRight, onSwipeLeft, rightIcon = '✓', rightColor = '#00FF9D', children }) {
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
    <div ref={wrapRef} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
      <div className="sh-r" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 22px', background: 'rgba(0,255,157,0.1)', opacity: 0 }}><span style={{ fontSize: 22, fontWeight: 800, color: '#00FF9D' }}>✏</span></div>
      <div className="sh-l" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 22px', background: 'rgba(255,77,106,0.1)', opacity: 0 }}><span style={{ fontSize: 20, color: '#FF4D6A' }}>✕</span></div>
      <div ref={innerRef} style={{ position: 'relative', willChange: 'transform' }}>{children}</div>
    </div>
  )
}

// ── FuelEntry ─────────────────────────────────────────────────────────────────

function FuelEntry({ entry, onEdit }) {
  const pm = PAYMENT_METHODS[entry.paymentMethod] || PAYMENT_METHODS.cash
  const d = new Date(entry.date)
  const dayStr = d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()
  const pplL = entry.litres > 0 && entry.cost > 0 ? (entry.cost / entry.litres).toFixed(3) : null

  return (
    <div onClick={onEdit} style={{
      display: 'flex', alignItems: 'stretch',
      background: 'rgba(13,12,11,0.9)',
      border: `0.5px solid ${pm.color}22`,
      borderRadius: 8,
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'border-color 0.15s',
      position: 'relative',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = `${pm.color}55`}
    onMouseLeave={e => e.currentTarget.style.borderColor = `${pm.color}22`}>
      {/* Left accent bar */}
      <div style={{ width: 3, background: `linear-gradient(to bottom, ${pm.color}, ${pm.color}44)`, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Cost + litres */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
            <span style={{
              fontFamily: '"DM Mono", monospace', fontWeight: 700,
              fontSize: '1.3rem', color: '#FFB700',
              textShadow: '0 0 16px rgba(255,183,0,0.5)',
              letterSpacing: '-0.02em',
            }}>${fmt$(entry.cost)}</span>
            {entry.litres > 0 && (
              <span style={{ fontFamily: '"DM Mono"', fontSize: '0.7rem', color: '#7A7268' }}>{fmtL(entry.litres)}</span>
            )}
            {pplL && (
              <span style={{ fontFamily: '"DM Mono"', fontSize: '0.6rem', color: `${pm.color}88`, letterSpacing: '0.04em' }}>${pplL}/L</span>
            )}
          </div>
          {/* Date + payment */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: '"DM Mono"', fontSize: '0.5rem', color: '#5A5450', letterSpacing: '0.12em' }}>{dayStr}</span>
            <span style={{
              fontFamily: '"DM Mono"', fontSize: '0.48rem', letterSpacing: '0.1em',
              color: pm.color, background: pm.bg,
              border: `0.5px solid ${pm.color}30`,
              borderRadius: 3, padding: '1px 6px',
              textShadow: `0 0 6px ${pm.color}60`,
            }}>{pm.short.toUpperCase()}</span>
            {entry.notes && (
              <span style={{ fontFamily: '"DM Mono"', fontSize: '0.48rem', color: '#4A4440', fontStyle: 'italic', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 120 }}>{entry.notes}</span>
            )}
          </div>
        </div>
        {/* Trend icon */}
        <div style={{ opacity: 0.25 }}>
          <Fuel size={16} color={pm.color} strokeWidth={1} />
        </div>
      </div>
    </div>
  )
}

// ── FuelChart ─────────────────────────────────────────────────────────────────

function FuelChart({ months }) {
  const totals = months.map(m => ({ label: m.month, total: fuelTotals(m.entries).total }))
  const max = Math.max(...totals.map(t => t.total), 1)
  const W = 360, H = 90, PAD = 4, GAP = 5
  const count = totals.length
  const barW = (W - PAD * 2 - (count - 1) * GAP) / count

  return (
    <div style={{
      background: 'rgba(10,9,8,0.8)',
      border: '0.5px solid rgba(255,183,0,0.15)',
      borderRadius: 8, padding: '14px 14px 10px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <div style={{ width: 6, height: 1, background: '#FFB700', opacity: 0.7 }} />
        <span style={{ fontFamily: '"DM Mono"', fontSize: '0.48rem', color: 'rgba(255,183,0,0.6)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>[ MONTHLY SPEND ]</span>
        <div style={{ flex: 1, height: 0.5, background: 'linear-gradient(to right, rgba(255,183,0,0.3), transparent)' }} />
      </div>
      <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: '100%', overflow: 'visible' }}>
        {/* Subtle grid lines */}
        {[0.25, 0.5, 0.75].map((frac, i) => (
          <line key={i} x1={PAD} y1={H - frac * H} x2={W - PAD} y2={H - frac * H} stroke="rgba(255,183,0,0.06)" strokeWidth="0.5" />
        ))}
        {totals.map((t, i) => {
          const x = PAD + i * (barW + GAP)
          const barH = t.total > 0 ? Math.max(3, (t.total / max) * H) : 0
          const y = H - barH
          const isLast = i === totals.length - 1
          return (
            <g key={t.label}>
              {/* Bar glow */}
              {t.total > 0 && (
                <rect x={x - 2} y={y - 2} width={barW + 4} height={barH + 4} rx={3}
                  fill={isLast ? 'rgba(255,183,0,0.08)' : 'rgba(255,183,0,0.03)'} />
              )}
              {/* Bar */}
              <rect x={x} y={y} width={barW} height={barH} rx={2}
                fill={isLast ? '#FFB700' : 'rgba(255,183,0,0.3)'}
                style={isLast ? { filter: 'drop-shadow(0 0 4px rgba(255,183,0,0.8))' } : {}} />
              {/* Value label */}
              {t.total > 0 && (
                <text x={x + barW / 2} y={y - 5} textAnchor="middle"
                  fill={isLast ? '#FFB700' : 'rgba(255,183,0,0.5)'}
                  fontSize="9" fontFamily='"DM Mono", monospace' fontWeight="700">
                  ${Math.round(t.total)}
                </text>
              )}
              {/* Month label */}
              <text x={x + barW / 2} y={H + 14} textAnchor="middle"
                fill={isLast ? 'rgba(255,183,0,0.7)' : 'rgba(120,110,100,0.7)'}
                fontSize="9" fontFamily='"DM Mono", monospace' fontWeight="600">
                {t.label}
              </text>
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
      {/* Month header */}
      <div onClick={() => setOpen(o => !o)} style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 4px 10px', cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 1, height: 14, background: 'rgba(255,183,0,0.4)' }} />
          <span style={{ fontFamily: '"DM Mono"', fontSize: '0.62rem', color: '#A09890', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            {group.label}
          </span>
          <span style={{ fontFamily: '"DM Mono"', fontSize: '0.48rem', color: '#4A4440', letterSpacing: '0.1em' }}>
            {totals.count} FILL-UP{totals.count !== 1 ? 'S' : ''}
            {totals.litres > 0 ? ` · ${fmtL(totals.litres)}` : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: '"DM Mono"', fontWeight: 700, fontSize: '0.95rem',
            color: '#FFB700', textShadow: '0 0 12px rgba(255,183,0,0.4)',
          }}>
            ${fmt$(totals.total)}
          </span>
          <span style={{ fontFamily: '"DM Mono"', fontSize: '0.5rem', color: '#3A3530', letterSpacing: '0.1em' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Payment split pills */}
      {open && totals.total > 0 && (
        <div style={{ display: 'flex', gap: 6, paddingBottom: 10, flexWrap: 'wrap' }}>
          {['business', 'living', 'cash'].filter(k => totals[k] > 0).map(k => {
            const pm = PAYMENT_METHODS[k]
            return (
              <span key={k} style={{
                fontFamily: '"DM Mono"', fontSize: '0.48rem', letterSpacing: '0.08em',
                color: pm.color, background: pm.bg,
                border: `0.5px solid ${pm.color}30`, borderRadius: 3,
                padding: '2px 8px',
                textShadow: `0 0 8px ${pm.color}60`,
              }}>
                {pm.short.toUpperCase()} ${fmt$(totals[k])}
              </span>
            )
          })}
        </div>
      )}

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 6 }}>
          {sorted.map(entry => (
            <SwipeCard key={entry.id} onSwipeRight={() => onEdit(entry)} onSwipeLeft={() => onDelete(entry.id)} rightIcon="✏" rightColor="#00FF9D">
              <FuelEntry entry={entry} onEdit={() => onEdit(entry)} />
            </SwipeCard>
          ))}
        </div>
      )}
    </div>
  )
}

// ── FuelGaugeBar ─────────────────────────────────────────────────────────────

function FuelGaugeBar({ pct, color = '#FFB700' }) {
  return (
    <div style={{ position: 'relative', height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 8 }}>
      <div style={{
        height: '100%', borderRadius: 2,
        background: `linear-gradient(to right, ${color}99, ${color})`,
        boxShadow: `0 0 10px ${color}88`,
        width: `${Math.min(100, pct)}%`,
        transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)',
        animation: 'power-bar-sweep 1s cubic-bezier(0.22,1,0.36,1) both',
        transformOrigin: 'left',
      }} />
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

  // Average cost per fill-up
  const avgCost = fyTotals.count > 0 ? fyTotals.total / fyTotals.count : 0
  // Average L/fill if available
  const avgL = fyTotals.count > 0 && fyTotals.litres > 0 ? fyTotals.litres / fyTotals.count : 0
  // Cost per litre
  const avgCpL = fyTotals.litres > 0 ? fyTotals.total / fyTotals.litres : 0

  function shiftFY(dir) { setViewFY(fy => ({ start: fy.start + dir, end: fy.end + dir })) }

  if (entries.length === 0) return (
    <div style={{ textAlign: 'center', marginTop: 80, paddingBottom: 40 }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 16, opacity: 0.3 }}>⛽</div>
      <p style={{ fontFamily: '"DM Mono"', fontSize: '0.7rem', color: '#4A4440', letterSpacing: '0.15em', textTransform: 'uppercase', lineHeight: 2 }}>
        NO FUEL DATA<br />
        <span style={{ fontSize: '0.55rem', color: '#3A3430' }}>TAP + TO LOG YOUR FIRST FILL-UP</span>
      </p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── FY SUMMARY PANEL ── */}
      <div style={{
        background: 'rgba(10,9,8,0.9)',
        border: '0.5px solid rgba(255,183,0,0.2)',
        borderRadius: 10, overflow: 'hidden',
        clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)',
        boxShadow: '0 0 40px rgba(255,183,0,0.06)',
        filter: 'drop-shadow(0 0 16px rgba(255,183,0,0.1))',
        position: 'relative',
      }}>
        {/* Accent bar */}
        <div style={{
          height: 2, width: '100%',
          background: 'linear-gradient(to right, #FFB700, rgba(255,183,0,0.4) 60%, transparent)',
          boxShadow: '0 0 12px rgba(255,183,0,0.6)',
        }} />

        <div style={{ padding: '18px 18px 20px' }}>
          {/* FY navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <button onClick={() => shiftFY(-1)} style={{
              background: 'rgba(255,183,0,0.06)', border: '0.5px solid rgba(255,183,0,0.2)',
              color: '#FFB700', borderRadius: 6, width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontFamily: '"DM Mono"', fontSize: '1rem',
            }}>‹</button>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: '"DM Mono"', fontSize: '0.44rem', color: 'rgba(255,183,0,0.45)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 3 }}>
                ■ FINANCIAL YEAR
              </div>
              <div style={{ fontFamily: '"DM Mono"', fontSize: '0.85rem', color: '#EDE8E0', letterSpacing: '0.06em' }}>
                {fyLabel(viewFY)}
              </div>
            </div>

            <button
              style={{
                background: 'rgba(255,183,0,0.06)', border: '0.5px solid rgba(255,183,0,0.2)',
                color: viewFY.start >= curFY.start ? 'rgba(255,183,0,0.2)' : '#FFB700',
                borderRadius: 6, width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: viewFY.start < curFY.start ? 'pointer' : 'default',
                fontFamily: '"DM Mono"', fontSize: '1rem',
              }}
              onClick={() => { if (viewFY.start < curFY.start) shiftFY(1) }}>›</button>
          </div>

          {/* Total spend */}
          <div style={{ textAlign: 'center', marginBottom: 18, paddingBottom: 18, borderBottom: '0.5px solid rgba(255,183,0,0.08)' }}>
            <p style={{ fontFamily: '"DM Mono"', fontSize: '0.44rem', color: 'rgba(255,183,0,0.45)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>
              TOTAL SPENT
            </p>
            <p style={{
              fontFamily: '"DM Mono"', fontWeight: 700, fontSize: 'clamp(2rem, 8vw, 3rem)',
              color: '#FFB700', lineHeight: 1, letterSpacing: '-0.02em',
              textShadow: '0 0 30px rgba(255,183,0,0.5), 0 0 60px rgba(255,183,0,0.2)',
              animation: 'neon-flicker 8s linear infinite',
            }}>
              ${fmt$(fyTotals.total)}
            </p>
            <p style={{ fontFamily: '"DM Mono"', fontSize: '0.5rem', color: '#5A5450', letterSpacing: '0.12em', marginTop: 6 }}>
              {fyTotals.count} FILL-UP{fyTotals.count !== 1 ? 'S' : ''}
              {fyTotals.litres > 0 ? ` · ${fmtL(fyTotals.litres)}` : ''}
            </p>
            <FuelGaugeBar pct={(fyTotals.total / Math.max(fyTotals.total * 1.2, 1)) * 100} color="#FFB700" />
          </div>

          {/* Payment breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {['business', 'living', 'cash'].map(k => {
              const pm = PAYMENT_METHODS[k]
              const val = fyTotals[k]
              const pct = fyTotals.total > 0 ? (val / fyTotals.total) * 100 : 0
              return (
                <div key={k} style={{
                  background: val > 0 ? pm.bg : 'rgba(255,255,255,0.02)',
                  border: `0.5px solid ${val > 0 ? pm.color + '30' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 6, padding: '10px 8px', textAlign: 'center',
                }}>
                  <div style={{ fontFamily: '"DM Mono"', fontSize: '0.85rem', fontWeight: 700, color: val > 0 ? pm.color : '#3A3430', textShadow: val > 0 ? `0 0 10px ${pm.color}60` : 'none', marginBottom: 3 }}>
                    {val > 0 ? `$${fmt$(val)}` : '—'}
                  </div>
                  <div style={{ fontFamily: '"DM Mono"', fontSize: '0.42rem', color: val > 0 ? `${pm.color}70` : '#2A2420', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: val > 0 ? 5 : 0 }}>
                    {pm.short}
                  </div>
                  {val > 0 && <FuelGaugeBar pct={pct} color={pm.color} />}
                </div>
              )
            })}
          </div>

          {/* Stats row */}
          {(avgCost > 0 || avgCpL > 0) && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '0.5px solid rgba(255,183,0,0.07)' }}>
              {avgCost > 0 && (
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ fontFamily: '"DM Mono"', fontSize: '0.38rem', color: 'rgba(255,183,0,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 3 }}>AVG / FILL</p>
                  <p style={{ fontFamily: '"DM Mono"', fontSize: '0.7rem', color: '#C8BFB5', fontWeight: 700 }}>${fmt$(avgCost)}</p>
                </div>
              )}
              {avgL > 0 && (
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ fontFamily: '"DM Mono"', fontSize: '0.38rem', color: 'rgba(255,183,0,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 3 }}>AVG LITRES</p>
                  <p style={{ fontFamily: '"DM Mono"', fontSize: '0.7rem', color: '#C8BFB5', fontWeight: 700 }}>{fmtL(avgL)}</p>
                </div>
              )}
              {avgCpL > 0 && (
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ fontFamily: '"DM Mono"', fontSize: '0.38rem', color: 'rgba(255,183,0,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 3 }}>AVG $/L</p>
                  <p style={{ fontFamily: '"DM Mono"', fontSize: '0.7rem', color: '#C8BFB5', fontWeight: 700 }}>${avgCpL.toFixed(3)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      {months.length > 1 && <FuelChart months={months.slice(0, 7).reverse()} />}

      {/* Month groups divider */}
      {months.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
          <div style={{ flex: 1, height: 0.5, background: 'linear-gradient(to right, transparent, rgba(255,183,0,0.2), transparent)' }} />
          <span style={{ fontFamily: '"DM Mono"', fontSize: '0.42rem', color: 'rgba(255,183,0,0.3)', letterSpacing: '0.2em' }}>LOG</span>
          <div style={{ flex: 1, height: 0.5, background: 'linear-gradient(to right, transparent, rgba(255,183,0,0.2), transparent)' }} />
        </div>
      )}

      {/* Month groups */}
      {months.length === 0
        ? <p style={{ fontFamily: '"DM Mono"', fontSize: '0.6rem', color: '#3A3430', textAlign: 'center', padding: '20px 0', letterSpacing: '0.12em' }}>
            NO ENTRIES FOR {fyLabel(viewFY).toUpperCase()}
          </p>
        : months.map(group => <MonthGroup key={group.key} group={group} onEdit={onEdit} onDelete={onDelete} />)
      }

      {/* Swipe hint */}
      <p style={{ fontFamily: '"DM Mono"', fontSize: '0.42rem', textAlign: 'center', color: '#2A2420', letterSpacing: '0.12em', paddingBottom: 8 }}>
        ← SWIPE TO DELETE · SWIPE → TO EDIT →
      </p>
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

  const inputStyle = {
    background: 'rgba(10,9,8,0.9)',
    border: '0.5px solid rgba(255,183,0,0.2)',
    borderRadius: 8, color: '#EDE8E0',
    padding: '14px 16px', fontSize: '16px',
    fontFamily: '"DM Mono", monospace',
    width: '100%', outline: 'none',
    boxSizing: 'border-box', colorScheme: 'dark',
    transition: 'border-color 0.15s',
  }
  const labelStyle = {
    fontFamily: '"DM Mono"', fontSize: '0.48rem', color: 'rgba(255,183,0,0.45)',
    letterSpacing: '0.18em', textTransform: 'uppercase',
    marginBottom: 6, marginTop: 14, display: 'block',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(to top, #0D0C0B, #111009)',
        borderRadius: '20px 20px 0 0',
        borderTop: '1px solid rgba(255,183,0,0.25)',
        padding: '24px 20px', paddingBottom: 'max(36px,calc(24px + env(safe-area-inset-bottom)))',
        width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 4,
        boxShadow: '0 -12px 60px rgba(255,183,0,0.08)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: '"DM Mono"', fontSize: '0.42rem', color: 'rgba(255,183,0,0.4)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 3 }}>
              ■ FUEL SYS
            </div>
            <h2 style={{ fontFamily: '"Playfair Display"', fontStyle: 'italic', fontWeight: 600, fontSize: '1.3rem', color: '#FFB700', margin: 0, textShadow: '0 0 20px rgba(255,183,0,0.4)' }}>
              {initial ? 'Edit Fill-up' : 'Log Fill-up'}
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,183,0,0.06)', border: '0.5px solid rgba(255,183,0,0.2)',
            color: '#7A7268', borderRadius: 8, width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            fontFamily: '"DM Mono"', fontSize: '1rem',
          }}>✕</button>
        </div>

        {/* Precision divider */}
        <div style={{ height: 0.5, background: 'linear-gradient(to right, rgba(255,183,0,0.4), transparent)', marginBottom: 8 }} />

        <label style={labelStyle}>Date</label>
        <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)}
          onFocus={e => e.target.style.borderColor = 'rgba(255,183,0,0.6)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,183,0,0.2)'} />

        <label style={labelStyle}>Total Cost (AUD)</label>
        <div style={{ position: 'relative' }}>
          <input style={{ ...inputStyle, fontSize: '20px', fontWeight: 700, color: '#FFB700', letterSpacing: '-0.01em' }}
            type="number" inputMode="decimal" placeholder="0.00" step="0.01" min="0"
            value={cost} onChange={e => setCost(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'rgba(255,183,0,0.6)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,183,0,0.2)'} />
        </div>

        <label style={labelStyle}>Litres <span style={{ opacity: 0.4 }}>(optional)</span></label>
        <div style={{ position: 'relative' }}>
          <input style={inputStyle} type="number" inputMode="decimal" placeholder="0.0" step="0.1" min="0"
            value={litres} onChange={e => setLitres(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'rgba(255,183,0,0.6)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,183,0,0.2)'} />
          {cph && (
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: '"DM Mono"', fontSize: '0.6rem', color: 'rgba(255,183,0,0.5)', pointerEvents: 'none' }}>
              {cph}
            </span>
          )}
        </div>

        <label style={labelStyle}>Paid With</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.entries(PAYMENT_METHODS).map(([k, pm]) => (
            <button key={k} onClick={() => setPaymentMethod(k)} style={{
              background: paymentMethod === k ? pm.bg : 'rgba(10,9,8,0.8)',
              border: `0.5px solid ${paymentMethod === k ? pm.color + '55' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 8, padding: '12px 16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 18 }}>{pm.icon}</span>
              <span style={{ fontFamily: '"DM Mono"', fontSize: '0.72rem', color: paymentMethod === k ? pm.color : '#7A7268', letterSpacing: '0.06em', textShadow: paymentMethod === k ? `0 0 8px ${pm.color}60` : 'none' }}>
                {pm.label}
              </span>
              {paymentMethod === k && (
                <span style={{ marginLeft: 'auto', fontFamily: '"DM Mono"', fontSize: '0.55rem', color: pm.color }}>[ SELECTED ]</span>
              )}
            </button>
          ))}
        </div>

        <label style={labelStyle}>Notes <span style={{ opacity: 0.4 }}>(optional)</span></label>
        <input style={inputStyle} placeholder="e.g. Shell Launceston…" value={notes} onChange={e => setNotes(e.target.value)}
          onFocus={e => e.target.style.borderColor = 'rgba(255,183,0,0.6)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,183,0,0.2)'} />

        {/* Save button */}
        <button onClick={handleSave} style={{
          marginTop: 20, padding: '16px',
          background: 'rgba(255,183,0,0.12)',
          border: '1px solid rgba(255,183,0,0.5)',
          borderRadius: 10, cursor: 'pointer',
          fontFamily: '"DM Mono"', fontSize: '0.72rem',
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: '#FFB700',
          boxShadow: '0 0 20px rgba(255,183,0,0.1)',
          textShadow: '0 0 12px rgba(255,183,0,0.5)',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,183,0,0.2)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(255,183,0,0.2)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,183,0,0.12)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(255,183,0,0.1)' }}>
          {initial ? '[ SAVE CHANGES ]' : '[ LOG FILL-UP ]'}
        </button>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function FuelTracker() {
  const navigate = useNavigate()
  const [fuel, setFuel] = useState(() => load(FUEL_KEY, []))
  const [showForm, setShowForm] = useState(false)
  const [editFuel, setEditFuel] = useState(null)
  const [toast, setToast] = useState(null)
  const importRef = useRef(null)

  useEffect(() => { save(FUEL_KEY, fuel) }, [fuel])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2800) }

  function saveFuel(data) {
    if (editFuel) {
      setFuel(prev => [...prev.filter(e => e.id !== editFuel.id), { ...editFuel, ...data }].sort((a, b) => b.date.localeCompare(a.date)))
    } else {
      setFuel(prev => [{ ...data, id: Date.now().toString(), createdAt: new Date().toISOString() }, ...prev].sort((a, b) => b.date.localeCompare(a.date)))
    }
    setShowForm(false); setEditFuel(null)
  }

  function deleteFuel(id) { setFuel(prev => prev.filter(x => x.id !== id)) }

  function handleExport() {
    const blob = new Blob([JSON.stringify(fuel, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = `fuel-entries-${todayStr()}.json`; a.click()
    showToast('[ EXPORTED ]')
  }

  function handleImport(e) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result)
        const entries = Array.isArray(parsed) ? parsed : (parsed.fuel || [])
        if (!entries.length) { showToast('NO ENTRIES FOUND'); return }
        setFuel(prev => {
          const existingIds = new Set(prev.map(e => e.id))
          const newEntries = entries.filter(e => !existingIds.has(e.id))
          return [...prev, ...newEntries].sort((a, b) => b.date.localeCompare(a.date))
        })
        showToast(`[ IMPORTED ${entries.length} ENTRIES ]`)
      } catch { showToast('[ INVALID FILE ]') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0D0C0B',
      color: '#EDE8E0',
      fontFamily: '"DM Sans", sans-serif',
      position: 'relative',
    }}>

      {/* Holo ring clusters */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <HoloRings size={320} color="#FFB700" style={{ position: 'absolute', bottom: -100, left: -100, opacity: 0.52 }} />
        <HoloRings size={200} color="#00C8FF" style={{ position: 'absolute', top: -50, right: -50, opacity: 0.44 }} />
        <HoloRings size={150} color="#A040E0" style={{ position: 'absolute', top: '45%', right: -45, opacity: 0.36 }} />
      </div>

      {/* Background grid + scan */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(255,183,0,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,183,0,0.025) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,183,0,0.06) 0%, transparent 70%)',
      }} />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom) + 88px)',
          left: '50%', transform: 'translateX(-50%)', zIndex: 300, whiteSpace: 'nowrap',
          background: 'rgba(10,9,8,0.95)', borderRadius: 6, padding: '10px 18px',
          border: '0.5px solid rgba(255,183,0,0.4)',
          fontFamily: '"DM Mono"', fontSize: '0.6rem', letterSpacing: '0.15em',
          color: '#FFB700', boxShadow: '0 0 20px rgba(255,183,0,0.2)',
        }}>
          {toast}
        </div>
      )}

      <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />

      {/* ── HEADER ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        paddingTop: 'calc(env(safe-area-inset-top) + 10px)',
        paddingBottom: 12,
        paddingLeft: 16, paddingRight: 16,
        background: 'linear-gradient(to bottom, rgba(8,7,6,0.99) 0%, rgba(13,12,11,0.95) 100%)',
        backdropFilter: 'blur(24px)',
        borderBottom: '0.5px solid rgba(255,183,0,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
      }}>
        {/* Left — back */}
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0',
          color: 'rgba(255,183,0,0.6)',
        }}>
          <ChevronLeft size={16} strokeWidth={1.5} />
          <span style={{ fontFamily: '"DM Mono"', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Back</span>
        </button>

        {/* Center — title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: '"DM Mono"', fontSize: '0.38rem', color: 'rgba(255,183,0,0.4)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 1 }}>
            ■ SIG9 TELEMETRY
          </div>
          <h1 style={{ fontFamily: '"Playfair Display"', fontStyle: 'italic', fontWeight: 600, fontSize: '1.05rem', color: '#FFB700', margin: 0, textShadow: '0 0 16px rgba(255,183,0,0.4)', letterSpacing: '-0.01em' }}>
            Fuel Tracker
          </h1>
        </div>

        {/* Right — actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { icon: Upload, onClick: () => importRef.current?.click(), title: 'Import' },
            { icon: Download, onClick: handleExport, title: 'Export' },
          ].map(({ icon: Icon, onClick, title }) => (
            <button key={title} onClick={onClick} title={title} style={{
              background: 'rgba(255,183,0,0.06)', border: '0.5px solid rgba(255,183,0,0.2)',
              color: 'rgba(255,183,0,0.5)', borderRadius: 7, width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,183,0,0.5)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,183,0,0.2)'}>
              <Icon size={15} strokeWidth={1.5} />
            </button>
          ))}
          <button onClick={() => { setEditFuel(null); setShowForm(true) }} style={{
            background: 'rgba(255,183,0,0.1)', border: '0.5px solid rgba(255,183,0,0.5)',
            color: '#FFB700', borderRadius: 7, width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: '0 0 12px rgba(255,183,0,0.12)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,183,0,0.2)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(255,183,0,0.25)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,183,0,0.1)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(255,183,0,0.12)' }}>
            <Plus size={17} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{
        padding: '16px 16px',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 88px)',
        maxWidth: 600, margin: '0 auto',
        position: 'relative', zIndex: 1,
      }}>
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

      <BottomNav />
    </div>
  )
}
