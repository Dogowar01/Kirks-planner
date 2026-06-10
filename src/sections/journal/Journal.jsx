import { useState, useRef } from 'react'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { Plus, ArrowLeft, Trash2 } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import SectionShell from '../../components/SectionShell'
import PageHeader from '../../components/PageHeader'
import ConfirmDialog from '../../components/ConfirmDialog'
import bgImg from '../../assets/art-vintage-woman.jpg'

const MOODS = [
  { value: 1, emoji: '😔', label: 'Low',     color: '#6B7280' },
  { value: 2, emoji: '😐', label: 'Okay',    color: '#F09030' },
  { value: 3, emoji: '🙂', label: 'Good',    color: '#3EC88A' },
  { value: 4, emoji: '😊', label: 'Great',   color: '#00C8FF' },
  { value: 5, emoji: '🔥', label: 'Amazing', color: '#C4522A' },
]

function dateLabel(iso) {
  const d = parseISO(iso)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEEE d MMMM')
}

function EntryEditor({ entry, onUpdate, onBack, onDelete }) {
  const [body, setBody] = useState(entry.body || '')
  const [mood, setMood] = useState(entry.mood || 3)
  const [saved, setSaved] = useState(true)
  const debounceRef = useRef(null)
  const moodObj = MOODS.find(m => m.value === mood) || MOODS[2]

  function persist(updates) {
    setSaved(false)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { onUpdate(entry.id, updates); setSaved(true) }, 600)
  }

  function handleBody(val) { setBody(val); persist({ body: val, mood }) }
  function handleMood(val) { setMood(val); onUpdate(entry.id, { body, mood: val }); setSaved(true) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100dvh - 120px)' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} className="btn-ghost text-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={13} /> Journal
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', letterSpacing: '0.14em', color: saved ? '#3A6A4A' : '#7A6030', textTransform: 'uppercase', transition: 'color 0.4s' }}>
          {saved ? 'SAVED' : 'SAVING'}
        </span>
        <button onClick={() => onDelete(entry.id)} style={{ color: '#4A4540', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} className="hover:text-red-400 transition-colors">
          <Trash2 size={15} />
        </button>
      </div>

      {/* Date heading */}
      <h2 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: 'clamp(1.4rem, 5vw, 1.9rem)', color: '#EDE8E0', marginBottom: 4, letterSpacing: '-0.01em' }}>
        {dateLabel(entry.date)}
      </h2>
      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#5C5650', letterSpacing: '0.12em', marginBottom: 16 }}>
        {format(parseISO(entry.date), 'yyyy · EEEE')}
      </p>

      {/* Mood selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {MOODS.map(m => (
          <button key={m.value} onClick={() => handleMood(m.value)}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: mood === m.value ? `${m.color}20` : 'rgba(255,255,255,0.03)',
              outline: mood === m.value ? `1px solid ${m.color}60` : 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              transition: 'all 0.2s ease',
              boxShadow: mood === m.value ? `0 0 12px ${m.color}30` : 'none',
            }}>
            <span style={{ fontSize: '1.2rem' }}>{m.emoji}</span>
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.4rem', letterSpacing: '0.1em', color: mood === m.value ? m.color : '#4A4540', textTransform: 'uppercase' }}>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Accent line */}
      <div style={{ height: 1.5, marginBottom: 20, background: `linear-gradient(to right, ${moodObj.color}CC, ${moodObj.color}30, transparent)`, boxShadow: `0 0 8px ${moodObj.color}40` }} />

      {/* Body */}
      <textarea
        value={body}
        onChange={e => handleBody(e.target.value)}
        placeholder="What's on your mind today…"
        style={{
          flex: 1, background: 'none', border: 'none', outline: 'none',
          resize: 'none', width: '100%', padding: 0, minHeight: 300,
          color: '#C8BFB5', fontSize: '0.95rem', lineHeight: 1.9,
          fontFamily: '"DM Sans", sans-serif',
        }}
        onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300)}
      />

      {/* Footer */}
      <div style={{ marginTop: 24, paddingTop: 10, borderTop: '0.5px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#4A4540', letterSpacing: '0.1em' }}>
          {format(parseISO(entry.updatedAt), "d MMM yyyy '·' HH:mm")}
        </p>
      </div>
    </div>
  )
}

