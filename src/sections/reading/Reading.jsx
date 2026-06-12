import { useState, useMemo } from 'react'
import { Plus, X, Pencil, Star } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import SectionShell from '../../components/SectionShell'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import bgImg from '../../assets/art-vintage-woman.webp'

const ACCENT = '#3B82F6'

const STATUSES = [
  { id: 'reading',  label: 'Reading',    color: '#3EC88A' },
  { id: 'finished', label: 'Finished',   color: '#3B82F6' },
  { id: 'want',     label: 'Want to Read', color: '#F09030' },
]

const TYPES = [
  { id: 'research', label: 'Research',  color: '#00C8FF' },
  { id: 'craft',    label: 'Craft',     color: '#A855F7' },
  { id: 'pleasure', label: 'Pleasure',  color: '#EC4899' },
]

function nextStatus(current) {
  const idx = STATUSES.findIndex(s => s.id === current)
  return STATUSES[(idx + 1) % STATUSES.length].id
}

// ── Star rating ───────────────────────────────────────────────────────────
function StarRating({ rating, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type={onChange ? 'button' : undefined} onClick={onChange ? () => onChange(n === rating ? 0 : n) : undefined}
          style={{ background: 'none', border: 'none', cursor: onChange ? 'pointer' : 'default', padding: 2 }}>
          <Star size={14} color={n <= rating ? '#F5C842' : '#2A2520'} fill={n <= rating ? '#F5C842' : 'none'} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  )
}

