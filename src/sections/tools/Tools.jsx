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

function WorldClocks() {
  const { times, temps } = useWorldData()
  return (
    <div className="card">
      <p className="section-label mb-3">World Clocks</p>
      <div className="grid grid-cols-3 gap-3">
        {CITIES.map(c => {
          const t = times[c.name] || ''
          const [day, time] = t.split(', ')
          return (
            <div key={c.name} className="text-center">
              <p className="section-label mb-1">{c.name}</p>
              <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.5rem', fontWeight: 600, color: 'var(--section-accent)', lineHeight: 1 }}>{time || '—'}</p>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: 'var(--section-muted)', marginTop: 2 }}>{day}</p>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: 'var(--section-label)', marginTop: 4 }}>
                {temps[c.name] !== undefined ? `${temps[c.name]}°C` : '—'}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Calculator ──────────────────────────────────────────────────────────────
function Calculator() {
  const [display, setDisplay] = useState('0')
  const [expr, setExpr] = useState('')
  const [gstMode, setGstMode] = useState(false)
  const [gstResult, setGstResult] = useState(null)

  const GST = 0.1

  const press = (val) => {
    if (val === 'C') { setDisplay('0'); setExpr(''); setGstResult(null); return }
    if (val === '⌫') {
      setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0')
      setGstResult(null)
      return
    }
    if (val === '=') {
      try {
        // eslint-disable-next-line no-new-func
        const result = Function('"use strict"; return (' + expr + display + ')')()
        const rounded = Math.round(result * 100) / 100
        if (gstMode) {
          const gst = Math.round(rounded * GST * 100) / 100
          setGstResult({ ex: rounded, gst, inc: Math.round((rounded + gst) * 100) / 100 })
        }
        setDisplay(String(rounded))
        setExpr('')
      } catch { setDisplay('Error') }
      return
    }
    if (['+', '-', '×', '÷'].includes(val)) {
      setExpr(expr + display + val.replace('×', '*').replace('÷', '/'))
      setDisplay('0')
      setGstResult(null)
      return
    }
    if (val === '.') {
      setDisplay(d => d.includes('.') ? d : d + '.')
      return
    }
    setDisplay(d => d === '0' ? val : d + val)
    setGstResult(null)
  }

  const BTN = [
    ['C', '⌫', '÷', '×'],
    ['7', '8', '9', '-'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '='],
    ['0', '.'],
  ]

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <p className="section-label">Calculator</p>
        <button onClick={() => { setGstMode(g => !g); setGstResult(null) }}
          className={`chip text-xs ${gstMode ? 'active' : ''}`}>GST 10%</button>
      </div>

      {/* Display */}
      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 14px', textAlign: 'right' }}>
        {expr && <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: 'var(--section-muted)', marginBottom: 2 }}>{expr}</p>}
        <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '2rem', fontWeight: 600, color: '#EDE8E0', lineHeight: 1 }}>{display}</p>
      </div>

      {/* GST breakdown */}
      {gstResult && (
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between' }}>
          {[['Ex GST', gstResult.ex], ['GST', gstResult.gst], ['Inc GST', gstResult.inc]].map(([l, v]) => (
            <div key={l} className="text-center">
              <p className="section-label">{l}</p>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.85rem', color: 'var(--section-accent)', fontWeight: 500 }}>${v.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Buttons */}
      <div className="space-y-1.5">
        {BTN.map((row, i) => (
          <div key={i} className="grid gap-1.5" style={{ gridTemplateColumns: row.length === 2 ? '2fr 1fr 1fr' : 'repeat(4, 1fr)' }}>
            {row.map(b => (
              <button key={b} onClick={() => press(b)}
                style={{
                  padding: '12px 0', borderRadius: 8, fontFamily: '"DM Mono", monospace',
                  fontSize: b === '=' ? '1.1rem' : '0.9rem', fontWeight: 500, cursor: 'pointer',
                  background: b === '=' ? 'var(--section-accent)' : ['+','-','×','÷'].includes(b) ? 'color-mix(in srgb, var(--section-accent) 20%, #1F1C19)' : b === 'C' ? 'rgba(220,38,38,0.15)' : '#1F1C19',
                  color: b === '=' ? '#fff' : ['+','-','×','÷'].includes(b) ? 'var(--section-accent)' : b === 'C' ? '#f87171' : '#EDE8E0',
                  border: '0.5px solid var(--section-card-border)',
                  gridColumn: row.length === 2 && b === '0' ? 'span 2' : undefined,
                }}>
                {b}
              </button>
            ))}
          </div>
        ))}
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
