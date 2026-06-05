import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import SectionShell from '../../components/SectionShell'
import bgImg from '../../assets/art-architectural.jpg'

// ─── World Clocks ────────────────────────────────────────────────────────────
const CITIES = [
  { name: 'Orlando',     tz: 'America/New_York',    lat: 28.54,  lon: -81.38 },
  { name: 'Tokyo',       tz: 'Asia/Tokyo',           lat: 35.68,  lon: 139.69 },
  { name: 'Los Angeles', tz: 'America/Los_Angeles',  lat: 34.05,  lon: -118.24 },
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
      <p style={{ fontFamily: '"DM Mono",monospace', fontSize: '0.58rem', color: '#A09890', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{city}</p>

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

// ─── CALC 7.09 Calculator ────────────────────────────────────────────────────
const CYAN = '#00BFFF'
const CYAN_DIM = '#0077A8'
const CYAN_GLOW = 'rgba(0,191,255,0.55)'
const BTN_BG = '#1a1d22'
const BTN_DARK = '#13151a'

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
    if (key === 'AC')   { setDisplay('0'); setExpr(''); setSubExpr(''); setGstBreak(null); setHasResult(false); return }
    if (key === 'DEL')  { if (hasResult) { setDisplay('0'); setHasResult(false) } else setDisplay(d => d.length > 1 ? d.slice(0,-1) : '0'); return }
    if (key === 'SHIFT'){ setShift(s => !s); return }
    if (key === 'FUNC') {
      const v = numVal()
      if (v !== 0) { const gst = Math.round(v/11*100)/100; setGstBreak({ inc: v, gst, ex: Math.round((v-gst)*100)/100 }) }
      else setGstBreak(null); return
    }
    if (key === 'MC')   { setMemory(0); return }
    if (key === 'MR')   { setDisplay(String(memory)); setHasResult(true); return }
    if (key === 'M+')   { setMemory(m => m + numVal()); return }
    if (key === 'M-')   { setMemory(m => m - numVal()); return }
    if (key === 'MEM')  { setM1(numVal()); return }
    if (key === 'HIST') { setM2(numVal()); return }
    if (key === 'EQ')   { setM3(numVal()); return }
    if (key === '%')    { const v=numVal(), base=expr?parseFloat(expr)||100:100; setDisplay(String(Math.round(v/100*base*1e10)/1e10)); setHasResult(true); return }
    if (['+','-','×','÷'].includes(key)) {
      const op = key.replace('×','*').replace('÷','/')
      setSubExpr(display+' '+key); setExpr(display+op); setDisplay('0'); setHasResult(false); setGstBreak(null); return
    }
    if (key === '=') {
      if (!expr) return
      try {
        // eslint-disable-next-line no-new-func
        const r = Function('"use strict";return('+expr+display+')')()
        if (!isFinite(r)) { setDisplay('Error'); setExpr(''); setSubExpr(''); return }
        const rounded = Math.round(r*1e10)/1e10
        setSubExpr(subExpr+' '+display+' =')
        setDisplay(String(rounded)); setExpr(''); setHasResult(true); setGstBreak(null)
      } catch { setDisplay('Error'); setExpr(''); setSubExpr('') }
      return
    }
    if (key === '.')  { if (hasResult) { setDisplay('0.'); setHasResult(false) } else setDisplay(d => d.includes('.')?d:d+'.'); return }
    if (key === '00') { if (hasResult) { setDisplay('0'); setHasResult(false) } else setDisplay(d => d==='0'?'0':d+'00'); return }
    if (key === '+/-') { setDisplay(d => d.startsWith('-') ? d.slice(1) : d==='0' ? '0' : '-'+d); return }
    if (hasResult) { setDisplay(key); setHasResult(false) } else setDisplay(d => d==='0'?key:d.length>=12?d:d+key)
    setGstBreak(null)
  }

  const fmt = (n) => {
    if (n==='Error') return n
    const [int, dec] = n.split('.')
    try { return parseInt(int,10).toLocaleString()+(dec!==undefined?'.'+dec:'') } catch { return n }
  }

  // ── Button style factory ──
  const bStyle = (t) => ({
    cursor: 'pointer',
    border: 'none',
    borderRadius: 10,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    fontFamily: '"Share Tech Mono","DM Mono",monospace',
    letterSpacing: '0.04em',
    transition: 'filter 0.08s, transform 0.08s',
    userSelect: 'none',
    // 3-D push effect: bright top edge, dark shadow underneath
    ...(t === 'blue' ? {
      background: 'linear-gradient(180deg, #005f7a 0%, #003d52 100%)',
      color: CYAN,
      boxShadow: `0 1px 0 rgba(255,255,255,0.12) inset, 0 3px 0 #001a22, 0 4px 8px rgba(0,0,0,0.6)`,
      border: `1px solid ${CYAN_DIM}`,
      textShadow: `0 0 8px ${CYAN_GLOW}`,
    } : t === 'fn' ? {
      background: 'linear-gradient(180deg, #1e2228 0%, #15181c 100%)',
      color: '#5a8a9a',
      boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset, 0 3px 0 #0a0c0f, 0 4px 8px rgba(0,0,0,0.5)',
    } : t === 'shift' ? {
      background: shift ? `linear-gradient(180deg,${CYAN},#007a9a)` : 'linear-gradient(180deg,#003545,#001e28)',
      color: shift ? '#000' : CYAN,
      boxShadow: shift
        ? `0 1px 0 rgba(255,255,255,0.3) inset, 0 3px 0 #003344, 0 0 14px ${CYAN_GLOW}`
        : `0 1px 0 rgba(255,255,255,0.08) inset, 0 3px 0 #000e14, 0 4px 8px rgba(0,0,0,0.6)`,
      border: `1px solid ${shift ? CYAN : CYAN_DIM}`,
      textShadow: shift ? 'none' : `0 0 6px ${CYAN_GLOW}`,
    } : {
      background: 'linear-gradient(180deg, #22262c 0%, #181b1f 100%)',
      color: '#d8e8f0',
      boxShadow: '0 1px 0 rgba(255,255,255,0.08) inset, 0 3px 0 #0a0c0f, 0 4px 8px rgba(0,0,0,0.5)',
    }),
  })

  const B = ({ k, sub, t='num', rs, cs, fs }) => (
    <button
      onPointerDown={e => { e.currentTarget.style.transform='translateY(2px)'; e.currentTarget.style.filter='brightness(0.85)' }}
      onPointerUp={e => { e.currentTarget.style.transform=''; e.currentTarget.style.filter=''; press(k) }}
      onPointerLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.filter='' }}
      style={{ ...bStyle(t), gridRow: rs, gridColumn: cs, fontSize: fs || (t==='fn'?'0.62rem':'0.95rem') }}>
      <span style={{ lineHeight:1 }}>{k}</span>
      {sub && <span style={{ fontSize:'0.45rem', marginTop:2, opacity:0.6, letterSpacing:'0.1em' }}>{sub}</span>}
    </button>
  )

  // corner bracket decoration for display
  const Corner = ({ pos }) => {
    const sz = 10, thick = 1.5
    const s = { position:'absolute', width:sz, height:sz }
    const line = { position:'absolute', background:CYAN_DIM }
    const top=pos.includes('t'), left=pos.includes('l')
    return (
      <div style={{ ...s, ...(top?{top:0}:{bottom:0}), ...(left?{left:0}:{right:0}) }}>
        <div style={{ ...line, top:0, left:0, right:0, height:thick }} />
        <div style={{ ...line, top:0, bottom:0, ...(left?{left:0}:{right:0}), width:thick }} />
      </div>
    )
  }

  return (
    <div style={{
      background: 'linear-gradient(160deg,#111318 0%,#0c0e12 100%)',
      borderRadius: 20,
      padding: '14px 12px 18px',
      border: '1px solid #2a2e36',
      boxShadow: '0 0 0 1px #070809, 0 24px 60px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.04)',
      maxWidth: 360,
      margin: '0 auto',
      userSelect: 'none',
    }}>

      {/* ── HUD top bar ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, padding:'0 2px' }}>
        <span style={{ fontFamily:'"Share Tech Mono",monospace', fontSize:'0.65rem', color:CYAN, letterSpacing:'0.18em', textShadow:`0 0 8px ${CYAN_GLOW}` }}>CALC 7.09</span>
        <div style={{ flex:1, height:1, background:`linear-gradient(90deg, ${CYAN_DIM}00, ${CYAN_DIM}80, ${CYAN_DIM}00)`, margin:'0 10px' }} />
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ fontFamily:'"Share Tech Mono",monospace', fontSize:'0.55rem', color:CYAN_DIM }}>100%</span>
          <div style={{ width:22, height:10, border:`1px solid ${CYAN_DIM}`, borderRadius:3, padding:'1px 2px', position:'relative' }}>
            <div style={{ width:'90%', height:'100%', background:`linear-gradient(90deg,${CYAN},#0088aa)`, borderRadius:2 }} />
            <div style={{ position:'absolute', right:-4, top:'50%', transform:'translateY(-50%)', width:3, height:5, background:CYAN_DIM, borderRadius:'0 1px 1px 0' }} />
          </div>
        </div>
      </div>

      {/* ── Display panel ── */}
      <div style={{
        background:'#060810',
        borderRadius:10,
        padding:'10px 12px 12px',
        marginBottom:12,
        border:`1px solid #1a1e28`,
        boxShadow:`inset 0 3px 16px rgba(0,0,0,0.95), 0 0 0 1px #050608`,
        position:'relative',
      }}>
        <Corner pos="tl"/><Corner pos="tr"/><Corner pos="bl"/><Corner pos="br"/>

        {/* DEG + MODE row */}
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <span style={{ fontFamily:'"Share Tech Mono",monospace', fontSize:'0.55rem', color:CYAN, letterSpacing:'0.12em' }}>DEG</span>
            {memory!==0 && <span style={{ fontFamily:'"Share Tech Mono",monospace', fontSize:'0.5rem', color:CYAN, letterSpacing:'0.08em', textShadow:`0 0 6px ${CYAN_GLOW}` }}>M</span>}
          </div>
          <span style={{ fontFamily:'"Share Tech Mono",monospace', fontSize:'0.55rem', color:CYAN_DIM, letterSpacing:'0.1em' }}>
            {gstBreak ? 'GST MODE' : 'GRAVITY MODE'}
          </span>
        </div>

        {/* Sub-expression */}
        <div style={{ textAlign:'right', minHeight:13, marginBottom:4 }}>
          <span style={{ fontFamily:'"Share Tech Mono",monospace', fontSize:'0.58rem', color:CYAN_DIM, opacity:0.7 }}>{subExpr}</span>
        </div>

        {/* Main number */}
        <div style={{ textAlign:'right', minHeight:48 }}>
          <span style={{
            fontFamily:'"Share Tech Mono",monospace',
            fontSize: display.length>12?'1.3rem':display.length>9?'1.7rem':display.length>6?'2rem':'2.6rem',
            color: CYAN,
            textShadow:`0 0 12px ${CYAN_GLOW}, 0 0 30px ${CYAN}44`,
            letterSpacing:'0.06em',
            lineHeight:1,
          }}>{fmt(display)}</span>
        </div>

        {/* HISTORY divider */}
        <div style={{ display:'flex', alignItems:'center', gap:6, margin:'8px 0 4px' }}>
          <div style={{ flex:1, height:1, background:`${CYAN_DIM}30` }} />
          <span style={{ fontFamily:'"Share Tech Mono",monospace', fontSize:'0.45rem', color:`${CYAN_DIM}80`, letterSpacing:'0.2em' }}>HISTORY</span>
          <div style={{ flex:1, height:1, background:`${CYAN_DIM}30` }} />
        </div>

        {/* GST breakdown or M-slot recall */}
        {gstBreak ? (
          <div style={{ display:'flex', justifyContent:'space-around' }}>
            {[['EX GST',gstBreak.ex],['GST',gstBreak.gst],['INC GST',gstBreak.inc]].map(([l,v])=>(
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'"Share Tech Mono",monospace', fontSize:'0.42rem', color:CYAN_DIM, letterSpacing:'0.1em' }}>{l}</div>
                <div style={{ fontFamily:'"Share Tech Mono",monospace', fontSize:'0.8rem', color:CYAN, textShadow:`0 0 8px ${CYAN_GLOW}` }}>${v.toFixed(2)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display:'flex', gap:12 }}>
            {[['M1',m1],['M2',m2],['M3',m3]].map(([l,v])=>(
              <button key={l} onClick={() => v!==null && (setDisplay(String(v)),setHasResult(true))}
                style={{ fontFamily:'"Share Tech Mono",monospace', fontSize:'0.48rem', color:v!==null?CYAN:`${CYAN_DIM}40`, background:'none', border:'none', cursor:v!==null?'pointer':'default', padding:0, letterSpacing:'0.08em' }}>
                {l}{v!==null?`·${v}`:''}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Button grid — 5 cols × 6 rows ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gridTemplateRows:'36px repeat(5,50px)', gap:6 }}>

        {/* Row 1 — function */}
        <B k="MEM"  sub="M1" t="fn" rs={1} cs={1} />
        <B k="HIST" sub="M2" t="fn" rs={1} cs={2} />
        <B k="EQ"   sub="M3" t="fn" rs={1} cs={3} />
        <B k="FUNC"          t="fn" rs={1} cs={4} />
        <B k="SHIFT"         t="shift" rs={1} cs={5} />

        {/* Row 2 — memory + AC */}
        <B k="MC"  t="fn"   rs={2} cs={1} />
        <B k="MR"  t="fn"   rs={2} cs={2} />
        <B k="M-"  t="fn"   rs={2} cs={3} />
        <B k="M+"  t="fn"   rs={2} cs={4} />
        <B k="AC"  t="blue" rs={2} cs={5} />

        {/* Row 3 — 7 8 9 % ÷ */}
        <B k="7" rs={3} cs={1} />
        <B k="8" rs={3} cs={2} />
        <B k="9" rs={3} cs={3} />
        <B k="%" t="blue" rs={3} cs={4} />
        <B k="÷" t="blue" rs={3} cs={5} />

        {/* Row 4 — 4 5 6 × DEL */}
        <B k="4" rs={4} cs={1} />
        <B k="5" rs={4} cs={2} />
        <B k="6" rs={4} cs={3} />
        <B k="×" t="blue" rs={4} cs={4} />
        <B k="DEL" t="blue" rs={4} cs={5} />

        {/* Row 5 — 1 2 3 + = (tall) */}
        <B k="1" rs={5} cs={1} />
        <B k="2" rs={5} cs={2} />
        <B k="3" rs={5} cs={3} />
        <B k="+" t="blue" rs={5} cs={4} />
        <B k="=" t="blue" rs="5 / span 2" cs={5} fs="1.5rem" />

        {/* Row 6 — +/- 0 00 . */}
        <B k="+/-" rs={6} cs={1} fs="0.7rem" />
        <B k="0"   rs={6} cs={2} />
        <B k="00"  rs={6} cs={3} fs="0.8rem" />
        <B k="."   rs={6} cs={4} />
        {/* col 5 row 6 is occupied by tall = */}
      </div>

      {/* ── Footer ── */}
      <div style={{ textAlign:'center', marginTop:10 }}>
        <div style={{ height:1, background:`linear-gradient(90deg,transparent,${CYAN_DIM}40,transparent)`, marginBottom:6 }} />
        <span style={{ fontFamily:'"Share Tech Mono",monospace', fontSize:'0.42rem', color:`${CYAN_DIM}60`, letterSpacing:'0.2em' }}>
          POWERED BY QUANTUM CORE
        </span>
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

// ─── Maps & Directions ────────────────────────────────────────────────────────
function MapsSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const debounceRef = useRef()

  const search = (q) => {
    setQuery(q)
    clearTimeout(debounceRef.current)
    if (!q.trim()) { setResults([]); setSelected(null); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true); setError('')
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'Signal9Planner/1.0' } }
        )
        const data = await res.json()
        setResults(data)
        if (!data.length) setError('No results found')
      } catch { setError('Search failed — check connection') }
      setLoading(false)
    }, 500)
  }

  const openDirections = (place, app) => {
    const lat = place.lat, lon = place.lon
    const name = encodeURIComponent(place.display_name)
    const url = app === 'apple'
      ? `maps://maps.apple.com/?daddr=${lat},${lon}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
    window.open(url, '_blank')
  }

  const openMap = (place) => {
    window.open(`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=15/${place.lat}/${place.lon}`, '_blank')
  }

  const shortAddress = (r) => {
    const a = r.address || {}
    const parts = [a.road, a.suburb || a.neighbourhood, a.city || a.town || a.village, a.state, a.country].filter(Boolean)
    return parts.slice(0, 3).join(', ')
  }

  return (
    <div className="card space-y-4">
      <p className="section-label">Maps & Directions</p>

      {/* Search box */}
      <div style={{ position: 'relative' }}>
        <input
          className="input"
          placeholder="Search for a place…"
          value={query}
          onChange={e => { setSelected(null); search(e.target.value) }}
          onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300)}
        />
        {loading && (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontFamily: '"DM Mono",monospace', fontSize: '0.6rem', color: 'var(--section-muted)' }}>searching…</span>
        )}
      </div>

      {error && !loading && <p style={{ fontFamily: '"DM Mono",monospace', fontSize: '0.65rem', color: 'var(--section-muted)', textAlign: 'center' }}>{error}</p>}

      {/* Results list */}
      {!selected && results.length > 0 && (
        <div className="space-y-2">
          {results.map((r, i) => (
            <button key={i} onClick={() => { setSelected(r); setResults([]) }}
              className="card w-full text-left"
              style={{ padding: '10px 12px' }}>
              <p style={{ fontSize: '0.85rem', color: '#EDE8E0', fontWeight: 500, lineHeight: 1.3 }}>
                {r.address?.amenity || r.address?.road || r.name || r.display_name.split(',')[0]}
              </p>
              <p style={{ fontFamily: '"DM Mono",monospace', fontSize: '0.58rem', color: 'var(--section-muted)', marginTop: 3 }}>
                {shortAddress(r)}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Selected place detail */}
      {selected && (
        <div className="space-y-3">
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '14px' }}>
            <p style={{ fontSize: '0.9rem', color: '#EDE8E0', fontWeight: 500, marginBottom: 4 }}>
              {selected.address?.amenity || selected.address?.road || selected.name || selected.display_name.split(',')[0]}
            </p>
            <p style={{ fontFamily: '"DM Mono",monospace', fontSize: '0.6rem', color: 'var(--section-muted)', lineHeight: 1.6 }}>
              {selected.display_name}
            </p>
            <p style={{ fontFamily: '"DM Mono",monospace', fontSize: '0.55rem', color: 'var(--section-muted)', marginTop: 6, opacity: 0.6 }}>
              {parseFloat(selected.lat).toFixed(5)}, {parseFloat(selected.lon).toFixed(5)}
            </p>
          </div>

          {/* Direction buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => openDirections(selected, 'apple')} className="btn-primary justify-center text-sm">
              🍎 Apple Maps
            </button>
            <button onClick={() => openDirections(selected, 'google')} className="btn-ghost justify-center text-sm">
              🗺 Google Maps
            </button>
          </div>
          <button onClick={() => openMap(selected)} className="btn-ghost w-full justify-center text-xs">
            View on OpenStreetMap
          </button>
          <button onClick={() => { setSelected(null); setQuery('') }} className="btn-ghost w-full justify-center text-xs">
            ← New search
          </button>
        </div>
      )}
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
              <p style={{fontFamily:'"DM Mono",monospace',fontSize:'0.5rem',color:'#A09890',letterSpacing:'0.06em'}}>{sw.label}</p>
              <p style={{fontFamily:'"DM Mono",monospace',fontSize:'0.65rem',color:'#C8BFB5'}}>{sw.color}</p>
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
              : <span key={i} style={{color:'#A09890'}}>{p.t}</span>
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
                <button onClick={()=>remove(ev.id)} style={{color:'#A09890',background:'none',border:'none',cursor:'pointer',fontSize:'0.8rem'}}>✕</button>
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
  const [conc, setConc] = useState('')
  const [clickVol, setClickVol] = useState('0.05')
  const [mode, setMode] = useState('dose') // 'dose' → give mg, get clicks | 'clicks' → give clicks, get mg
  const [dose, setDose] = useState('')
  const [clicksIn, setClicksIn] = useState('')

  const p = PEN_PRESETS.find(x=>x.id===preset)
  const effConc = preset==='custom' ? parseFloat(conc) : p.conc
  const effClick = preset==='custom' ? parseFloat(clickVol) : p.clickVol

  // dose → clicks
  const doseNum = parseFloat(dose)
  const clicksOut = (effConc && effClick && doseNum)
    ? Math.round(doseNum / effConc / effClick) : null
  const volFromDose = clicksOut ? Math.round(clicksOut * effClick * 1000)/1000 : null

  // clicks → dose
  const clicksNum = parseFloat(clicksIn)
  const doseOut = (effConc && effClick && clicksNum)
    ? Math.round(clicksNum * effClick * effConc * 1000)/1000 : null
  const volFromClicks = (effClick && clicksNum)
    ? Math.round(clicksNum * effClick * 1000)/1000 : null

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

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button onClick={()=>setMode('dose')} className={`chip flex-1 justify-center ${mode==='dose'?'active':''}`}>mg → clicks</button>
        <button onClick={()=>setMode('clicks')} className={`chip flex-1 justify-center ${mode==='clicks'?'active':''}`}>clicks → mg</button>
      </div>

      {mode==='dose' && (
        <>
          <div>
            <label className="section-label mb-1 block">Desired Dose (mg)</label>
            <input className="input" type="number" min="0" step="0.25" placeholder="e.g. 2.5" value={dose} onChange={e=>setDose(e.target.value)} />
          </div>
          {clicksOut !== null && (
            <div style={{background:'rgba(0,0,0,0.3)',borderRadius:10,padding:'16px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,textAlign:'center'}}>
              <div>
                <p className="section-label mb-1">Clicks</p>
                <p style={{fontFamily:'"Playfair Display",serif',fontStyle:'italic',fontSize:'2.5rem',fontWeight:600,color:'var(--section-accent)',lineHeight:1}}>{clicksOut}</p>
              </div>
              <div>
                <p className="section-label mb-1">Volume</p>
                <p style={{fontFamily:'"Playfair Display",serif',fontStyle:'italic',fontSize:'2.5rem',fontWeight:600,color:'var(--section-accent)',lineHeight:1}}>{volFromDose}<span style={{fontSize:'1rem'}}> mL</span></p>
              </div>
            </div>
          )}
        </>
      )}

      {mode==='clicks' && (
        <>
          <div>
            <label className="section-label mb-1 block">Number of Clicks</label>
            <input className="input" type="number" min="0" step="1" placeholder="e.g. 10" value={clicksIn} onChange={e=>setClicksIn(e.target.value)} />
          </div>
          {doseOut !== null && (
            <div style={{background:'rgba(0,0,0,0.3)',borderRadius:10,padding:'16px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,textAlign:'center'}}>
              <div>
                <p className="section-label mb-1">Dose</p>
                <p style={{fontFamily:'"Playfair Display",serif',fontStyle:'italic',fontSize:'2.5rem',fontWeight:600,color:'var(--section-accent)',lineHeight:1}}>{doseOut}<span style={{fontSize:'1rem'}}> mg</span></p>
              </div>
              <div>
                <p className="section-label mb-1">Volume</p>
                <p style={{fontFamily:'"Playfair Display",serif',fontStyle:'italic',fontSize:'2.5rem',fontWeight:600,color:'var(--section-accent)',lineHeight:1}}>{volFromClicks}<span style={{fontSize:'1rem'}}> mL</span></p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const TOOLS = [
  { id: 'clocks',     label: 'World Clocks',        icon: '🕰',  desc: 'Orlando · Tokyo · New York' },
  { id: 'calc',       label: 'CALC 7.09',            icon: '🖩',  desc: 'Calculator + GST' },
  { id: 'pomodoro',   label: 'Pomodoro',             icon: '🍅',  desc: 'Focus & break timer' },
  { id: 'units',      label: 'Unit Converter',       icon: '📐',  desc: 'Length · Weight · Temp' },
  { id: 'qr',         label: 'QR Generator',         icon: '📱',  desc: 'URL to QR code' },
  { id: 'colour',     label: 'Colour Palette',       icon: '🎨',  desc: 'Swatches from any hex colour' },
  { id: 'regex',      label: 'Regex Tester',         icon: '🔍',  desc: 'Live pattern matching' },
  { id: 'bill',       label: 'Tip & Bill Splitter',  icon: '🧾',  desc: 'Split bills with tip' },
  { id: 'countdown',  label: 'Countdown Timers',     icon: '⏳',  desc: 'Days to any event' },
  { id: 'pen',        label: 'Pen Dose Calculator',  icon: '💉',  desc: 'Mounjaro · Ozempic · Compounded' },
  { id: 'maps',       label: 'Maps & Directions',    icon: '📍',  desc: 'Search locations, get directions' },
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {TOOLS.map(t => (
                <button key={t.id} onClick={() => setActive(t.id)}
                  className="card text-left flex flex-col gap-2 hover:border-white/10 transition-all"
                  style={{ padding: '16px 14px' }}>
                  <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{t.icon}</span>
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#EDE8E0', lineHeight: 1.3 }}>{t.label}</p>
                    <p style={{ fontFamily: '"DM Mono",monospace', fontSize: '0.55rem', color: 'var(--section-muted)', marginTop: 3, letterSpacing: '0.04em' }}>{t.desc}</p>
                  </div>
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
            {active === 'maps'      && <MapsSearch />}
          </>
        )}

      </div>
    </SectionShell>
  )
}

