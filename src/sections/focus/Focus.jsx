import { useState, useEffect, useCallback } from 'react'
import { Play, Square, RotateCcw } from 'lucide-react'
import SectionShell from '../../components/SectionShell'
import PageHeader from '../../components/PageHeader'
import HoloRings from '../../components/HoloRings'
import bgImg from '../../assets/art-abstract.jpg'

const FOCUS_KEY = 's9_focus_mode'

const MODES = [
  {
    id: 'creative',
    label: 'Deep Creative',
    desc: 'Uninterrupted creative flow — art, design, world-building.',
    emoji: '◎',
    color: '#C4522A',
    durationMin: 90,
    tip: 'No phone. No interruptions. Pure creation.',
  },
  {
    id: 'writing',
    label: 'Writing Sprint',
    desc: 'Focused word output — drafting, editing, structure.',
    emoji: '✍',
    color: '#7C3AED',
    durationMin: 45,
    tip: 'Words first. Edit later. Close social media.',
  },
  {
    id: 'admin',
    label: 'Admin Block',
    desc: 'Emails, invoices, logistics, planning tasks.',
    emoji: '⊡',
    color: '#3B82F6',
    durationMin: 30,
    tip: 'Batch it. Tick the list. Then get back to making.',
  },
  {
    id: 'market',
    label: 'Market Prep',
    desc: 'Sales copy, social content, pitches, promos.',
    emoji: '▷',
    color: '#3EC88A',
    durationMin: 45,
    tip: 'Audience first. What do they need to hear today?',
  },
  {
    id: 'rest',
    label: 'Rest & Recover',
    desc: 'Walk, stretch, breathe. Protect creative energy.',
    emoji: '◷',
    color: '#F09030',
    durationMin: 20,
    tip: 'Rest is part of the work. Permission granted.',
  },
]

function useTimer(durationMin) {
  const [secondsLeft, setSecondsLeft] = useState(durationMin * 60)
  const [running, setRunning] = useState(false)

  const reset = useCallback(() => {
    setRunning(false)
    setSecondsLeft(durationMin * 60)
  }, [durationMin])

  useEffect(() => { reset() }, [durationMin, reset])

  useEffect(() => {
    if (!running) return
    if (secondsLeft <= 0) { setRunning(false); return }
    const id = setInterval(() => setSecondsLeft(s => s - 1), 1000)
    return () => clearInterval(id)
  }, [running, secondsLeft])

  const h = Math.floor(secondsLeft / 3600)
  const m = Math.floor((secondsLeft % 3600) / 60)
  const s = secondsLeft % 60
  const display = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`

  const pct = 1 - secondsLeft / (durationMin * 60)

  return { display, running, pct, toggle: () => setRunning(r => !r), reset, done: secondsLeft === 0 }
}

// ── Mode card ─────────────────────────────────────────────────────────────
function ModeCard({ mode, active, onSelect, index }) {
  const delay = index * 0.06
  return (
    <button onClick={() => onSelect(mode)} style={{
      background: active ? `${mode.color}18` : 'rgba(14,12,11,0.8)',
      border: `0.5px solid ${active ? mode.color : `${mode.color}20`}`,
      borderRadius: 14, padding: '16px 14px',
      cursor: 'pointer', textAlign: 'left',
      animation: `phase-in 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
      transition: 'all 0.2s',
      clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{mode.emoji}</span>
        <div>
          <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: '0.95rem', color: active ? mode.color : '#C4A882', marginBottom: 2 }}>
            {mode.label}
          </p>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.4rem', color: '#5C5650', letterSpacing: '0.08em' }}>
            {mode.durationMin} MIN
          </p>
        </div>
        {active && (
          <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: mode.color, boxShadow: `0 0 8px ${mode.color}` }} />
        )}
      </div>
      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: '#5C5650', lineHeight: 1.6, letterSpacing: '0.04em' }}>
        {mode.desc}
      </p>
    </button>
  )
}

// ── Timer display ─────────────────────────────────────────────────────────
function TimerDisplay({ mode, timer }) {
  const r = 56, circ = 2 * Math.PI * r
  return (
    <div style={{
      marginBottom: 24, padding: '24px 16px', textAlign: 'center',
      background: `${mode.color}08`, border: `0.5px solid ${mode.color}25`, borderRadius: 16,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ring */}
      <svg width={144} height={144} style={{ transform: 'rotate(-90deg)', margin: '0 auto 16px', display: 'block' }}>
        <circle cx={72} cy={72} r={r} fill="none" stroke={`${mode.color}15`} strokeWidth={5} />
        <circle cx={72} cy={72} r={r} fill="none" stroke={mode.color}
          strokeWidth={5} strokeDasharray={circ}
          strokeDashoffset={circ * (1 - timer.pct)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease', filter: `drop-shadow(0 0 8px ${mode.color}80)` }} />
      </svg>

      {/* Time */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -62%)', textAlign: 'center' }}>
        <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 700, fontSize: '2rem', color: timer.done ? '#3EC88A' : mode.color, lineHeight: 1, textShadow: `0 0 30px ${mode.color}60` }}>
          {timer.done ? '✓' : timer.display}
        </p>
      </div>

      {/* Mode label + tip */}
      <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1rem', color: mode.color, marginBottom: 6 }}>{mode.label}</p>
      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.46rem', color: '#5C5650', letterSpacing: '0.08em', lineHeight: 1.6 }}>{mode.tip}</p>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
        <button onClick={timer.reset} style={{
          width: 40, height: 40, borderRadius: '50%', border: '0.5px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <RotateCcw size={16} color="#5C5650" />
        </button>
        <button onClick={timer.toggle} style={{
          width: 56, height: 56, borderRadius: '50%',
          border: `1.5px solid ${mode.color}80`,
          background: `${mode.color}20`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 20px ${mode.color}30`,
          transition: 'all 0.2s',
        }}>
          {timer.running ? <Square size={18} color={mode.color} fill={mode.color} /> : <Play size={18} color={mode.color} fill={mode.color} />}
        </button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function Focus() {
  const [activeMode, setActiveMode] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FOCUS_KEY))
      return MODES.find(m => m.id === saved?.id) || MODES[0]
    } catch { return MODES[0] }
  })
  const timer = useTimer(activeMode.durationMin)

  function selectMode(mode) {
    setActiveMode(mode)
    localStorage.setItem(FOCUS_KEY, JSON.stringify({ id: mode.id }))
  }

  const ACCENT = activeMode.color

  return (
    <SectionShell accent={ACCENT} bgImage={bgImg}>
      <PageHeader subtitle="FOCUS MODE" title="Focus" accent={ACCENT} />

      <div className="p-4 md:p-6 max-w-2xl">

        <TimerDisplay mode={activeMode} timer={timer} />

        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', color: '#3A3530', letterSpacing: '0.18em', marginBottom: 14 }}>SELECT MODE</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {MODES.map((mode, i) => (
            <ModeCard key={mode.id} mode={mode} active={activeMode.id === mode.id} onSelect={selectMode} index={i} />
          ))}
        </div>

        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.4rem', color: '#2A2520', letterSpacing: '0.12em', marginTop: 20, textAlign: 'center' }}>
          CURRENT MODE SAVED · SHOWS ON DASHBOARD
        </p>
      </div>
    </SectionShell>
  )
}