export default function Journal() {
  const { journal, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useStore()
  const [activeEntry, setActiveEntry] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const sorted = [...journal].sort((a, b) => b.date.localeCompare(a.date))

  function newEntry() {
    const date = format(new Date(), 'yyyy-MM-dd')
    const existing = journal.find(e => e.date === date)
    if (existing) { setActiveEntry(existing); return }
    const entry = addJournalEntry({ date, body: '', mood: 3 })
    setActiveEntry(entry)
  }

  return (
    <SectionShell accent="#8B5CF6" bgImage={bgImg}>
      {!activeEntry && (
        <PageHeader subtitle="PRIVATE JOURNAL" title="Journal" accent="#8B5CF6" showBack>
          <button onClick={newEntry} style={{
            background: 'rgba(139,92,246,0.12)', border: '0.5px solid rgba(139,92,246,0.5)',
            color: '#8B5CF6', borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.12em',
          }}>
            <Plus size={14} strokeWidth={2} /> TODAY
          </button>
        </PageHeader>
      )}

      <div className="p-4 md:p-6 max-w-2xl">
        {activeEntry ? (
          <EntryEditor
            entry={activeEntry}
            onUpdate={(id, data) => { updateJournalEntry(id, data); setActiveEntry(e => ({ ...e, ...data, updatedAt: new Date().toISOString() })) }}
            onBack={() => setActiveEntry(null)}
            onDelete={id => { setDeleteId(id); setActiveEntry(null) }}
          />
        ) : (
          <>
            <div className="mb-6" />

            {sorted.length === 0 ? (
              <button onClick={newEntry} className="card w-full" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 20px', borderStyle: 'dashed', borderColor: 'rgba(139,92,246,0.15)', cursor: 'pointer' }}>
                <span style={{ fontSize: '2rem' }}>📝</span>
                <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1rem', color: '#6A6258' }}>Nothing written yet</p>
                <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#4A4540', letterSpacing: '0.1em' }}>TAP TO START TODAY'S ENTRY</p>
              </button>
            ) : (
              <div className="space-y-3">
                {sorted.map((entry, i) => {
                  const moodObj = MOODS.find(m => m.value === entry.mood) || MOODS[2]
                  const anim = i % 2 === 0
                    ? `phase-in-left 1.1s cubic-bezier(0.22,1,0.36,1) ${0.15 + i * 0.08}s both`
                    : `phase-in-right 1.1s cubic-bezier(0.22,1,0.36,1) ${0.15 + i * 0.08}s both`
                  return (
                    <button key={entry.id} onClick={() => setActiveEntry(entry)}
                      className="card w-full text-left" style={{ padding: 0, overflow: 'hidden', animation: anim }}>
                      <div style={{ display: 'flex', alignItems: 'stretch' }}>
                        <div style={{ width: 3, flexShrink: 0, background: moodObj.color, boxShadow: `0 0 8px ${moodObj.color}80` }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ height: 1.5, background: `linear-gradient(to right, ${moodObj.color}CC, ${moodObj.color}20, transparent)` }} />
                          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <span style={{ fontSize: '1.4rem', flexShrink: 0, lineHeight: 1.2 }}>{moodObj.emoji}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: '0.95rem', color: '#EDE8E0', marginBottom: 4 }}>
                                {dateLabel(entry.date)}
                              </p>
                              {entry.body && (
                                <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.58rem', color: '#6A6258', lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                  {entry.body.slice(0, 160)}
                                </p>
                              )}
                              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: '#3A3530', letterSpacing: '0.08em', marginTop: 5 }}>
                                {moodObj.label} · {format(parseISO(entry.date), 'd MMM yyyy')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {deleteId && (
        <ConfirmDialog title="Delete Entry" message="Delete this journal entry? This cannot be undone."
          onConfirm={() => { deleteJournalEntry(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)} />
      )}
    </SectionShell>
  )
}
