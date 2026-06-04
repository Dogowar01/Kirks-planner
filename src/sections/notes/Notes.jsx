import { useState, useCallback, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { Plus, Pin, Trash2, Search } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { CATEGORIES } from '../../lib/constants'
import SectionShell from '../../components/SectionShell'
import bgImg from '../../assets/art-vintage-woman.jpg'
import CategoryBadge from '../../components/CategoryBadge'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import { BookOpen } from 'lucide-react'

function NoteEditor({ note, onUpdate, onClose, onDelete }) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [category, setCategory] = useState(note.category)
  const debounceRef = useRef(null)

  function handleBody(val) {
    setBody(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onUpdate(note.id, { title, body: val, category }), 500)
  }

  function handleTitle(val) {
    setTitle(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onUpdate(note.id, { title: val, body, category }), 500)
  }

  function handleCategory(val) {
    setCategory(val)
    onUpdate(note.id, { title, body, category: val })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-3">
        <input className="input flex-1 font-semibold text-base" value={title} onChange={e => handleTitle(e.target.value)} placeholder="Note title" />
        <select className="input w-auto text-xs" value={category} onChange={e => handleCategory(e.target.value)}>
          {Object.entries(CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <textarea
        className="input flex-1 resize-none h-64 font-mono text-sm leading-relaxed"
        value={body}
        onChange={e => handleBody(e.target.value)}
        placeholder="Start writing…"
      />
      <div className="flex gap-2 justify-between mt-4">
        <button onClick={() => onDelete(note.id)} className="btn-danger text-xs">
          <Trash2 size={14}/> Delete
        </button>
        <button onClick={() => { onUpdate(note.id, { title, body, category }); onClose() }} className="btn-primary text-xs">
          Done
        </button>
      </div>
    </div>
  )
}

export default function Notes() {
  const { notes, projects, addNote, updateNote, deleteNote } = useStore()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [editNote, setEditNote] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

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
    <SectionShell accent="#C9B49A" bgImage={bgImg}>
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title" style={{ fontStyle: 'italic', color: '#C9B49A' }}>Notes</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={16}/> New Note</button>
      </div>

      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input className="input pl-8" placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="flex gap-1.5 flex-wrap mb-4">
        {['all', ...Object.keys(CATEGORIES)].map(k => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === k ? 'bg-signal9 text-white' : 'bg-bg-elevated text-text-secondary hover:text-text-primary'}`}>
            {k === 'all' ? 'All' : CATEGORIES[k]?.label}
          </button>
        ))}
      </div>

      {filtered.length === 0
        ? <EmptyState icon={BookOpen} title="No notes" description="Capture ideas, context, and reference material here." />
        : <div className="space-y-2">
            {filtered.map(n => (
              <div key={n.id} className="card cursor-pointer hover:bg-bg-elevated transition-colors"
                   onClick={() => setEditNote(n)}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {n.pinned && <Pin size={10} className="text-signal9 shrink-0" />}
                      <p className="text-text-primary text-sm font-medium truncate">{n.title}</p>
                    </div>
                    {n.body && <p className="text-text-tertiary text-xs truncate">{n.body.slice(0,100)}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <CategoryBadge category={n.category} size="xs" />
                      <span className="text-text-tertiary text-[10px] font-mono">
                        {format(parseISO(n.updatedAt), 'd MMM yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={e => { e.stopPropagation(); updateNote(n.id, { pinned: !n.pinned }) }}
                      className={`p-1 transition-colors ${n.pinned ? 'text-signal9' : 'text-text-tertiary hover:text-text-secondary'}`}>
                      <Pin size={14}/>
                    </button>
                    <button onClick={e => { e.stopPropagation(); setDeleteId(n.id) }}
                      className="p-1 text-text-tertiary hover:text-red-400">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
      }

      {showAdd && (
        <Modal title="New Note" onClose={() => setShowAdd(false)} size="lg">
          <div className="space-y-3">
            <select className="input" id="new-cat">
              {Object.entries(CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input className="input font-semibold" id="new-title" placeholder="Note title *" />
            <textarea className="input h-40 resize-none font-mono text-sm" id="new-body" placeholder="Start writing…" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
              <button onClick={() => {
                const title = document.getElementById('new-title').value.trim()
                const body = document.getElementById('new-body').value
                const category = document.getElementById('new-cat').value
                if (!title) return
                const n = addNote({ title, body, category })
                setEditNote(n)
                setShowAdd(false)
              }} className="btn-primary">Create</button>
            </div>
          </div>
        </Modal>
      )}

      {editNote && (
        <Modal title="Edit Note" onClose={() => setEditNote(null)} size="lg">
          <NoteEditor note={editNote}
            onUpdate={(id, data) => { updateNote(id, data); setEditNote(n => ({ ...n, ...data })) }}
            onClose={() => setEditNote(null)}
            onDelete={(id) => { setDeleteId(id); setEditNote(null) }} />
        </Modal>
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
