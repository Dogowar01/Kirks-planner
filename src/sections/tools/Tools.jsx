import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import SectionShell from '../../components/SectionShell'
import bgImg from '../../assets/art-architectural.jpg'

// ─── World Clocks ────────────────────────────────────────────────────────────
const CITIES = [
  { name: 'Orlando',  tz: 'America/New_York',  lat: 28.54,  lon: -81.38 },
  { name: 'Tokyo',    tz: 'Asia/Tokyo',         lat: 35.68,  lon: 139.69 },
  { name: 'New York', tz: 'America/New_York',   lat: 40.71,  lon: -74.01 },
]

function useWorldData() {
  const [times, setTimes] = useState({})
  const [temps, setTemps] = useState({})

  useEffect(() => {
    const tick = () => {
      const now = {}
      CITIES.forEach(c => {
        now[c.name] = new Intl.DateTimeFormat('en-AU', {
          timeZone: c.tz, hour: '2-digit', minute: '2-digit', hour12: false,
          weekday: 'short',
        }).format(new Date())
      })
      setTimes(now)
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    CITIES.forEach(c => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current_weather=true`, { cache: 'no-store' })
        .then(r => r.json())
        .then(j => setTemps(t => ({ ...t, [c.name]: Math.round(j.current_weather?.temperature ?? '—') })))
        .catch(() => {})
    })
  }, [])

  return { times, temps }
}

// Nixie tube digit — each character gets its own glowing tube
function NixieTube({ char, colon }) {
  if (colon) return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 5, padding: '0 1px', paddingBottom: 6 }}>
      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#FF6B00', boxShadow: '0 0 6px #FF6B00, 0 0 12px #FF4400' }} />
      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#FF6B00', boxShadow: '0 0 6px #FF6B00, 0 0 12px #FF4400' }} />
    </div>
  )
  return (
    <div style={{
      position: 'relative',
      width: 32, height: 46,
      background: 'radial-gradient(ellipse at 50% 30%, #1a0f00 0%, #0d0800 100%)',
      borderRadius: 5,
      border: '1px solid #3a2800',
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(255,100,0,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Glass sheen */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg,rgba(255,255,255,0.04) 0%,transparent 100%)', borderRadius: '5px 5px 0 0', pointerEvents: 'none' }} />
      {/* Glow halo behind digit */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 60%, rgba(255,80,0,0.18) 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <span style={{
        fontFamily: '"Share Tech Mono","DM Mono",monospace',
        fontSize: '1.6rem',
        fontWeight: 400,
        color: '#FF8C35',
        textShadow: '0 0 6px #FF6B00, 0 0 14px #FF4400, 0 0 28px #FF220066',
        lineHeight: 1,
        position: 'relative',
        zIndex: 1,
        letterSpacing: 0,
      }}>{char}</span>
    </div>
  )
}

function NixieClock({ time, day, temp, city }) {
  // time is "HH:MM" or ''
  const chars = time ? time.split('') : ['–', '–', ':', '–', '–']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {/* City label */}
      <p style={{ fontFamily: '"DM Mono",monospace', fontSize: '0.58rem', color: '#5C5650', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{city}</p>

      {/* Tube row */}
      <div style={{
        background: 'linear-gradient(180deg,#111008 0%,#0a0805 100%)',
        borderRadius: 8,
        padding: '8px 10px 10px',
        border: '1px solid #2a1f00',
        boxShadow: '0 4px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,150,0,0.08)',
        display: 'flex', alignItems: 'flex-end', gap: 3,
      }}>
        {chars.map((ch, i) => (
          <NixieTube key={i} char={ch} colon={ch === ':'} />
        ))}
      </div>

      {/* Day + temp */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontFamily: '"DM Mono",monospace', fontSize: '0.58rem', color: '#5C4A30', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{day}</span>
        {temp !== undefined && (
          <span style={{ fontFamily: '"Share Tech Mono","DM Mono",monospace', fontSize: '0.7rem', color: '#CC5500', textShadow: '0 0 6px #FF440044' }}>{temp}°</span>
        )}
      </div>
    </div>
  )
}

function WorldClocks() {
  const { times, temps } = useWorldData()
  return (
    <div className="card" style={{ background: '#0a0905', borderColor: '#1e1a0a' }}>
      <p className="section-label mb-4">World Clocks</p>
      <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
        {CITIES.map(c => {
          const raw = times[c.name] || ''
          // Intl returns e.g. "Mon, 14:35" — split on ", "
          const parts = raw.split(', ')
          const day = parts[0] || ''
          const time = parts[1] || ''
          return (
            <NixieClock key={c.name} city={c.name} time={time} day={day} temp={temps[c.name]} />
          )
        })}
      </div>
    </div>
  )
}

// ─── GRAV-7 Calculator ───────────────────────────────────────────────────────
const CYAN = '#00D4FF'
const CYAN_DIM = '#007A94'
const BODY = '#1a1c1f'
const BTN_BG = '#222528'
const BTN_BORDER = '#2e3135'

function Grav7() {
  const [display, setDisplay] = useState('0')
  const [expr, setExpr] = useState('')
  const [subExpr, setSubExpr] = useState('')   // shown above main display
  const [memory, setMemory] = useState(0)
  const [m1, setM1] = useState(null)
  const [m2, setM2] = useState(null)
  const [m3, setM3] = useState(null)
  const [shift, setShift] = useState(false)
  const [gstBreak, setGstBreak] = useState(null)
  const [hasResult, setHasResult] = useState(false)

  const numVal = () => parseFloat(display) || 0

  const evaluate = (e, d) => {
    try {
      // eslint-disable-next-line no-new-func
      const r = Function('"use strict";return(' + e + d + ')')()
      return isFinite(r) ? r : null
    } catch { return null }
  }

  const press = (key) => {
    switch (key) {
      case 'AC':
        setDisplay('0'); setExpr(''); setSubExpr(''); setGstBreak(null); setHasResult(false)
        break
      case 'DEL':
        if (hasResult) { setDisplay('0'); setHasResult(false) }
        else setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0')
        break
      case '+': case '-': case '×': case '÷': {
        const op = key.replace('×','*').replace('÷','/')
        const cur = hasResult ? display : display
        setSubExpr(cur + ' ' + key)
        setExpr(cur + op)
        setDisplay('0')
        setHasResult(false)
        setGstBreak(null)
        break
      }
      case '%':
        if (expr) {
          const r = evaluate(expr, display + '/100*' + display.replace(/.*[+\-*/]/, ''))
          // simpler: x% of preceding
          const base = parseFloat(expr.replace(/[+\-*/][^+\-*/]*$/, '')) || 100
          const pct = numVal() / 100 * base
          setDisplay(String(Math.round(pct * 1e10) / 1e10))
        } else {
          setDisplay(d => String(parseFloat(d) / 100))
        }
        setHasResult(true)
        break
      case '=': {
        if (!expr) break
        const r = evaluate(expr, display)
        if (r === null) { setDisplay('Error'); setExpr(''); setSubExpr(''); break }
        const rounded = Math.round(r * 1e10) / 1e10
        setSubExpr(subExpr + ' ' + display + ' =')
        setDisplay(String(rounded))
        setExpr('')
        setHasResult(true)
        setGstBreak(null)
        break
      }
      case '.':
        if (hasResult) { setDisplay('0.'); setHasResult(false) }
        else setDisplay(d => d.includes('.') ? d : d + '.')
        break
      case '00':
        if (hasResult) { setDisplay('0'); setHasResult(false) }
        else setDisplay(d => d === '0' ? '0' : d + '00')
        break
      // Memory
      case 'MC': setMemory(0); break
      case 'MR': setDisplay(String(memory)); setHasResult(true); break
      case 'M+': setMemory(m => m + numVal()); break
      case 'M-': setMemory(m => m - numVal()); break
      // M slots
      case 'MEM': setM1(numVal()); break
      case 'HIST': setM2(numVal()); break
      case 'EQ': setM3(numVal()); break
      // FUNC = GST toggle
      case 'FUNC': {
        const v = numVal()
        if (!isNaN(v) && v !== 0) {
          const gst = Math.round(v / 11 * 100) / 100
          const ex = Math.round((v - gst) * 100) / 100
          setGstBreak({ inc: v, gst, ex })
        } else setGstBreak(null)
        break
      }
      case 'SHIFT': setShift(s => !s); break
      default: {
        // number
        if (hasResult) { setDisplay(key); setHasResult(false) }
        else setDisplay(d => d === '0' ? key : d + key)
        setGstBreak(null)
      }
    }
  }

  const fmt = (n) => {
    if (n === null) return '—'
    const str = String(n)
    if (str === 'Error') return str
    const [int, dec] = str.split('.')
    const intFmt = parseInt(int).toLocaleString()
    return dec !== undefined ? intFmt + '.' + dec : intFmt
  }

  // Button definitions: [label, subLabel?, type]
  // types: num, op, mem, fn, eq, ac, del, shift
  const btnStyle = (type, active = false) => {
    const base = {
      border: `1px solid ${BTN_BORDER}`,
      borderRadius: 8,
      cursor: 'pointer',
      fontFamily: '"Share Tech Mono", "DM Mono", monospace',
      letterSpacing: '0.05em',
      transition: 'all 0.1s',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 4px',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.5)',
    }
    if (type === 'shift') return { ...base, background: active ? CYAN : '#1a3a40', color: active ? '#000' : CYAN, border: `1px solid ${active ? CYAN : CYAN_DIM}`, clipPath: 'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)', borderRadius: 0 }
    if (type === 'ac')    return { ...base, background: '#1a2a2e', color: CYAN, border: `1px solid ${CYAN_DIM}` }
    if (type === 'del')   return { ...base, background: BTN_BG, color: CYAN }
    if (type === 'eq')    return { ...base, background: '#0a2030', color: CYAN, border: `1px solid ${CYAN_DIM}` }
    if (type === 'op')    return { ...base, background: '#1e2428', color: CYAN, border: `1px solid #2a3840` }
    if (type === 'mem')   return { ...base, background: '#1c1e21', color: '#7a9aaa', fontSize: '0.75rem' }
    if (type === 'fn')    return { ...base, background: '#1c1e22', color: '#6a8a9a', fontSize: '0.75rem' }
    return { ...base, background: BTN_BG, color: '#ddeeff' }
  }

  const Btn = ({ label, sub, type = 'num', rowSpan, onClick }) => (
    <button
      onClick={() => onClick ? onClick() : press(label)}
      style={{
        ...btnStyle(type, type === 'shift' && shift),
        gridRow: rowSpan ? `span ${rowSpan}` : undefined,
        minHeight: rowSpan ? undefined : 46,
        height: rowSpan ? '100%' : 46,
      }}>
      <span style={{ fontSize: type === 'mem' || type === 'fn' ? '0.7rem' : '1rem', lineHeight: 1 }}>{label}</span>
      {sub && <span style={{ fontSize: '0.5rem', color: CYAN_DIM, marginTop: 2, letterSpacing: '0.1em' }}>{sub}</span>}
    </button>
  )

  return (
    <div style={{
      background: `linear-gradient(145deg, #23262b, #16181c)`,
      borderRadius: 20,
      padding: 16,
      border: '1px solid #2e3540',
      boxShadow: `0 0 0 1px #1a1c20, 0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)`,
      maxWidth: 360,
      margin: '0 auto',
    }}>

      {/* Display */}
      <div style={{
        background: '#080c10',
        borderRadius: 10,
        padding: '10px 14px 12px',
        marginBottom: 14,
        border: '1px solid #111820',
        boxShadow: `inset 0 2px 12px rgba(0,0,0,0.9), 0 0 20px rgba(0,212,255,0.04)`,
        position: 'relative',
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.6rem', color: CYAN_DIM, letterSpacing: '0.15em' }}>GRAV-7</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {memory !== 0 && <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.55rem', color: CYAN }}>M</span>}
            <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.55rem', color: CYAN_DIM }}>DEG</span>
            <div style={{ width: 18, height: 8, border: `1px solid ${CYAN_DIM}`, borderRadius: 2, padding: 1 }}>
              <div style={{ width: '70%', height: '100%', background: CYAN, borderRadius: 1 }} />
            </div>
          </div>
        </div>

        {/* Sub expression */}
        <div style={{ textAlign: 'right', minHeight: 16, marginBottom: 2 }}>
          <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.65rem', color: CYAN_DIM, opacity: 0.7 }}>{subExpr}</span>
        </div>

        {/* Main display */}
        <div style={{ textAlign: 'right' }}>
          <span style={{
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: display.length > 10 ? '1.4rem' : display.length > 7 ? '1.8rem' : '2.2rem',
            color: CYAN,
            textShadow: `0 0 10px ${CYAN}99, 0 0 20px ${CYAN}44`,
            letterSpacing: '0.05em',
            lineHeight: 1,
          }}>{fmt(display)}</span>
        </div>

        {/* GST breakdown */}
        {gstBreak && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: `0.5px solid ${CYAN_DIM}33` }}>
            {[['EX GST', gstBreak.ex], ['GST', gstBreak.gst], ['INC GST', gstBreak.inc]].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.45rem', color: CYAN_DIM, letterSpacing: '0.1em' }}>{l}</div>
                <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.75rem', color: CYAN }}>${v.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}

        {/* M slot indicators */}
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          {[['M1', m1], ['M2', m2], ['M3', m3]].map(([l, v]) => (
            <button key={l} onClick={() => v !== null && (setDisplay(String(v)), setHasResult(true))}
              style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.5rem', color: v !== null ? CYAN : '#2a3a44', letterSpacing: '0.1em', background: 'none', border: 'none', cursor: v !== null ? 'pointer' : 'default', padding: 0 }}>
              {l}{v !== null ? `=${v}` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Button grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Row 0: MEM HIST EQ FUNC SHIFT */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
          <Btn label="MEM" sub="M1" type="fn" />
          <Btn label="HIST" sub="M2" type="fn" />
          <Btn label="EQ" sub="M3" type="fn" />
          <Btn label="FUNC" type="fn" onClick={() => press('FUNC')} />
          <Btn label="SHIFT" type="shift" />
        </div>

        {/* Rows 1-4: main grid — left mem col + 4 num cols + op col + right col */}
        {/* Using explicit grid for the tall = button */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gridTemplateRows: 'repeat(4, 46px)', gap: 6 }}>
          {/* Col 1: MC MR M- M+ */}
          <Btn label="MC" type="mem" />
          <Btn label="MR" type="mem" />
          <Btn label="M−" type="mem" onClick={() => press('M-')} />
          <Btn label="M+" type="mem" />

          {/* Row 1 nums: 7 8 9 */}
          <Btn label="7" /><Btn label="8" /><Btn label="9" />
          {/* Row 2 nums: 4 5 6 */}
          <Btn label="4" /><Btn label="5" /><Btn label="6" />
          {/* Row 3 nums: 1 2 3 */}
          <Btn label="1" /><Btn label="2" /><Btn label="3" />
          {/* Row 4 nums: 0 00 . */}
          <Btn label="0" /><Btn label="00" /><Btn label="." />

          {/* Col 5: % × + ÷ */}
          <Btn label="%" type="op" />
          <Btn label="×" type="op" />
          <Btn label="+" type="op" />
          <Btn label="÷" type="op" />

          {/* Col 6: AC DEL = (tall) */}
          <Btn label="AC" type="ac" />
          <Btn label="DEL" type="del" />
          {/* Tall = button — rendered separately via absolute/flex trick */}
        </div>

        {/* = button spans last 2 rows of col 6 — we recreate as a separate button below the grid using negative margin */}
      </div>

      {/* Render = as a standalone tall button overlaid — easier: just add it outside main rows */}
    </div>
  )
}

// Revised layout using CSS grid with explicit placement
function Calculator() {
  const [display, setDisplay] = useState('0')
  const [expr, setExpr] = useState('')
  const [subExpr, setSubExpr] = useState('')
  const [memory, setMemory] = useState(0)
  const [m1, setM1] = useState(null)
  const [m2, setM2] = useState(null)
  const [m3, setM3] = useState(null)
  const [shift, setShift] = useState(false)
  const [gstBreak, setGstBreak] = useState(null)
  const [hasResult, setHasResult] = useState(false)

  const numVal = () => { const n = parseFloat(display); return isNaN(n) ? 0 : n }

  const press = (key) => {
    if (key === 'AC') { setDisplay('0'); setExpr(''); setSubExpr(''); setGstBreak(null); setHasResult(false); return }
    if (key === 'DEL') { if (hasResult) { setDisplay('0'); setHasResult(false) } else setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0'); return }
    if (key === 'SHIFT') { setShift(s => !s); return }
    if (key === 'FUNC') {
      const v = numVal()
      if (v !== 0) { const gst = Math.round(v / 11 * 100) / 100; setGstBreak({ inc: v, gst, ex: Math.round((v - gst) * 100) / 100 }) }
      else setGstBreak(null)
      return
    }
    if (key === 'MC') { setMemory(0); return }
    if (key === 'MR') { setDisplay(String(memory)); setHasResult(true); return }
    if (key === 'M+') { setMemory(m => m + numVal()); return }
    if (key === 'M-') { setMemory(m => m - numVal()); return }
    if (key === 'MEM') { setM1(numVal()); return }
    if (key === 'HIST') { setM2(numVal()); return }
    if (key === 'EQ') { setM3(numVal()); return }
    if (key === '%') {
      const v = numVal()
      const base = expr ? parseFloat(expr) || 100 : 100
      setDisplay(String(Math.round(v / 100 * base * 1e10) / 1e10))
      setHasResult(true); return
    }
    if (['+', '-', '×', '÷'].includes(key)) {
      const op = key.replace('×','*').replace('÷','/')
      setSubExpr(display + ' ' + key); setExpr(display + op); setDisplay('0'); setHasResult(false); setGstBreak(null); return
    }
    if (key === '=') {
      if (!expr) return
      try {
        // eslint-disable-next-line no-new-func
        const r = Function('"use strict";return(' + expr + display + ')')()
        if (!isFinite(r)) { setDisplay('Error'); setExpr(''); setSubExpr(''); return }
        const rounded = Math.round(r * 1e10) / 1e10
        setSubExpr(subExpr + ' ' + display + ' =')
        setDisplay(String(rounded)); setExpr(''); setHasResult(true); setGstBreak(null)
      } catch { setDisplay('Error'); setExpr(''); setSubExpr('') }
      return
    }
    if (key === '.') { if (hasResult) { setDisplay('0.'); setHasResult(false) } else setDisplay(d => d.includes('.') ? d : d + '.'); return }
    if (key === '00') { if (hasResult) { setDisplay('0'); setHasResult(false) } else setDisplay(d => d === '0' ? '0' : d + '00'); return }
    // digit
    if (hasResult) { setDisplay(key); setHasResult(false) } else setDisplay(d => d === '0' ? key : d.length >= 12 ? d : d + key)
    setGstBreak(null)
  }

  const fmt = (n) => {
    if (n === 'Error') return n
    const [int, dec] = n.split('.')
    try { return parseInt(int, 10).toLocaleString() + (dec !== undefined ? '.' + dec : '') }
    catch { return n }
  }

  const s = {
    wrap: { background: 'linear-gradient(145deg,#23262b,#16181c)', borderRadius: 20, padding: 16, border: '1px solid #2e3540', boxShadow: '0 0 0 1px #1a1c20, 0 20px 60px rgba(0,0,0,0.8)', maxWidth: 360, margin: '0 auto' },
    display: { background: '#080c10', borderRadius: 10, padding: '10px 14px 12px', marginBottom: 14, border: '1px solid #111820', boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.9)' },
    btn: (t) => ({
      borderRadius: t === 'shift' ? 0 : 8,
      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      border: `1px solid ${t === 'ac' || t === 'shift' ? CYAN_DIM : BTN_BORDER}`,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.5)',
      fontFamily: '"Share Tech Mono","DM Mono",monospace',
      background: t === 'shift' ? (shift ? CYAN : '#0d2228') : t === 'ac' ? '#0d2228' : t === 'del' ? BTN_BG : t === 'op' ? '#1a2228' : t === 'mem' || t === 'fn' ? '#1c1e22' : BTN_BG,
      color: t === 'shift' ? (shift ? '#000' : CYAN) : t === 'ac' || t === 'del' ? CYAN : t === 'op' ? CYAN : t === 'mem' || t === 'fn' ? '#6a8a9a' : '#ddeeff',
      clipPath: t === 'shift' ? 'polygon(20% 0%,80% 0%,100% 50%,80% 100%,20% 100%,0% 50%)' : undefined,
      fontSize: t === 'mem' || t === 'fn' ? '0.7rem' : '1rem',
      transition: 'filter 0.1s',
    }),
  }

  const B = ({ k, sub, t = 'num', style: sx = {} }) => (
    <button onClick={() => press(k)} style={{ ...s.btn(t), ...sx }}>
      <span style={{ lineHeight: 1 }}>{k}</span>
      {sub && <span style={{ fontSize: '0.48rem', color: CYAN_DIM, marginTop: 2, letterSpacing: '0.1em' }}>{sub}</span>}
    </button>
  )

  return (
    <div style={s.wrap}>
      {/* Display */}
      <div style={s.display}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: '"Share Tech Mono",monospace', fontSize: '0.58rem', color: CYAN_DIM, letterSpacing: '0.15em' }}>GRAV-7</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {memory !== 0 && <span style={{ fontFamily: '"Share Tech Mono",monospace', fontSize: '0.55rem', color: CYAN }}>M</span>}
            <span style={{ fontFamily: '"Share Tech Mono",monospace', fontSize: '0.55rem', color: CYAN_DIM }}>DEG</span>
            <div style={{ width: 20, height: 9, border: `1px solid ${CYAN_DIM}`, borderRadius: 2, padding: '1px 2px' }}>
              <div style={{ width: '70%', height: '100%', background: CYAN, borderRadius: 1 }} />
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', minHeight: 14, marginBottom: 2 }}>
          <span style={{ fontFamily: '"Share Tech Mono",monospace', fontSize: '0.6rem', color: CYAN_DIM }}>{subExpr}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontFamily: '"Share Tech Mono",monospace', fontSize: display.length > 10 ? '1.4rem' : display.length > 7 ? '1.8rem' : '2.3rem', color: CYAN, textShadow: `0 0 10px ${CYAN}88,0 0 25px ${CYAN}33`, letterSpacing: '0.04em', lineHeight: 1 }}>
            {fmt(display)}
          </span>
        </div>
        {gstBreak && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: `0.5px solid #00D4FF22` }}>
            {[['EX GST', gstBreak.ex], ['GST', gstBreak.gst], ['INC GST', gstBreak.inc]].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: '"Share Tech Mono",monospace', fontSize: '0.45rem', color: CYAN_DIM, letterSpacing: '0.1em' }}>{l}</div>
                <div style={{ fontFamily: '"Share Tech Mono",monospace', fontSize: '0.8rem', color: CYAN }}>${v.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          {[['M1', m1, setM1], ['M2', m2, setM2], ['M3', m3, setM3]].map(([l, v, setter]) => (
            <button key={l} onClick={() => v !== null && (setDisplay(String(v)), setHasResult(true))}
              style={{ fontFamily: '"Share Tech Mono",monospace', fontSize: '0.5rem', color: v !== null ? CYAN : '#1e3040', background: 'none', border: 'none', cursor: v !== null ? 'pointer' : 'default', padding: 0, letterSpacing: '0.08em' }}>
              {l}{v !== null ? `·${v}` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Grid — 6 cols × 5 rows */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gridTemplateRows: '36px repeat(4, 48px)', gap: 6 }}>

        {/* Row 0: MEM HIST EQ FUNC SHIFT (spans cols 1-5, SHIFT col 6) */}
        <B k="MEM" sub="M1" t="fn" style={{ gridColumn: 1 }} />
        <B k="HIST" sub="M2" t="fn" style={{ gridColumn: 2 }} />
        <B k="EQ" sub="M3" t="fn" style={{ gridColumn: 3 }} />
        <B k="FUNC" t="fn" style={{ gridColumn: 4 }} />
        <B k="SHIFT" t="shift" style={{ gridColumn: '5 / span 2', padding: '0 8px' }} />

        {/* Col 1: MC MR M- M+ (rows 2-5) */}
        <B k="MC" t="mem" style={{ gridColumn: 1, gridRow: 2 }} />
        <B k="MR" t="mem" style={{ gridColumn: 1, gridRow: 3 }} />
        <B k="M−" t="mem" style={{ gridColumn: 1, gridRow: 4 }} />
        <B k="M+" t="mem" style={{ gridColumn: 1, gridRow: 5 }} />

        {/* Row 2: 7 8 9 */}
        <B k="7" style={{ gridColumn: 2, gridRow: 2 }} />
        <B k="8" style={{ gridColumn: 3, gridRow: 2 }} />
        <B k="9" style={{ gridColumn: 4, gridRow: 2 }} />

        {/* Row 3: 4 5 6 */}
        <B k="4" style={{ gridColumn: 2, gridRow: 3 }} />
        <B k="5" style={{ gridColumn: 3, gridRow: 3 }} />
        <B k="6" style={{ gridColumn: 4, gridRow: 3 }} />

        {/* Row 4: 1 2 3 */}
        <B k="1" style={{ gridColumn: 2, gridRow: 4 }} />
        <B k="2" style={{ gridColumn: 3, gridRow: 4 }} />
        <B k="3" style={{ gridColumn: 4, gridRow: 4 }} />

        {/* Row 5: 0 00 . */}
        <B k="0" style={{ gridColumn: 2, gridRow: 5 }} />
        <B k="00" style={{ gridColumn: 3, gridRow: 5 }} />
        <B k="." style={{ gridColumn: 4, gridRow: 5 }} />

        {/* Col 5: % × + ÷ */}
        <B k="%" t="op" style={{ gridColumn: 5, gridRow: 2 }} />
        <B k="×" t="op" style={{ gridColumn: 5, gridRow: 3 }} />
        <B k="+" t="op" style={{ gridColumn: 5, gridRow: 4 }} />
        <B k="÷" t="op" style={{ gridColumn: 5, gridRow: 5 }} />

        {/* Col 6: AC DEL = (tall, spans rows 4-5) */}
        <B k="AC" t="ac" style={{ gridColumn: 6, gridRow: 2 }} />
        <B k="DEL" t="del" style={{ gridColumn: 6, gridRow: 3 }} />
        <B k="=" t="ac" style={{ gridColumn: 6, gridRow: '4 / span 2', fontSize: '1.4rem' }} />
      </div>
    </div>
  )
}

// ─── Pomodoro ─────────────────────────────────────────────────────────────────
function Pomodoro() {
  const WORK = 25 * 60, BREAK = 5 * 60
  const [secs, setSecs] = useState(WORK)
  const [running, setRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [sessions, setSessions] = useState(0)
  const ref = useRef()

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) {
            clearInterval(ref.current)
            setRunning(false)
            if (!isBreak) { setSessions(n => n + 1); setIsBreak(true); setSecs(BREAK) }
            else { setIsBreak(false); setSecs(WORK) }
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else clearInterval(ref.current)
    return () => clearInterval(ref.current)
  }, [running, isBreak])

  const reset = () => { setRunning(false); setSecs(isBreak ? BREAK : WORK) }
  const total = isBreak ? BREAK : WORK
  const pct = ((total - secs) / total) * 100
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <p className="section-label">Pomodoro</p>
        <span className="section-label">{sessions} sessions today</span>
      </div>

      <div className={`chip text-center w-full ${isBreak ? '' : 'active'}`} style={{ cursor: 'default' }}>
        {isBreak ? 'Break time ☕' : 'Focus time'}
      </div>

      {/* Ring */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 140, height: 140 }}>
          <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle cx="70" cy="70" r="60" fill="none" stroke="var(--section-accent)" strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 60}`}
              strokeDashoffset={`${2 * Math.PI * 60 * (1 - pct / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '2rem', fontWeight: 600, color: '#EDE8E0' }}>{mm}:{ss}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setRunning(r => !r)} className="btn-primary flex-1 justify-center">
          {running ? 'Pause' : 'Start'}
        </button>
        <button onClick={reset} className="btn-ghost">Reset</button>
      </div>
    </div>
  )
}

