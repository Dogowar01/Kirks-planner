import { useState, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { Plus, Pin, Trash2, Search, ArrowLeft } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { CATEGORIES } from '../../lib/constants'
import SectionShell from '../../components/SectionShell'
import PageHeader from '../../components/PageHeader'
import bgImg from '../../assets/art-vintage-woman.jpg'
import ConfirmDialog from '../../components/ConfirmDialog'
import { BookOpen } from 'lucide-react'

// ─── Inline Note Editor ───────────────────────────────────────────────────────
function NoteEditor({ note, onUpdate, onBack, onDelete }) {
  const [title, setTitle]       = useState(note.title || '')
  const [body, setBody]         = useState(note.body || '')
  const [category, setCategory] = useState(note.category || 'personal')
  const [saved, setSaved]       = useState(true)
  const debounceRef = useRef(null)

  function persist(updates) {
    setSaved(false)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { onUpdate(note.id, updates); setSaved(true) }, 700)
  }

  function handleTitle(val)    { setTitle(val);    persist({ title: val, body, category }) }
  function handleBody(val)     { setBody(val);     persist({ title, body: val, category }) }
  function handleCategory(val) { setCategory(val); onUpdate(note.id, { title, body, category: val }); setSaved(true) }

  const accent = CATEGORIES[category]?.color || '#C9B49A'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100dvh - 120px)' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <button onClick={onBack} className="btn-ghost text-sm" style={{ padding: '6px 12px', gap: 6, display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={13} /> Notes
        </button>
        <div style={{ flex: 1 }} />
        <select
          className="input"
          style={{ width: 'auto', fontSize: '0.7rem', padding: '5px 10px', color: accent }}
          value={category}
          onChange={e => handleCategory(e.target.value)}>
          {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span style={{
          fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', letterSpacing: '0.14em',
          color: saved ? '#3A6A4A' : '#7A6030', textTransform: 'uppercase', transition: 'color 0.4s', minWidth: 42, textAlign: 'center',
        }}>
          {saved ? 'SAVED' : 'SAVING'}
        </span>
        <button
          onClick={() => onDelete(note.id)}
          style={{ color: '#4A4540', background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 1 }}
          className="hover:text-red-400 transition-colors">
          <Trash2 size={15} />
        </button>
      </div>

      {/* Category accent line */}
      <div style={{
        height: 1, marginBottom: 20,
        background: `linear-gradient(to right, ${accent}CC, ${accent}40, transparent)`,
        boxShadow: `0 0 10px ${accent}50`,
      }} />

      {/* Title */}
      <input
        value={title}
        onChange={e => handleTitle(e.target.value)}
        placeholder="Untitled"
        style={{
          background: 'none', border: 'none', outline: 'none', width: '100%', padding: 0,
          fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600,
          fontSize: 'clamp(1.5rem, 5vw, 2.1rem)', color: '#EDE8E0',
          letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 18,
        }}
      />

      {/* Body */}
      <textarea
        value={body}
        onChange={e => handleBody(e.target.value)}
        placeholder="Start writing…"
        style={{
          flex: 1, background: 'none', border: 'none', outline: 'none',
          resize: 'none', width: '100%', padding: 0, minHeight: 280,
          color: '#C8BFB5', fontSize: '0.95rem', lineHeight: 1.85,
          fontFamily: '"DM Sans", sans-serif',
        }}
        onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300)}
      />

      {/* Footer meta */}
      <div style={{ marginTop: 24, paddingTop: 10, borderTop: '0.5px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#4A4540', letterSpacing: '0.1em' }}>
          {format(parseISO(note.updatedAt), "EEEE d MMMM yyyy '·' HH:mm")}
        </p>
      </div>
    </div>
  )
}

