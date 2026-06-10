import { useState, useMemo } from 'react'
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import SectionShell from '../../components/SectionShell'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import bgImg from '../../assets/art-ethereal.jpg'

const ACCENT = '#3EC88A'

function weekLabel(weekStart) {
  const ws = new Date(weekStart)
  const we = endOfWeek(ws, { weekStartsOn: 1 })
  return `${format(ws, 'd MMM')} – ${format(we, 'd MMM yyyy')}`
}

// ── Auto-pull stats for a given week ──────────────────────────────────────
function useWeekStats(weekStart) {
  const { tasks, habits, habitLogs, writing } = useStore()
  const ws = new Date(weekStart)
  const we = endOfWeek(ws, { weekStartsOn: 1 })

  const tasksThisWeek = tasks.filter(t => {
    if (!t.doneAt) return false
    const d = new Date(t.doneAt)
    return d >= ws && d <= we
  }).length

  const habitsThisWeek = habitLogs.filter(l => {
    const d = new Date(l.date)
    return d >= ws && d <= we
  }).length

  const wordsThisWeek = writing.filter(s => {
    const d = new Date(s.date)
    return d >= ws && d <= we
  }).reduce((sum, s) => sum + (s.words || 0), 0)

  return { tasksThisWeek, habitsThisWeek, wordsThisWeek }
}

// ── Review entry card ─────────────────────────────────────────────────────
function ReviewCard({ review, onDelete, index }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      background: 'rgba(14,12,11,0.8)', border: '0.5px solid rgba(255,255,255,0.07)',
      borderRadius: 12, overflow: 'hidden',
      animation: `phase-in-left 0.7s cubic-bezier(0.22,1,0.36,1) ${index * 0.05}s both`,
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 14px', background: 'none', border: 'none', cursor: 'pointer',
      }}>
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '0.9rem', color: '#C4A882' }}>
            {weekLabel(review.weekStart)}
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            {[
              { l: 'TASKS', v: review.tasksCompleted || 0, c: '#3EC88A' },
              { l: 'HABITS', v: review.habitsCompleted || 0, c: '#F09030' },
              { l: 'WORDS', v: (review.wordsWritten || 0).toLocaleString(), c: '#7C3AED' },
            ].map(s => (
              <span key={s.l} style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.42rem', color: s.c }}>
                {s.l} {s.v}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={e => { e.stopPropagation(); onDelete(review.id) }} style={{ color: '#3A3530', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Trash2 size={13} />
          </button>
          {open ? <ChevronUp size={14} color="#5C5650" /> : <ChevronDown size={14} color="#5C5650" />}
        </div>
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px', borderTop: '0.5px solid rgba(255,255,255,0.05)' }}>
          {[
            { label: '✦ WINS', value: review.wins, color: '#3EC88A' },
            { label: '◉ CHALLENGES', value: review.challenges, color: '#F09030' },
            { label: '▶ NEXT FOCUS', value: review.focus, color: '#00C8FF' },
          ].map(({ label, value, color }) => value ? (
            <div key={label} style={{ marginTop: 12 }}>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.42rem', color, letterSpacing: '0.14em', marginBottom: 5 }}>{label}</p>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#8A8078', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{value}</p>
            </div>
          ) : null)}
        </div>
      )}
    </div>
  )
}

// ── New review form ────────────────────────────────────────────────────────
function ReviewForm({ onSave, onClose }) {
  const thisWeek = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const stats = useWeekStats(thisWeek)
  const [form, setForm] = useState({
    weekStart: thisWeek,
    wins: '',
    challenges: '',
    focus: '',
  })
  const f = k => e => setForm(s => ({ ...s, [k]: e.target.value }))

  const labelStyle = {
    fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', color: '#A09890',
    letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 5,
  }

  return (
    <form onSubmit={e => {
      e.preventDefault()
      onSave({ ...form, ...stats })
    }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Auto stats */}
      <div style={{ background: 'rgba(62,200,138,0.06)', border: '0.5px solid rgba(62,200,138,0.2)', borderRadius: 8, padding: '10px 12px' }}>
        <p style={{ ...labelStyle, color: '#3EC88A', marginBottom: 8 }}>PULLED FROM THIS WEEK</p>
        <div style={{ display: 'flex', gap: 20 }}>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#3EC88A' }}>✓ {stats.tasksThisWeek} tasks done</span>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#F09030' }}>⚡ {stats.habitsThisWeek} habit logs</span>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#7C3AED' }}>✍ {stats.wordsThisWeek.toLocaleString()} words</span>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Week Starting</label>
        <input type="date" className="input" value={form.weekStart} onChange={f('weekStart')} />
      </div>

      <div>
        <label style={{ ...labelStyle, color: '#3EC88A' }}>✦ Wins — what went well?</label>
        <textarea required className="input" style={{ resize: 'none', minHeight: 80 }} value={form.wins} onChange={f('wins')} placeholder="List your wins, big and small…" />
      </div>
      <div>
        <label style={{ ...labelStyle, color: '#F09030' }}>◉ Challenges — what was hard?</label>
        <textarea className="input" style={{ resize: 'none', minHeight: 72 }} value={form.challenges} onChange={f('challenges')} placeholder="Blockers, friction, what drained you…" />
      </div>
      <div>
        <label style={{ ...labelStyle, color: '#00C8FF' }}>▶ Next Week Focus — one clear intention</label>
        <textarea required className="input" style={{ resize: 'none', minHeight: 64 }} value={form.focus} onChange={f('focus')} placeholder="What is the one thing that matters most next week?" />
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary"><Plus size={14} /> Save Review</button>
      </div>
    </form>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function Review() {
  const { weeklyReviews, addWeeklyReview, deleteWeeklyReview } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const sorted = useMemo(() => [...weeklyReviews].sort((a, b) => b.weekStart.localeCompare(a.weekStart)), [weeklyReviews])

  return (
    <SectionShell accent={ACCENT} bgImage={bgImg}>
      <PageHeader subtitle="REFLECTION" title="Weekly Review" accent={ACCENT} showBack>
        <button onClick={() => setShowAdd(true)} style={{
          background: 'rgba(62,200,138,0.1)', border: '0.5px solid rgba(62,200,138,0.45)',
          color: ACCENT, borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.12em',
        }}>
          <Plus size={14} /> NEW REVIEW
        </button>
      </PageHeader>

      <div className="p-4 md:p-6 max-w-2xl">

        {/* Intro callout */}
        {sorted.length === 0 && (
          <div style={{
            background: 'rgba(62,200,138,0.05)', border: '0.5px solid rgba(62,200,138,0.15)',
            borderRadius: 12, padding: '20px 18px', marginBottom: 24, textAlign: 'center',
          }}>
            <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.1rem', color: '#3EC88A', marginBottom: 8 }}>Start your first review</p>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#4A4540', letterSpacing: '0.08em', lineHeight: 1.7 }}>
              A weekly review keeps you intentional. It pulls your task completions,<br />habit logs, and word count automatically — you just add the reflection.
            </p>
          </div>
        )}

        {sorted.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sorted.map((review, i) => (
              <ReviewCard key={review.id} review={review} onDelete={setDeleteId} index={i} />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <Modal title="New Weekly Review" onClose={() => setShowAdd(false)}>
          <ReviewForm onSave={data => { addWeeklyReview(data); setShowAdd(false) }} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
      {deleteId && (
        <ConfirmDialog title="Delete Review" message="Delete this weekly review?"
          onConfirm={() => { deleteWeeklyReview(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)} />
      )}
    </SectionShell>
  )
}
