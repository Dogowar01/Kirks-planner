import { useState } from 'react'
import { format, subDays, parseISO, isToday, isSameDay } from 'date-fns'
import { Plus, Trash2, Flame, Check } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import SectionShell from '../../components/SectionShell'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import bgImg from '../../assets/art-architectural.jpg'

const PALETTE = [
  '#C4522A', '#F09030', '#3EC88A', '#00C8FF', '#8B5CF6',
  '#FF4D6A', '#F59E0B', '#10B981', '#06B6D4', '#A78BFA',
]

const ICONS = ['⚡','🔥','💪','🧠','📚','🏃','🎯','✍️','🧘','💧','🌱','⭐','🎨','🎵','💊']

// How many consecutive days completed up to today
function calcStreak(logs, habitId) {
  let streak = 0
  let day = new Date()
  // If today not done yet, start from yesterday for streak count (be generous)
  const todayStr = format(day, 'yyyy-MM-dd')
  const todayDone = logs.some(l => l.habitId === habitId && l.date === todayStr)
  if (!todayDone) day = subDays(day, 1)

  while (true) {
    const dateStr = format(day, 'yyyy-MM-dd')
    if (!logs.some(l => l.habitId === habitId && l.date === dateStr)) break
    streak++
    day = subDays(day, 1)
  }
  return streak
}

// Last N days as YYYY-MM-DD strings, oldest first
function lastNDays(n) {
  return Array.from({ length: n }, (_, i) => format(subDays(new Date(), n - 1 - i), 'yyyy-MM-dd'))
}