// ─── Unit Converter ───────────────────────────────────────────────────────────
const CONVERTERS = [
  { label: 'Length',      units: ['cm', 'in', 'm', 'ft'], factors: { cm: 1, in: 2.54, m: 100, ft: 30.48 } },
  { label: 'Weight',      units: ['kg', 'lb', 'g', 'oz'], factors: { kg: 1, lb: 0.453592, g: 0.001, oz: 0.0283495 } },
  { label: 'Distance',    units: ['km', 'mi', 'm'],        factors: { km: 1, mi: 1.60934, m: 0.001 } },
  { label: 'Temperature', units: ['°C', '°F'],             factors: null },
]

function UnitConverter() {
  const [cat, setCat] = useState(0)
  const [from, setFrom] = useState('')
  const [fromUnit, setFromUnit] = useState(0)
  const [toUnit, setToUnit] = useState(1)

  const conv = CONVERTERS[cat]

  const convert = (val, fU, tU) => {
    if (!val || isNaN(val)) return ''
    const n = parseFloat(val)
    if (conv.label === 'Temperature') {
      if (fU === 0 && tU === 1) return ((n * 9/5) + 32).toFixed(2)
      if (fU === 1 && tU === 0) return ((n - 32) * 5/9).toFixed(2)
      return n.toFixed(2)
    }
    const base = n * conv.factors[conv.units[fU]]
    return (base / conv.factors[conv.units[tU]]).toFixed(4).replace(/\.?0+$/, '')
  }

  const result = convert(from, fromUnit, toUnit)

  const switchCat = (i) => { setCat(i); setFrom(''); setFromUnit(0); setToUnit(1) }

  return (
    <div className="card space-y-3">
      <p className="section-label">Unit Converter</p>

      <div className="flex gap-1.5 flex-wrap">
        {CONVERTERS.map((c, i) => (
          <button key={c.label} onClick={() => switchCat(i)} className={`chip ${cat === i ? 'active' : ''}`}>{c.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <select className="input mb-2" value={fromUnit} onChange={e => setFromUnit(Number(e.target.value))}>
            {conv.units.map((u, i) => <option key={u} value={i}>{u}</option>)}
          </select>
          <input className="input" type="number" placeholder="Enter value" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div>
          <select className="input mb-2" value={toUnit} onChange={e => setToUnit(Number(e.target.value))}>
            {conv.units.map((u, i) => <option key={u} value={i}>{u}</option>)}
          </select>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '8px 12px', minHeight: 40, display: 'flex', alignItems: 'center' }}>
            <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: 'var(--section-accent)', fontWeight: 600 }}>
              {result || '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── QR Generator ────────────────────────────────────────────────────────────
function QRGenerator() {
  const [url, setUrl] = useState('')
  return (
    <div className="card space-y-3">
      <p className="section-label">QR Code Generator</p>
      <input className="input" placeholder="Paste a URL or text…" value={url} onChange={e => setUrl(e.target.value)} />
      {url.trim() && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
            <QRCodeSVG value={url.trim()} size={180} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Tools() {
  return (
    <SectionShell accent="#2A7A6F" bgImage={bgImg}>
      <div className="p-4 md:p-6 max-w-2xl">
        <h1 className="section-title mb-6">Tools</h1>
        <div className="space-y-4">
          <WorldClocks />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Calculator />
            <div className="space-y-4">
              <Pomodoro />
              <QRGenerator />
            </div>
          </div>
          <UnitConverter />
        </div>
      </div>
    </SectionShell>
  )
}