// ─── Main Notes Page ──────────────────────────────────────────────────────────
export default function Notes() {
  const { notes, addNote, updateNote, deleteNote } = useStore()
  const [filter, setFilter]       = useState('all')
  const [search, setSearch]       = useState('')
  const [activeNote, setActiveNote] = useState(null)
  const [deleteId, setDeleteId]   = useState(null)

  function createNote() {
    const n = addNote({ title: '', body: '', category: 'personal' })
    setActiveNote(n)
  }

  const filtered = notes.filter(n => {
    if (filter !== 'all' && n.category !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return n.title.toLowerCase().includes(q) || n.body?.toLowerCase().includes(q)
    }
    return true
  }).sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned - a.pinned
    return b.updatedAt.localeCompare(a.updatedAt)
  })

  return (
    <SectionShell accent="#B87FD8" bgImage={bgImg}>
      {!activeNote && (
        <PageHeader subtitle="NOTE SYSTEM" title="Notes" accent="#B87FD8">
          <button onClick={createNote} style={{
            background: 'rgba(184,127,216,0.12)', border: '0.5px solid rgba(184,127,216,0.5)',
            color: '#B87FD8', borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.12em',
          }}>
            <Plus size={14} strokeWidth={2} /> NEW
          </button>
        </PageHeader>
      )}
    <div className="p-4 md:p-6 max-w-2xl">

      {/* ── Editor view ─────────────────────────────────────── */}
      {activeNote ? (
        <NoteEditor
          note={activeNote}
          onUpdate={(id, data) => {
            updateNote(id, data)
            // Keep activeNote in sync with title/body changes for display
            setActiveNote(prev => ({ ...prev, ...data, updatedAt: new Date().toISOString() }))
          }}
          onBack={() => setActiveNote(null)}
          onDelete={(id) => { setDeleteId(id); setActiveNote(null) }}
        />
      ) : (
        /* ── List view ───────────────────────────────────────── */
        <>
          <div className="mb-6" />

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5C5650' }} />
            <input className="input" style={{ paddingLeft: 34 }} placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5 flex-wrap mb-5">
            {['all', ...Object.keys(CATEGORIES)].map(k => (
              <button key={k} onClick={() => setFilter(k)} className={`chip ${filter === k ? 'active' : ''}`}>
                {k === 'all' ? 'All' : CATEGORIES[k]?.label}
              </button>
            ))}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <button onClick={createNote}
              className="card w-full"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '40px 20px', borderStyle: 'dashed', borderColor: 'rgba(201,180,154,0.12)', cursor: 'pointer' }}>
              <BookOpen size={22} style={{ color: '#4A4540' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1rem', color: '#6A6258', marginBottom: 5 }}>
                  {search ? 'No notes match your search' : 'Nothing written yet'}
                </p>
                {!search && (
                  <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#4A4540', letterSpacing: '0.1em' }}>
                    TAP TO START A NEW NOTE
                  </p>
                )}
              </div>
            </button>
          )}

          {/* Note list */}
          {filtered.length > 0 && (
            <div className="space-y-2">
              {filtered.map((n, i) => {
                const accent = CATEGORIES[n.category]?.color || '#C9B49A'
                const anim = i % 2 === 0
                  ? `phase-in-left 1.1s cubic-bezier(0.22,1,0.36,1) ${0.2 + i * 0.08}s both`
                  : `phase-in-right 1.1s cubic-bezier(0.22,1,0.36,1) ${0.2 + i * 0.08}s both`
                return (
                  <button key={n.id}
                    onClick={() => setActiveNote(n)}
                    className="card w-full text-left"
                    style={{ padding: 0, overflow: 'hidden', animation: anim }}>
                    {/* Left accent stripe + top bar */}
                    <div style={{ display: 'flex', alignItems: 'stretch' }}>
                      <div style={{ width: 3, flexShrink: 0, background: accent, boxShadow: `0 0 8px ${accent}80` }} />
                      <div style={{ flex: 1 }}>
                      <div style={{ height: 1.5, background: `linear-gradient(to right, ${accent}CC, ${accent}30, transparent)` }} />
                    <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          {n.pinned && <Pin size={10} style={{ color: '#C9B49A', flexShrink: 0 }} />}
                          <p style={{
                            fontFamily: '"Playfair Display", serif',
                            fontStyle: n.title ? 'italic' : 'normal',
                            fontWeight: 600, fontSize: '0.95rem',
                            color: n.title ? '#EDE8E0' : '#4A4540',
                            lineHeight: 1.3,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {n.title || 'Untitled'}
                          </p>
                        </div>
                        {n.body && (
                          <p style={{
                            fontFamily: '"DM Mono", monospace', fontSize: '0.58rem',
                            color: '#6A6258', lineHeight: 1.55,
                            overflow: 'hidden', display: '-webkit-box',
                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          }}>
                            {n.body.slice(0, 140)}
                          </p>
                        )}
                        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#3A3530', letterSpacing: '0.08em', marginTop: 6 }}>
                          {format(parseISO(n.updatedAt), 'd MMM yyyy')}
                        </p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                        <button
                          onClick={e => { e.stopPropagation(); updateNote(n.id, { pinned: !n.pinned }) }}
                          style={{ color: n.pinned ? '#C9B49A' : '#3A3530', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'block' }}>
                          <Pin size={13} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteId(n.id) }}
                          style={{ color: '#3A3530', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'block' }}
                          className="hover:text-red-400 transition-colors">
                          <Trash2 size={13} />
                        </button>
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

      {deleteId && (
        <ConfirmDialog title="Delete Note" message="Delete this note? This cannot be undone."
          onConfirm={() => { deleteNote(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)} />
      )}
    </div>
    </SectionShell>
  )
}