function HabitCard({ habit, logs, onToggle, onDelete, index }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const donedToday = logs.some(l => l.habitId === habit.id && l.date === today)
  const streak = calcStreak(logs, habit.id)
  const heatDays = lastNDays(28)
  const col = habit.color || '#C4522A'
  const anim = index % 2 === 0
    ? `phase-in-left 1.1s cubic-bezier(0.22,1,0.36,1) ${0.2 + index * 0.08}s both`
    : `phase-in-right 1.1s cubic-bezier(0.22,1,0.36,1) ${0.2 + index * 0.08}s both`

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', animation: anim }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Left accent stripe */}
        <div style={{ width: 3, flexShrink: 0, background: col, boxShadow: `0 0 10px ${col}80` }} />
        <div style={{ flex: 1, padding: '14px 14px 12px' }}>

          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{habit.icon || '⚡'}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: '1rem', color: '#EDE8E0', lineHeight: 1.2 }}>{habit.name}</p>
              {streak > 0 && (
                <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: col, letterSpacing: '0.12em', marginTop: 2 }}>
                  🔥 {streak} DAY STREAK
                </p>
              )}
            </div>

            {/* Toggle today */}
            <button
              onClick={() => onToggle(habit.id, today)}
              style={{
                width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: donedToday ? `linear-gradient(135deg, ${col}, ${col}cc)` : 'rgba(255,255,255,0.05)',
                boxShadow: donedToday ? `0 0 16px ${col}60, 0 0 32px ${col}20` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}>
              <Check size={18} strokeWidth={2.5} color={donedToday ? '#fff' : '#4A4540'} />
            </button>

            <button onClick={() => onDelete(habit.id)}
              style={{ color: '#3A3530', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              className="hover:text-red-400 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>

          {/* 28-day heat map */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
            {heatDays.map(dateStr => {
              const done = logs.some(l => l.habitId === habit.id && l.date === dateStr)
              const isT = dateStr === today
              return (
                <button
                  key={dateStr}
                  onClick={() => onToggle(habit.id, dateStr)}
                  title={format(parseISO(dateStr), 'd MMM')}
                  style={{
                    width: '100%', aspectRatio: '1', borderRadius: 3, border: 'none', cursor: 'pointer',
                    background: done ? col : isT ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                    boxShadow: done ? `0 0 6px ${col}60` : isT ? `0 0 0 1px ${col}40` : 'none',
                    transition: 'all 0.15s ease',
                    opacity: done ? 1 : 0.6,
                  }}
                />
              )
            })}
          </div>

          {/* Day labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginTop: 3 }}>
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <p key={i} style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.35rem', color: '#3A3530', textAlign: 'center', letterSpacing: '0.05em' }}>{d}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function HabitForm({ onSave, onClose }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('⚡')
  const [color, setColor] = useState('#C4522A')

  return (
    <form onSubmit={e => { e.preventDefault(); if (name.trim()) onSave({ name: name.trim(), icon, color }) }} className="space-y-4">
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Habit Name *</label>
        <input required className="input" placeholder="e.g. Morning workout" value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div>
        <label className="text-text-secondary text-xs mb-2 block">Icon</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ICONS.map(ic => (
            <button key={ic} type="button" onClick={() => setIcon(ic)}
              style={{
                fontSize: '1.3rem', padding: '6px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: icon === ic ? 'rgba(196,82,42,0.2)' : 'rgba(255,255,255,0.04)',
                outline: icon === ic ? '1px solid rgba(196,82,42,0.5)' : 'none',
              }}>{ic}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-text-secondary text-xs mb-2 block">Colour</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PALETTE.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              style={{
                width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: c,
                boxShadow: color === c ? `0 0 0 2px #0D0C0B, 0 0 0 4px ${c}` : 'none',
                transition: 'box-shadow 0.15s',
              }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        <button type="submit" style={{
          fontFamily: '"Playfair Display", serif', fontStyle: 'italic',
          background: `linear-gradient(135deg, ${color}, ${color}bb)`,
          color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer',
          fontSize: '0.9rem', fontWeight: 600,
          boxShadow: `0 0 20px ${color}40`,
        }}>Add Habit</button>
      </div>
    </form>
  )
}

export default function Habits() {
  const { habits, habitLogs, addHabit, deleteHabit, toggleHabitLog } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const todayDoneCount = habits.filter(h => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return habitLogs.some(l => l.habitId === h.id && l.date === today)
  }).length

  return (
    <SectionShell accent="#F09030" bgImage={bgImg}>
      <PageHeader subtitle="HABIT TRACKER" title="Habits" accent="#F09030" showBack>
        <button onClick={() => setShowModal(true)} style={{
          background: 'rgba(240,144,48,0.12)', border: '0.5px solid rgba(240,144,48,0.5)',
          color: '#F09030', borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.12em',
        }}>
          <Plus size={14} strokeWidth={2} /> NEW
        </button>
      </PageHeader>

      <div className="p-4 md:p-6 max-w-2xl">
        <div className="mb-6" />

        {/* Today's summary */}
        {habits.length > 0 && (
          <div className="card" style={{
            marginBottom: 16, padding: '14px 16px',
            background: 'linear-gradient(135deg, rgba(240,144,48,0.08) 0%, rgba(13,12,11,0.9) 100%)',
            animation: 'phase-in 1.0s cubic-bezier(0.22,1,0.36,1) 0.1s both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.42rem', color: 'rgba(240,144,48,0.6)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>TODAY'S PROGRESS</p>
                <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: '1.5rem', color: '#EDE8E0', lineHeight: 1 }}>
                  {todayDoneCount} <span style={{ fontSize: '0.9rem', color: '#7A7268' }}>/ {habits.length}</span>
                </p>
              </div>
              <div style={{ position: 'relative', width: 54, height: 54 }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F09030" strokeWidth="3"
                    strokeDasharray={`${habits.length > 0 ? (todayDoneCount / habits.length) * 100 : 0} 100`}
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 4px rgba(240,144,48,0.6))', transition: 'stroke-dasharray 0.5s ease' }}
                  />
                </svg>
                <Flame size={16} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#F09030' }} />
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: 10, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2, transition: 'width 0.6s ease',
                width: habits.length > 0 ? `${(todayDoneCount / habits.length) * 100}%` : '0%',
                background: 'linear-gradient(90deg, #F09030, #FF6B00)',
                boxShadow: '0 0 8px rgba(240,144,48,0.6)',
              }} />
            </div>
          </div>
        )}

        {habits.length === 0 ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 20px', textAlign: 'center', borderStyle: 'dashed', borderColor: 'rgba(240,144,48,0.15)' }}>
            <Flame size={28} style={{ color: '#3A3530' }} />
            <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1rem', color: '#6A6258' }}>No habits yet</p>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#3A3530', letterSpacing: '0.1em' }}>ADD YOUR FIRST HABIT ABOVE</p>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((h, i) => (
              <HabitCard key={h.id} habit={h} logs={habitLogs} index={i}
                onToggle={toggleHabitLog}
                onDelete={id => setDeleteId(id)} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="New Habit" onClose={() => setShowModal(false)}>
          <HabitForm onSave={data => { addHabit(data); setShowModal(false) }} onClose={() => setShowModal(false)} />
        </Modal>
      )}

      {deleteId && (
        <ConfirmDialog title="Delete Habit" message="Delete this habit and all its history?"
          onConfirm={() => { deleteHabit(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)} />
      )}
    </SectionShell>
  )
}
