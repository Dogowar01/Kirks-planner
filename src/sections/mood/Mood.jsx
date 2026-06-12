import { useState, useMemo } from 'react'
import { Plus, Trash2, Smile } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import SectionShell from '../../components/SectionShell'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import bgImg from '../../assets/art-portrait.png'

const ACCENT = '#EC4899'

const MOODS = [
  { value: 5, emoji: '😄', label: 'Great',    color: '#3EC88A' },
  { value: 4, emoji: '🙂', label: 'Good',     color: '#A3E635' },
  { value: 3, emoji: '😐', label: 'Neutral',  color: '#F5C842' },
  { value: 2, emoji: '😕', label: 'Low',      color: '#F97316' },
  { value: 1, emoji: '😞', label: 'Rough',    color: '#FF4D6A' },
]

const ENERGY = [
  { value: 5, label: 'High',    color: '#3EC88A' },
  { value: 4, label: 'Good',    color: '#A3E635' },
  { value: 3, label: 'Medium',  color: '#F5C842' },
  { value: 2, label: 'Low',     color: '#F97316' },
  { value: 1, label: 'Drained', color: '#FF4D6A' },
]

const TAGS = ['Anxious','Calm','Creative','Focused','Grateful','Irritable','Motivated','Sad','Stressed','Tired']

function MoodBar({ logs, days = 14 }) {
  const today = new Date()
  const slots = Array.from({ length: days }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (days - 1 - i))
    const dateStr = d.toISOString().slice(0,10)
    const log = logs.find(l => l.date === dateStr)
    return { dateStr, log }
  })

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 48, marginBottom: 4 }}>
      {slots.map(({ dateStr, log }) => {
        const mood = MOODS.find(m => m.value === log?.mood)
        return (
          <div key={dateStr} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: '100%', borderRadius: 3, background: mood ? mood.color : 'rgba(255,255,255,0.06)', height: log ? `${(log.mood / 5) * 36 + 8}px` : 8, transition: 'height 0.3s', boxShadow: mood ? `0 0 6px ${mood.color}60` : 'none' }} />
          </div>
        )
      })}
    </div>
  )
}

