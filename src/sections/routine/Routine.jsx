import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Plus, GripVertical, Trash2, Check } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import SectionShell from '../../components/SectionShell'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import bgImg from '../../assets/art-newyork.jpg'

const ACCENT = '#F5C842'
const today = () => format(new Date(), 'yyyy-MM-dd')

const EMOJI_OPTIONS = ['☀', '🧘', '💧', '📖', '✍', '🏃', '🍵', '🎯', '🧠', '⚡', '◉', '✦', '▷', '◎', '◷']

// ── Circular progress ──────────────────────────────────────────────────────
function RoutineProgress({ done, total }) {
  if (total === 0) return null
  const pct = Math.round((done / total) * 100)
  const r = 40, circ = 2 * Math.PI * r
  const offset = circ * (1 - done / total)
  const color = pct === 100 ? '#3EC88A' : ACCENT

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, padding: '16px 18px', background: 'rgba(245,200,66,0.06)', border: '0.5px solid rgba(245,200,66,0.18)', borderRadius: 14 }}>
      <svg width={96} height={96} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        <circle cx={48} cy={48} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={6} />
        <circle cx={48} cy={48} r={r} fill="none" stroke={color}
          strokeWidth={6} strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease', filter: `drop-shadow(0 0 6px ${color}90)` }} />
      </svg>
      <div>
        <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 700, fontSize: '2.5rem', color, lineHeight: 1, marginBottom: 4 }}>{pct}<span style={{ fontSize: '1rem', opacity: 0.6 }}>%</span></p>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: '#6A6258', letterSpacing: '0.14em' }}>
          {done} of {total} steps complete
        </p>
        {pct === 100 && (
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', color: '#3EC88A', letterSpacing: '0.1em', marginTop: 4 }}>
            ✓ MORNING COMPLETE
          </p>
        )}
      </div>
    </div>
  )
}

// ── Step item ──────────────────────────────────────────────────────────────
function StepItem({ step, done, onToggle, onDelete, isEditing, index }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: done ? 'rgba(62,200,138,0.05)' : 'rgba(14,12,11,0.7)',
      border: `0.5px solid ${done ? 'rgba(62,200,138,0.25)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 10, padding: '11px 12px',
      animation: `phase-in-left 0.6s cubic-bezier(0.22,1,0.36,1) ${index * 0.05}s both`,
      transition: 'background 0.3s, border-color 0.3s',
    }}>
      {isEditing && <GripVertical size={14} color="#2A2520" style={{ flexShrink: 0 }} />}

      {/* Check circle */}
      <button onClick={() => onToggle(step.id)} style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
        border: `1.5px solid ${done ? '#3EC88A' : 'rgba(255,255,255,0.15)'}`,
        background: done ? 'rgba(62,200,138,0.2)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
      }}>
        {done && <Check size={13} color="#3EC88A" strokeWidth={2.5} />}
      </button>

      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{step.emoji}</span>

      <span style={{
        flex: 1, fontFamily: '"DM Mono", monospace', fontSize: '0.62rem',
        color: done ? '#5A5450' : '#C4A882', letterSpacing: '0.04em',
        textDecoration: done ? 'line-through' : 'none',
        transition: 'color 0.3s',
      }}>
        {step.text}
      </span>

      {isEditing && (
        <button onClick={() => onDelete(step.id)} style={{ color: '#3A3530', background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}

// ── Step form ──────────────────────────────────────────────────────────────
function StepForm({ onSave, onClose }) {
  const [form, setForm] = useState({ text: '', emoji: '☀' })
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', color: '#A09890', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Step Name *</label>
        <input required className="input" value={form.text} onChange={e => setForm(s => ({ ...s, text: e.target.value }))} placeholder="e.g. 10 minutes meditation" />
      </div>
      <div>
        <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', color: '#A09890', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Emoji</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {EMOJI_OPTIONS.map(em => (
            <button key={em} type="button" onClick={() => setForm(s => ({ ...s, emoji: em }))} style={{
              width: 36, height: 36, borderRadius: 8, border: `1.5px solid ${form.emoji === em ? ACCENT : 'rgba(255,255,255,0.1)'}`,
              background: form.emoji === em ? 'rgba(245,200,66,0.15)' : 'rgba(255,255,255,0.03)',
              fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.15s',
            }}>{em}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary"><Plus size={14} /> Add Step</button>
      </div>
    </form>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function Routine() {
  const { routine, addRoutineStep, deleteRoutineStep, routineLog, setRoutineLog } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const todayStr = today()
  const todayLog = routineLog.find(l => l.date === todayStr)
  const completed = todayLog ? todayLog.completed : []

  const sorted = useMemo(() => [...routine].sort((a, b) => (a.order || 0) - (b.order || 0)), [routine])

  function toggleStep(stepId) {
    const next = completed.includes(stepId)
      ? completed.filter(id => id !== stepId)
      : [...completed, stepId]
    setRoutineLog(todayStr, next)
  }

  function handleAddStep(data) {
    addRoutineStep({ ...data, order: routine.length })
    setShowAdd(false)
  }

  return (
    <SectionShell accent={ACCENT} bgImage={bgImg}>
      <PageHeader subtitle="DAILY RITUAL" title="Morning Routine" accent={ACCENT}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setIsEditing(e => !e)} style={{
            background: isEditing ? 'rgba(245,200,66,0.15)' : 'rgba(255,255,255,0.04)',
            border: `0.5px solid ${isEditing ? 'rgba(245,200,66,0.5)' : 'rgba(255,255,255,0.1)'}`,
            color: isEditing ? ACCENT : '#6A6258', borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
            fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.12em',
          }}>
            {isEditing ? 'DONE' : 'EDIT'}
          </button>
          <button onClick={() => setShowAdd(true)} style={{
            background: 'rgba(245,200,66,0.1)', border: '0.5px solid rgba(245,200,66,0.45)',
            color: ACCENT, borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.12em',
          }}>
            <Plus size={14} /> STEP
          </button>
        </div>
      </PageHeader>

      <div className="p-4 md:p-6 max-w-2xl">

        {/* Date */}
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#4A4540', letterSpacing: '0.16em', marginBottom: 16 }}>
          {format(new Date(), 'EEEE · d MMMM yyyy').toUpperCase()}
        </p>

        <RoutineProgress done={completed.length} total={sorted.length} />

        {/* Steps */}
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.1rem', color: '#3A3530', marginBottom: 8 }}>Build your morning</p>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#2A2520', letterSpacing: '0.1em' }}>ADD YOUR FIRST ROUTINE STEP</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sorted.map((step, i) => (
              <StepItem
                key={step.id}
                step={step}
                done={completed.includes(step.id)}
                onToggle={toggleStep}
                onDelete={deleteRoutineStep}
                isEditing={isEditing}
                index={i}
              />
            ))}
          </div>
        )}

        {/* Reset hint */}
        {sorted.length > 0 && (
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.42rem', color: '#2A2520', letterSpacing: '0.1em', marginTop: 20, textAlign: 'center' }}>
            ROUTINE RESETS AUTOMATICALLY EACH MORNING
          </p>
        )}
      </div>

      {showAdd && (
        <Modal title="Add Routine Step" onClose={() => setShowAdd(false)}>
          <StepForm onSave={handleAddStep} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
    </SectionShell>
  )
}
