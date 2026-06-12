import { useState, useMemo } from 'react'
import { format, subDays, parseISO } from 'date-fns'
import { Plus, Trash2, PenLine } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import SectionShell from '../../components/SectionShell'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import bgImg from '../../assets/art-architectural.webp'

const ACCENT = '#7C3AED'
const today = () => format(new Date(), 'yyyy-MM-dd')

// ── Sparkline 30-day chart ─────────────────────────────────────────────────
function WordChart({ sessions }) {
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
    const words = sessions.filter(s => s.date === d).reduce((sum, s) => sum + (s.words || 0), 0)
    return { d, words }
  })
  const max = Math.max(...days.map(d => d.words), 1)
  const W = 280, H = 56, PAD = 4

  return (
    <div style={{ background: 'rgba(124,58,237,0.06)', border: '0.5px solid rgba(124,58,237,0.18)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.42rem', color: '#7C3AED', letterSpacing: '0.18em', marginBottom: 10 }}>30-DAY WORD COUNT</p>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {days.map((day, i) => {
          const x = PAD + i * ((W - PAD * 2) / 29)
          const barH = day.words > 0 ? Math.max(3, ((day.words / max) * (H - 8))) : 2
          const y = H - barH
          const isToday = day.d === today()
          return (
            <g key={day.d}>
              <rect x={x - 3} y={y} width={6} height={barH} rx={2}
                fill={isToday ? '#C4522A' : day.words > 0 ? '#7C3AED' : '#1E1A18'}
                style={{ filter: day.words > 0 ? `drop-shadow(0 0 4px ${isToday ? '#C4522A' : '#7C3AED'}80)` : 'none' }}
              >
                <animate attributeName="height" from="0" to={barH} dur="0.6s" begin={`${i * 0.02}s`} fill="freeze" />
                <animate attributeName="y" from={H} to={y} dur="0.6s" begin={`${i * 0.02}s`} fill="freeze" />
              </rect>
            </g>
          )
        })}
      </svg>
      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.38rem', color: '#3A3530', letterSpacing: '0.1em', marginTop: 6 }}>
        TODAY {format(new Date(), 'd MMM').toUpperCase()} ▸
      </p>
    </div>
  )
}