// ── Book card ─────────────────────────────────────────────────────────────
function BookCard({ book, onEdit, onDelete, onStatusChange, index }) {
  const statusObj = STATUSES.find(s => s.id === book.status) || STATUSES[0]
  const typeObj = TYPES.find(t => t.id === book.type) || TYPES[2]
  const anim = index % 2 === 0
    ? `phase-in-left 0.7s cubic-bezier(0.22,1,0.36,1) ${index * 0.05}s both`
    : `phase-in-right 0.7s cubic-bezier(0.22,1,0.36,1) ${index * 0.05}s both`

  return (
    <div style={{
      background: 'rgba(14,12,11,0.85)', border: '0.5px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '14px', animation: anim,
      clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: '1rem', color: '#EDE8E0', lineHeight: 1.3, marginBottom: 3 }}>
            {book.title}
          </p>
          {book.author && (
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#6A6258', letterSpacing: '0.06em' }}>
              {book.author}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0, paddingLeft: 8 }}>
          <button onClick={() => onEdit(book)} style={{ color: '#4A4540', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Pencil size={12} />
          </button>
          <button onClick={() => onDelete(book.id)} style={{ color: '#4A4540', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={12} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Type badge */}
          <span style={{
            fontFamily: '"DM Mono", monospace', fontSize: '0.4rem', letterSpacing: '0.1em',
            color: typeObj.color, background: `${typeObj.color}15`,
            border: `0.5px solid ${typeObj.color}40`, borderRadius: 99, padding: '2px 8px',
          }}>{typeObj.label}</span>
          {/* Rating */}
          {book.rating > 0 && <StarRating rating={book.rating} />}
        </div>

        {/* Status cycle badge */}
        <button onClick={() => onStatusChange(book.id, nextStatus(book.status))} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', letterSpacing: '0.1em',
          color: statusObj.color, background: `${statusObj.color}12`,
          border: `0.5px solid ${statusObj.color}45`, borderRadius: 99,
          padding: '4px 10px', cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.2s',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusObj.color, boxShadow: `0 0 4px ${statusObj.color}` }} />
          {statusObj.label}
        </button>
      </div>

      {book.note && (
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#6A6258', lineHeight: 1.6, marginTop: 10, borderTop: '0.5px solid rgba(255,255,255,0.04)', paddingTop: 8 }}>
          {book.note}
        </p>
      )}
    </div>
  )
}

// ── Book form ─────────────────────────────────────────────────────────────
function BookForm({ initial = {}, onSave, onClose }) {
  const [form, setForm] = useState({ title: '', author: '', type: 'pleasure', status: 'want', rating: 0, note: '', ...initial })
  const f = k => e => setForm(s => ({ ...s, [k]: e.target.value }))
  const labelStyle = { fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', color: '#A09890', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={labelStyle}>Title *</label>
        <input required className="input" value={form.title} onChange={f('title')} placeholder="Book or article title" />
      </div>
      <div>
        <label style={labelStyle}>Author</label>
        <input className="input" value={form.author} onChange={f('author')} placeholder="Author name" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Type</label>
          <select className="input" value={form.type} onChange={f('type')}>
            {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select className="input" value={form.status} onChange={f('status')}>
            {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={labelStyle}>Rating</label>
        <StarRating rating={form.rating} onChange={r => setForm(s => ({ ...s, rating: r }))} />
      </div>
      <div>
        <label style={labelStyle}>Notes</label>
        <textarea className="input" style={{ resize: 'none', minHeight: 72 }} value={form.note} onChange={f('note')} placeholder="Key takeaways, quotes, thoughts…" />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary"><Plus size={14} /> Save</button>
      </div>
    </form>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function Reading() {
  const { reading, addBook, updateBook, deleteBook } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [activeTab, setActiveTab] = useState('reading')

  const filtered = useMemo(() =>
    [...reading].filter(b => b.status === activeTab).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [reading, activeTab]
  )

  const countFor = id => reading.filter(b => b.status === id).length

  return (
    <SectionShell accent={ACCENT} bgImage={bgImg}>
      <PageHeader subtitle="READING LOG" title="Reading" accent={ACCENT} showBack>
        <button onClick={() => setShowAdd(true)} style={{
          background: 'rgba(59,130,246,0.1)', border: '0.5px solid rgba(59,130,246,0.45)',
          color: ACCENT, borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.12em',
        }}>
          <Plus size={14} /> ADD BOOK
        </button>
      </PageHeader>

      <div className="p-4 md:p-6 max-w-2xl">

        {/* Status tabs */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid rgba(255,255,255,0.07)', marginBottom: 18, gap: 2 }}>
          {STATUSES.map(s => {
            const active = activeTab === s.id
            const count = countFor(s.id)
            return (
              <button key={s.id} onClick={() => setActiveTab(s.id)} style={{
                flex: 1, fontFamily: '"DM Mono", monospace', fontSize: '0.46rem',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '9px 4px 10px', border: 'none', cursor: 'pointer',
                background: 'transparent', color: active ? s.color : '#4A4540',
                borderBottom: active ? `2px solid ${s.color}` : '2px solid transparent',
                transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              }}>
                {s.label}
                <span style={{
                  fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', fontWeight: 700,
                  color: active ? s.color : '#2A2520',
                  background: active ? `${s.color}18` : 'transparent',
                  borderRadius: 99, padding: '0 5px', minWidth: 18, textAlign: 'center',
                }}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* Type summary */}
        {reading.length > 0 && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            {TYPES.map(t => {
              const cnt = reading.filter(b => b.type === t.id).length
              return (
                <span key={t.id} style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', color: t.color }}>
                  {t.label} {cnt}
                </span>
              )
            })}
          </div>
        )}

        {/* Book grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.1rem', color: '#3A3530', marginBottom: 8 }}>
              {activeTab === 'reading' ? 'Nothing currently reading' : activeTab === 'finished' ? 'No finished books yet' : 'Your reading list is empty'}
            </p>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#2A2520', letterSpacing: '0.1em' }}>ADD A BOOK TO GET STARTED</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((book, i) => (
              <BookCard key={book.id} book={book} index={i}
                onEdit={setEditing}
                onDelete={setDeleteId}
                onStatusChange={(id, status) => updateBook(id, { status })} />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <Modal title="Add Book" onClose={() => setShowAdd(false)}>
          <BookForm onSave={data => { addBook(data); setShowAdd(false) }} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Book" onClose={() => setEditing(null)}>
          <BookForm initial={editing} onSave={data => { updateBook(editing.id, data); setEditing(null) }} onClose={() => setEditing(null)} />
        </Modal>
      )}
      {deleteId && (
        <ConfirmDialog title="Remove Book" message="Remove this book from your log?"
          onConfirm={() => { deleteBook(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)} />
      )}
    </SectionShell>
  )
}
