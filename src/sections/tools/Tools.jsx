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
        const d = new Date()
        const time = new Intl.DateTimeFormat('en-GB', {
          timeZone: c.tz, hour: '2-digit', minute: '2-digit', hour12: false,
        }).format(d)
        const day = new Intl.DateTimeFormat('en-AU', {
          timeZone: c.tz, weekday: 'short',
        }).format(d)
        now[c.name] = { time, day }
      })
      setTimes(now)
    }
    tick()
    const id = setInterval(tick, 1000)
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
          const { time = '', day = '' } = times[c.name] || {}
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
  const adjust = (delta) => { setSecs(s => Math.max(60, s + delta * 60)) }
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

      <div className="flex gap-2 justify-center">
        <button onClick={() => adjust(-5)} className="btn-ghost px-3" title="−5 min">−5</button>
        <button onClick={() => adjust(5)} className="btn-ghost px-3" title="+5 min">+5</button>
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

// ─── Colour Palette Picker ───────────────────────────────────────────────────
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255
  const max = Math.max(r,g,b), min = Math.min(r,g,b), l = (max+min)/2
  if (max === min) return [0, 0, Math.round(l*100)]
  const d = max-min, s = l>0.5 ? d/(2-max-min) : d/(max+min)
  let h = max===r ? (g-b)/d+(g<b?6:0) : max===g ? (b-r)/d+2 : (r-g)/d+4
  return [Math.round(h*60), Math.round(s*100), Math.round(l*100)]
}
function hslToHex(h,s,l) {
  s/=100; l/=100
  const a=s*Math.min(l,1-l), f=n=>{const k=(n+h/30)%12; return l-a*Math.max(Math.min(k-3,9-k,1),-1)}
  return '#'+[f(0),f(8),f(4)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('')
}
function ColourPicker() {
  const [hex, setHex] = useState('#2A7A6F')
  const [input, setInput] = useState('#2A7A6F')

  const apply = (v) => { if (/^#[0-9a-fA-F]{6}$/.test(v)) setHex(v) }
  const [h,s,l] = hexToHsl(hex)
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)

  const swatches = [
    { label: 'Base',          color: hex },
    { label: 'Complementary', color: hslToHex((h+180)%360,s,l) },
    { label: 'Analogous −',   color: hslToHex((h-30+360)%360,s,l) },
    { label: 'Analogous +',   color: hslToHex((h+30)%360,s,l) },
    { label: 'Triadic A',     color: hslToHex((h+120)%360,s,l) },
    { label: 'Triadic B',     color: hslToHex((h+240)%360,s,l) },
    { label: 'Lighter',       color: hslToHex(h,s,Math.min(l+20,95)) },
    { label: 'Darker',        color: hslToHex(h,s,Math.max(l-20,5)) },
    { label: 'Desaturated',   color: hslToHex(h,Math.max(s-40,0),l) },
  ]

  const [copied, setCopied] = useState('')
  const copy = (text) => { navigator.clipboard?.writeText(text); setCopied(text); setTimeout(()=>setCopied(''),1500) }

  return (
    <div className="card space-y-4">
      <p className="section-label">Colour Palette</p>
      <div className="flex gap-3 items-center">
        <input type="color" value={hex} onChange={e=>{setHex(e.target.value);setInput(e.target.value)}}
          style={{width:48,height:48,borderRadius:8,border:'1px solid var(--section-card-border)',cursor:'pointer',padding:2,background:'none'}} />
        <div className="flex-1">
          <input className="input" value={input} onChange={e=>{setInput(e.target.value);apply(e.target.value)}} placeholder="#rrggbb" />
          <p style={{fontFamily:'"DM Mono",monospace',fontSize:'0.58rem',color:'var(--section-muted)',marginTop:4}}>
            RGB {r} {g} {b} &nbsp;·&nbsp; HSL {h}° {s}% {l}%
          </p>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
        {swatches.map(sw=>(
          <button key={sw.label} onClick={()=>copy(sw.color)}
            style={{borderRadius:8,overflow:'hidden',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',background:'none'}}>
            <div style={{height:40,background:sw.color,position:'relative'}}>
              {copied===sw.color && <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.4)',fontSize:'0.7rem',color:'#fff'}}>Copied!</div>}
            </div>
            <div style={{padding:'4px 6px',background:'#161412'}}>
              <p style={{fontFamily:'"DM Mono",monospace',fontSize:'0.5rem',color:'#5C5650',letterSpacing:'0.06em'}}>{sw.label}</p>
              <p style={{fontFamily:'"DM Mono",monospace',fontSize:'0.65rem',color:'#9A9088'}}>{sw.color}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Regex Tester ─────────────────────────────────────────────────────────────
function RegexTester() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('g')
  const [text, setText] = useState('')

  const { parts, count, error } = (() => {
    if (!pattern || !text) return { parts: [{ t: text, m: false }], count: 0, error: null }
    try {
      const re = new RegExp(pattern, flags.includes('g') ? flags : flags+'g')
      const parts = [], matches = [...text.matchAll(re)]
      if (!matches.length) return { parts: [{ t: text, m: false }], count: 0, error: null }
      let i = 0
      matches.forEach(m => {
        if (m.index > i) parts.push({ t: text.slice(i, m.index), m: false })
        parts.push({ t: m[0], m: true })
        i = m.index + m[0].length
      })
      if (i < text.length) parts.push({ t: text.slice(i), m: false })
      return { parts, count: matches.length, error: null }
    } catch(e) { return { parts: [{ t: text, m: false }], count: 0, error: e.message } }
  })()

  return (
    <div className="card space-y-3">
      <p className="section-label">Regex Tester</p>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="section-label mb-1 block">Pattern</label>
          <input className="input" value={pattern} onChange={e=>setPattern(e.target.value)} placeholder="e.g. \d+" style={{fontFamily:'"DM Mono",monospace'}} />
        </div>
        <div style={{width:72}}>
          <label className="section-label mb-1 block">Flags</label>
          <input className="input" value={flags} onChange={e=>setFlags(e.target.value)} placeholder="gi" style={{fontFamily:'"DM Mono",monospace'}} />
        </div>
      </div>
      {error && <p style={{fontFamily:'"DM Mono",monospace',fontSize:'0.7rem',color:'#f87171'}}>{error}</p>}
      <div>
        <label className="section-label mb-1 block">Test String</label>
        <textarea className="input h-24 resize-none" value={text} onChange={e=>setText(e.target.value)} placeholder="Paste text to test…" style={{fontFamily:'"DM Mono",monospace',fontSize:'0.8rem'}} />
      </div>
      {text && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="section-label">Matches</label>
            <span style={{fontFamily:'"DM Mono",monospace',fontSize:'0.65rem',color:'var(--section-accent)'}}>{count} match{count!==1?'es':''}</span>
          </div>
          <div style={{background:'rgba(0,0,0,0.3)',borderRadius:8,padding:'10px 12px',fontFamily:'"DM Mono",monospace',fontSize:'0.8rem',lineHeight:1.6,wordBreak:'break-all'}}>
            {parts.map((p,i)=>p.m
              ? <mark key={i} style={{background:'color-mix(in srgb,var(--section-accent) 35%,transparent)',color:'#EDE8E0',borderRadius:3,padding:'0 2px'}}>{p.t}</mark>
              : <span key={i} style={{color:'#5C5650'}}>{p.t}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tip & Bill Splitter ──────────────────────────────────────────────────────
function BillSplitter() {
  const [bill, setBill] = useState('')
  const [tip, setTip] = useState(10)
  const [people, setPeople] = useState(2)
  const b = parseFloat(bill)||0
  const tipAmt = Math.round(b*tip/100*100)/100
  const total = b + tipAmt
  const perPerson = Math.round(total/Math.max(people,1)*100)/100
  return (
    <div className="card space-y-4">
      <p className="section-label">Tip & Bill Splitter</p>
      <div>
        <label className="section-label mb-1 block">Bill Amount ($)</label>
        <input className="input" type="number" min="0" step="0.01" placeholder="0.00" value={bill} onChange={e=>setBill(e.target.value)} />
      </div>
      <div>
        <div className="flex justify-between mb-2">
          <label className="section-label">Tip</label>
          <span style={{fontFamily:'"DM Mono",monospace',fontSize:'0.7rem',color:'var(--section-accent)'}}>{tip}%</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[0,5,10,15,18,20].map(t=>(
            <button key={t} onClick={()=>setTip(t)} className={`chip ${tip===t?'active':''}`}>{t}%</button>
          ))}
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-2">
          <label className="section-label">People</label>
          <div className="flex items-center gap-3">
            <button onClick={()=>setPeople(p=>Math.max(1,p-1))} className="btn-ghost px-2 py-0.5">−</button>
            <span style={{fontFamily:'"DM Mono",monospace',fontSize:'0.9rem',color:'#EDE8E0',minWidth:16,textAlign:'center'}}>{people}</span>
            <button onClick={()=>setPeople(p=>p+1)} className="btn-ghost px-2 py-0.5">+</button>
          </div>
        </div>
      </div>
      {b > 0 && (
        <div style={{background:'rgba(0,0,0,0.25)',borderRadius:10,padding:'14px 16px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,textAlign:'center'}}>
          {[['Tip',`$${tipAmt.toFixed(2)}`],['Total',`$${total.toFixed(2)}`],['Each',`$${perPerson.toFixed(2)}`]].map(([l,v])=>(
            <div key={l}>
              <p className="section-label mb-1">{l}</p>
              <p style={{fontFamily:'"Playfair Display",serif',fontStyle:'italic',fontSize:'1.3rem',fontWeight:600,color:'var(--section-accent)'}}>{v}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function CountdownTimer() {
  const [events, setEvents] = useState(() => {
    try { return JSON.parse(localStorage.getItem('s9_countdowns')||'[]') } catch { return [] }
  })
  const [label, setLabel] = useState('')
  const [date, setDate] = useState('')
  const [now, setNow] = useState(Date.now())

  useEffect(() => { const id = setInterval(()=>setNow(Date.now()),1000); return ()=>clearInterval(id) }, [])
  const save = (e) => { const next=[...e]; localStorage.setItem('s9_countdowns',JSON.stringify(next)); setEvents(next) }

  const add = () => {
    if (!label||!date) return
    save([...events,{id:Date.now(),label,date}])
    setLabel(''); setDate('')
  }
  const remove = (id) => save(events.filter(e=>e.id!==id))

  const diff = (dateStr) => {
    const ms = new Date(dateStr).getTime() - now
    if (ms<=0) return null
    const d=Math.floor(ms/86400000), h=Math.floor((ms%86400000)/3600000), m=Math.floor((ms%3600000)/60000), s=Math.floor((ms%60000)/1000)
    return {d,h,m,s}
  }

  return (
    <div className="card space-y-4">
      <p className="section-label">Countdown Timers</p>
      <div className="space-y-2">
        <input className="input" placeholder="Event name…" value={label} onChange={e=>setLabel(e.target.value)} />
        <div className="flex gap-2">
          <input className="input flex-1" type="date" value={date} onChange={e=>setDate(e.target.value)} />
          <button onClick={add} className="btn-primary px-4">Add</button>
        </div>
      </div>
      {events.length===0 && <p style={{fontFamily:'"DM Mono",monospace',fontSize:'0.65rem',color:'var(--section-muted)',textAlign:'center',padding:'12px 0'}}>No countdowns yet</p>}
      <div className="space-y-3">
        {events.map(ev=>{
          const t=diff(ev.date)
          return (
            <div key={ev.id} style={{background:'rgba(0,0,0,0.25)',borderRadius:10,padding:'12px 14px'}}>
              <div className="flex justify-between items-start mb-2">
                <p style={{fontSize:'0.85rem',color:'#EDE8E0',fontWeight:500}}>{ev.label}</p>
                <button onClick={()=>remove(ev.id)} style={{color:'#5C5650',background:'none',border:'none',cursor:'pointer',fontSize:'0.8rem'}}>✕</button>
              </div>
              {t ? (
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,textAlign:'center'}}>
                  {[['Days',t.d],['Hours',t.h],['Mins',t.m],['Secs',t.s]].map(([l,v])=>(
                    <div key={l} style={{background:'rgba(0,0,0,0.3)',borderRadius:6,padding:'6px 0'}}>
                      <p style={{fontFamily:'"Share Tech Mono","DM Mono",monospace',fontSize:'1.3rem',color:'var(--section-accent)',lineHeight:1}}>{String(v).padStart(2,'0')}</p>
                      <p style={{fontFamily:'"DM Mono",monospace',fontSize:'0.5rem',color:'var(--section-muted)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:2}}>{l}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{fontFamily:'"DM Mono",monospace',fontSize:'0.7rem',color:'#4ade80'}}>🎉 This day has arrived!</p>
              )}
              <p style={{fontFamily:'"DM Mono",monospace',fontSize:'0.55rem',color:'var(--section-muted)',marginTop:6}}>{new Date(ev.date).toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'})}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Pen Dose Calculator ──────────────────────────────────────────────────────
const PEN_PRESETS = [
  { id: 'custom',     label: 'Compounded (custom)', conc: '', clickVol: 0.05 },
  { id: 'mounjaro25', label: 'Mounjaro 2.5 mg',     conc: 4,    clickVol: 0.05 },
  { id: 'mounjaro5',  label: 'Mounjaro 5 mg',        conc: 8,    clickVol: 0.05 },
  { id: 'mounjaro75', label: 'Mounjaro 7.5 mg',      conc: 12,   clickVol: 0.05 },
  { id: 'mounjaro10', label: 'Mounjaro 10 mg',       conc: 16,   clickVol: 0.05 },
  { id: 'mounjaro125',label: 'Mounjaro 12.5 mg',     conc: 20,   clickVol: 0.05 },
  { id: 'mounjaro15', label: 'Mounjaro 15 mg',       conc: 24,   clickVol: 0.05 },
  { id: 'ozempic025', label: 'Ozempic 0.25 mg',      conc: 1.34, clickVol: 0.05 },
  { id: 'ozempic05',  label: 'Ozempic 0.5 mg',       conc: 1.34, clickVol: 0.05 },
  { id: 'ozempic1',   label: 'Ozempic 1 mg',         conc: 1.34, clickVol: 0.05 },
  { id: 'ozempic2',   label: 'Ozempic 2 mg',         conc: 2.68, clickVol: 0.05 },
]

function PenCalculator() {
  const [preset, setPreset] = useState('custom')
  const [conc, setConc] = useState('')       // mg/mL
  const [dose, setDose] = useState('')       // mg desired
  const [clickVol, setClickVol] = useState('0.05') // mL per click

  const p = PEN_PRESETS.find(x=>x.id===preset)
  const effConc = preset==='custom' ? parseFloat(conc) : p.conc
  const effClick = preset==='custom' ? parseFloat(clickVol) : p.clickVol

  const doseNum = parseFloat(dose)
  const clicks = (effConc && effClick && doseNum)
    ? Math.round(doseNum / effConc / effClick)
    : null
  const volMl = clicks ? Math.round(clicks * effClick * 1000)/1000 : null

  return (
    <div className="card space-y-4">
      <div>
        <p className="section-label mb-1">Pen / Dose Calculator</p>
        <p style={{fontFamily:'"DM Mono",monospace',fontSize:'0.58rem',color:'#f87171',lineHeight:1.5}}>
          ⚠ For reference only — always confirm doses with your prescriber or pharmacist.
        </p>
      </div>

      <div>
        <label className="section-label mb-1 block">Pen Type</label>
        <select className="input" value={preset} onChange={e=>setPreset(e.target.value)}>
          {PEN_PRESETS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>

      {preset==='custom' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="section-label mb-1 block">Concentration (mg/mL)</label>
            <input className="input" type="number" min="0" step="0.1" placeholder="e.g. 5" value={conc} onChange={e=>setConc(e.target.value)} />
          </div>
          <div>
            <label className="section-label mb-1 block">mL per click</label>
            <input className="input" type="number" min="0" step="0.01" placeholder="0.05" value={clickVol} onChange={e=>setClickVol(e.target.value)} />
          </div>
        </div>
      )}

      {preset!=='custom' && (
        <div style={{background:'rgba(0,0,0,0.2)',borderRadius:8,padding:'8px 12px',display:'flex',gap:16}}>
          <div><p className="section-label">Concentration</p><p style={{fontFamily:'"DM Mono",monospace',fontSize:'0.8rem',color:'var(--section-accent)'}}>{p.conc} mg/mL</p></div>
          <div><p className="section-label">Per click</p><p style={{fontFamily:'"DM Mono",monospace',fontSize:'0.8rem',color:'var(--section-accent)'}}>{p.clickVol} mL</p></div>
        </div>
      )}

      <div>
        <label className="section-label mb-1 block">Desired Dose (mg)</label>
        <input className="input" type="number" min="0" step="0.25" placeholder="e.g. 2.5" value={dose} onChange={e=>setDose(e.target.value)} />
      </div>

      {clicks !== null && (
        <div style={{background:'rgba(0,0,0,0.3)',borderRadius:10,padding:'16px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,textAlign:'center'}}>
          <div>
            <p className="section-label mb-1">Clicks</p>
            <p style={{fontFamily:'"Playfair Display",serif',fontStyle:'italic',fontSize:'2.5rem',fontWeight:600,color:'var(--section-accent)',lineHeight:1}}>{clicks}</p>
          </div>
          <div>
            <p className="section-label mb-1">Volume</p>
            <p style={{fontFamily:'"Playfair Display",serif',fontStyle:'italic',fontSize:'2.5rem',fontWeight:600,color:'var(--section-accent)',lineHeight:1}}>{volMl}<span style={{fontSize:'1rem'}}> mL</span></p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const TOOLS = [
  { id: 'clocks',     label: 'World Clocks',        icon: '🕰',  desc: 'Orlando · Tokyo · New York' },
  { id: 'calc',       label: 'GRAV-7 Calculator',   icon: '🖩',  desc: 'Calculator + GST' },
  { id: 'pomodoro',   label: 'Pomodoro',             icon: '🍅',  desc: 'Focus & break timer' },
  { id: 'units',      label: 'Unit Converter',       icon: '📐',  desc: 'Length · Weight · Temp' },
  { id: 'qr',         label: 'QR Generator',         icon: '📱',  desc: 'URL to QR code' },
  { id: 'colour',     label: 'Colour Palette',       icon: '🎨',  desc: 'Swatches from any hex colour' },
  { id: 'regex',      label: 'Regex Tester',         icon: '🔍',  desc: 'Live pattern matching' },
  { id: 'bill',       label: 'Tip & Bill Splitter',  icon: '🧾',  desc: 'Split bills with tip' },
  { id: 'countdown',  label: 'Countdown Timers',     icon: '⏳',  desc: 'Days to any event' },
  { id: 'pen',        label: 'Pen Dose Calculator',  icon: '💉',  desc: 'Mounjaro · Ozempic · Compounded' },
]

export default function Tools() {
  const [active, setActive] = useState(null)

  const tool = TOOLS.find(t => t.id === active)

  return (
    <SectionShell accent="#2A7A6F" bgImage={bgImg}>
      <div className="p-4 md:p-6 max-w-2xl">

        {/* Hub */}
        {!active && (
          <>
            <h1 className="section-title mb-6">Tools</h1>
            <div className="space-y-2">
              {TOOLS.map(t => (
                <button key={t.id} onClick={() => setActive(t.id)}
                  className="card w-full text-left flex items-center gap-4 hover:border-white/10 transition-all"
                  style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{t.icon}</span>
                  <div className="flex-1">
                    <p style={{ fontSize: '0.95rem', fontWeight: 500, color: '#EDE8E0' }}>{t.label}</p>
                    <p style={{ fontFamily: '"DM Mono",monospace', fontSize: '0.6rem', color: 'var(--section-muted)', marginTop: 2, letterSpacing: '0.05em' }}>{t.desc}</p>
                  </div>
                  <span style={{ color: 'var(--section-muted)', fontSize: '1rem' }}>›</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Active tool */}
        {active && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setActive(null)} className="btn-ghost px-3 py-1.5 text-sm">‹ Back</button>
              <h1 className="section-title" style={{ fontSize: '1.3rem' }}>{tool?.label}</h1>
            </div>
            {active === 'clocks'    && <WorldClocks />}
            {active === 'calc'      && <Calculator />}
            {active === 'pomodoro'  && <Pomodoro />}
            {active === 'units'     && <UnitConverter />}
            {active === 'qr'        && <QRGenerator />}
            {active === 'colour'    && <ColourPicker />}
            {active === 'regex'     && <RegexTester />}
            {active === 'bill'      && <BillSplitter />}
            {active === 'countdown' && <CountdownTimer />}
            {active === 'pen'       && <PenCalculator />}
          </>
        )}

      </div>
    </SectionShell>
  )
}