// ── Project progress bars ──────────────────────────────────────────────────
function ProjectStats({ sessions, projects }) {
  const writingProjects = projects.filter(p => p.businessId === 'writing')
  if (writingProjects.length === 0) return null

  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', color: '#5C5650', letterSpacing: '0.16em', marginBottom: 12 }}>MANUSCRIPTS</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {writingProjects.map(proj => {
          const projWords = sessions.filter(s => s.projectId === proj.id).reduce((sum, s) => sum + (s.words || 0), 0)
          const target = proj.wordTarget || 80000
          const pct = Math.min(100, Math.round((projWords / target) * 100))
          return (
            <div key={proj.id} style={{ background: 'rgba(14,12,11,0.6)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '0.85rem', color: '#C4A882' }}>{proj.name}</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#7C3AED' }}>{projWords.toLocaleString()} / {target.toLocaleString()}</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #7C3AED, #A855F7)', borderRadius: 99, transition: 'width 0.8s ease', boxShadow: '0 0 6px rgba(124,58,237,0.6)' }} />
              </div>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.38rem', color: '#4A4540', marginTop: 4 }}>{pct}% COMPLETE</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Session log form ───────────────────────────────────────────────────────
function SessionForm({ projects, onSave, onClose }) {
  const writingProjects = projects.filter(p => p.businessId === 'writing')
  const [form, setForm] = useState({
    projectId: writingProjects[0]?.id || '',
    projectName: writingProjects[0]?.name || '',
    words: '',
    date: today(),
    note: '',
  })
  const f = k => e => setForm(s => ({ ...s, [k]: e.target.value }))

  function handleProject(id) {
    const proj = writingProjects.find(p => p.id === id)
    setForm(s => ({ ...s, projectId: id, projectName: proj?.name || id }))
  }

  const labelStyle = { fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', color: '#A09890', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }

  return (
    <form onSubmit={e => {
      e.preventDefault()
      onSave({ ...form, words: parseInt(form.words) || 0 })
    }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {writingProjects.length > 0 ? (
        <div>
          <label style={labelStyle}>Project</label>
          <select className="input" value={form.projectId} onChange={e => handleProject(e.target.value)}>
            <option value="">— No project —</option>
            {writingProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      ) : (
        <div>
          <label style={labelStyle}>Manuscript / Project</label>
          <input className="input" value={form.projectName} onChange={f('projectName')} placeholder="Novel title, script name…" />
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Words Written *</label>
          <input required type="number" min="0" className="input" value={form.words} onChange={f('words')} placeholder="1200" />
        </div>
        <div>
          <label style={labelStyle}>Date</label>
          <input type="date" className="input" value={form.date} onChange={f('date')} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Session Note</label>
        <textarea className="input" style={{ resize: 'none', minHeight: 64 }} value={form.note} onChange={f('note')} placeholder="What did you write? Any breakthroughs?" />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary"><Plus size={14} /> Log Session</button>
      </div>
    </form>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Writing() {
  const { writing, addWritingSession, deleteWritingSession, projects } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const todayStr = today()
  const wordsToday = writing.filter(s => s.date === todayStr).reduce((sum, s) => sum + (s.words || 0), 0)
  const wordsAllTime = writing.reduce((sum, s) => sum + (s.words || 0), 0)
  const sessionsCount = writing.length

  const sorted = useMemo(() => [...writing].sort((a, b) => b.date.localeCompare(a.date)), [writing])

  return (
    <SectionShell accent={ACCENT} bgImage={bgImg}>
      <PageHeader subtitle="WRITING TRACKER" title="Writing" accent={ACCENT} showBack>
        <button onClick={() => setShowAdd(true)} style={{
          background: 'rgba(124,58,237,0.12)', border: '0.5px solid rgba(124,58,237,0.5)',
          color: ACCENT, borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.12em',
        }}>
          <PenLine size={14} /> LOG SESSION
        </button>
      </PageHeader>

      <div className="p-4 md:p-6 max-w-2xl">

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'TODAY', value: wordsToday.toLocaleString(), color: '#C4522A' },
            { label: 'ALL TIME', value: wordsAllTime.toLocaleString(), color: ACCENT },
            { label: 'SESSIONS', value: sessionsCount, color: '#A09890' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(14,12,11,0.7)', border: `0.5px solid ${s.color}25`,
              borderRadius: 10, padding: '12px 14px',
            }}>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.38rem', color: '#4A4540', letterSpacing: '0.14em', marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: '1.3rem', color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <WordChart sessions={writing} />
        <ProjectStats sessions={writing} projects={projects} />

        {/* Session list */}
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', color: '#5C5650', letterSpacing: '0.16em', marginBottom: 12 }}>RECENT SESSIONS</p>
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.1rem', color: '#3A3530', marginBottom: 8 }}>No sessions yet</p>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#2A2520', letterSpacing: '0.1em' }}>LOG YOUR FIRST WRITING SESSION</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sorted.map((s, i) => (
              <div key={s.id} style={{
                background: 'rgba(14,12,11,0.7)', border: '0.5px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '11px 14px',
                animation: `phase-in-left 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 0.04}s both`,
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                {/* Word count badge */}
                <div style={{ flexShrink: 0, textAlign: 'center' }}>
                  <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 700, fontSize: '1.1rem', color: ACCENT, lineHeight: 1 }}>{(s.words || 0).toLocaleString()}</p>
                  <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.38rem', color: '#4A4540', letterSpacing: '0.08em' }}>WORDS</p>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#8B8380' }}>{s.projectName || 'Untitled'}</span>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', color: '#3A3530' }}>{s.date}</span>
                  </div>
                  {s.note && <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', color: '#6A6258', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{s.note}</p>}
                </div>
                <button onClick={() => setDeleteId(s.id)} style={{ color: '#3A3530', background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <Modal title="Log Writing Session" onClose={() => setShowAdd(false)}>
          <SessionForm projects={projects} onSave={data => { addWritingSession(data); setShowAdd(false) }} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
      {deleteId && (
        <ConfirmDialog title="Delete Session" message="Remove this writing session?"
          onConfirm={() => { deleteWritingSession(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)} />
      )}
    </SectionShell>
  )
}