function MoodCard({ log, onDelete, index }) {
  const mood = MOODS.find(m => m.value === log.mood) || MOODS[2]
  const energy = ENERGY.find(e => e.value === log.energy) || ENERGY[2]
  const anim = `phase-in 0.6s cubic-bezier(0.22,1,0.36,1) ${index * 0.04}s both`

  return (
    <div style={{
      background: 'rgba(14,12,11,0.85)', border: '0.5px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '14px 16px', animation: anim,
      clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{mood.emoji}</span>
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.62rem', fontWeight: 700, color: mood.color }}>{mood.label}</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: 'rgba(255,255,255,0.2)' }}>·</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: energy.color }}>Energy: {energy.label}</span>
              </div>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: 'rgba(160,140,120,0.4)', letterSpacing: '0.1em' }}>
                {new Date(log.date + 'T12:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
          {log.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: log.notes ? 8 : 0 }}>
              {log.tags.map(t => (
                <span key={t} style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: `${ACCENT}80`, background: `${ACCENT}15`, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.06em' }}>{t}</span>
              ))}
            </div>
          )}
          {log.notes && <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: 'rgba(160,140,120,0.6)', margin: 0, lineHeight: 1.5 }}>{log.notes}</p>}
        </div>
        <button onClick={() => onDelete(log.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,77,106,0.35)', padding: '2px 4px', marginLeft: 8, flexShrink: 0 }}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
const EMPTY = { date: today(), mood: 3, energy: 3, tags: [], notes: '' }

export default function Mood() {
  const { mood: logs, addMoodLog, deleteMoodLog } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const sorted = useMemo(() => [...logs].sort((a,b) => b.date.localeCompare(a.date)), [logs])
  const todayLog = sorted.find(l => l.date === today())

  const avgMood = useMemo(() => {
    const r = sorted.slice(0,14).filter(l => l.mood)
    return r.length ? (r.reduce((s,l) => s+l.mood,0)/r.length).toFixed(1) : null
  }, [sorted])

  const toggleTag = (tag) => setForm(f => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag] }))

  const save = () => {
    addMoodLog({ ...form })
    setShowForm(false)
    setForm(EMPTY)
  }

  const inputStyle = {
    background: 'rgba(13,12,11,0.9)', border: `1px solid ${ACCENT}30`, borderRadius: 8,
    color: '#EDE8E0', fontFamily: '"DM Mono", monospace', fontSize: '0.85rem',
    padding: '0.55rem 0.75rem', outline: 'none', width: '100%', boxSizing: 'border-box', colorScheme: 'dark',
  }
  const lbl = (t) => <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: `${ACCENT}80`, display: 'block', marginBottom: '0.4rem' }}>{t}</span>

  return (
    <SectionShell accent={ACCENT} bgImage={bgImg}>
      <PageHeader subtitle="WELLNESS" title="Mood & Energy" accent={ACCENT} showBack>
        <button onClick={() => { setShowForm(true); setForm({ ...EMPTY, date: today() }) }}
          style={{ background: `${ACCENT}20`, border: `1px solid ${ACCENT}50`, color: ACCENT, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} />LOG
        </button>
      </PageHeader>

      <div className="p-4 max-w-2xl" style={{ paddingBottom: '3rem' }}>

        {/* 14-day chart */}
        {sorted.length > 0 && (
          <div style={{ background: 'rgba(14,12,11,0.8)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.45rem', color: 'rgba(160,140,120,0.4)', letterSpacing: '0.18em', marginBottom: 10 }}>14-DAY MOOD TREND</div>
            <MoodBar logs={sorted} days={14} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.42rem', color: 'rgba(160,140,120,0.3)' }}>14 days ago</span>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.42rem', color: 'rgba(160,140,120,0.3)' }}>Today</span>
            </div>
          </div>
        )}

        {/* Stats */}
        {sorted.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'AVG MOOD', value: avgMood ? `${avgMood}/5` : '—', color: ACCENT },
              { label: "TODAY'S MOOD", value: todayLog ? MOODS.find(m=>m.value===todayLog.mood)?.emoji || '—' : '—', color: '#F5C842' },
              { label: 'LOGS', value: sorted.length, color: '#A09890' },
            ].map(({ label: l, value, color }) => (
              <div key={l} style={{ background: 'rgba(14,12,11,0.8)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.42rem', color: 'rgba(160,140,120,0.5)', letterSpacing: '0.15em', marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: l === "TODAY'S MOOD" ? '1.4rem' : '1rem', fontFamily: '"DM Mono", monospace', fontWeight: 700, color, textShadow: `0 0 10px ${color}50` }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: `${ACCENT}40` }}>
            <Smile size={32} style={{ margin: '0 auto 1rem', display: 'block' }} />
            <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.1rem', marginBottom: '0.5rem', color: `${ACCENT}60` }}>No mood logs yet</p>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.1em' }}>Check in daily to spot patterns</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sorted.map((log,i) => <MoodCard key={log.id} log={log} onDelete={setDeleteId} index={i} />)}
          </div>
        )}
      </div>

      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.3rem', color: ACCENT, margin: '0 0 1.5rem', textShadow: `0 0 16px ${ACCENT}50` }}>How are you feeling?</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>{lbl('Date')}<input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} style={inputStyle} /></div>
            <div>
              {lbl('Mood')}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                {MOODS.map(m => (
                  <button key={m.value} type="button" onClick={() => setForm(f => ({...f, mood: m.value}))}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 4px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${form.mood === m.value ? m.color : 'rgba(255,255,255,0.08)'}`, background: form.mood === m.value ? `${m.color}20` : 'rgba(13,12,11,0.6)', transition: 'all 0.15s' }}>
                    <span style={{ fontSize: '1.5rem' }}>{m.emoji}</span>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.4rem', color: form.mood === m.value ? m.color : 'rgba(160,140,120,0.4)', letterSpacing: '0.06em' }}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              {lbl('Energy Level')}
              <div style={{ display: 'flex', gap: 6 }}>
                {ENERGY.map(e => (
                  <button key={e.value} type="button" onClick={() => setForm(f => ({...f, energy: e.value}))}
                    style={{ flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${form.energy === e.value ? e.color : 'rgba(255,255,255,0.08)'}`, background: form.energy === e.value ? `${e.color}20` : 'transparent', fontFamily: '"DM Mono", monospace', fontSize: '0.45rem', color: form.energy === e.value ? e.color : 'rgba(160,140,120,0.4)', letterSpacing: '0.06em', transition: 'all 0.15s' }}>
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              {lbl('Tags')}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {TAGS.map(t => (
                  <button key={t} type="button" onClick={() => toggleTag(t)}
                    style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', border: `0.5px solid ${form.tags.includes(t) ? ACCENT : 'rgba(255,255,255,0.1)'}`, background: form.tags.includes(t) ? `${ACCENT}20` : 'transparent', color: form.tags.includes(t) ? ACCENT : 'rgba(160,140,120,0.5)', transition: 'all 0.15s' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>{lbl('Notes (optional)')}<textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} placeholder="What's on your mind…" style={{ ...inputStyle, resize: 'vertical' }} /></div>
          </div>
          <button onClick={save} style={{ marginTop: '1.5rem', width: '100%', background: `linear-gradient(135deg, ${ACCENT}40, ${ACCENT}22)`, border: `1px solid ${ACCENT}70`, borderRadius: 10, color: ACCENT, fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1rem', padding: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
            Save Entry
          </button>
        </Modal>
      )}

      {deleteId && (
        <ConfirmDialog message="Delete this mood log?" onConfirm={() => { deleteMoodLog(deleteId); setDeleteId(null) }} onCancel={() => setDeleteId(null)} />
      )}
    </SectionShell>
  )
}
