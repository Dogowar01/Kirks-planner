import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ChevronDown, ChevronUp, ExternalLink, CheckSquare, LayoutGrid } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { BUSINESSES, STATUSES } from '../../lib/constants'
import StatusBadge from '../../components/StatusBadge'
import SectionShell from '../../components/SectionShell'
import bgImg from '../../assets/art-architectural.jpg'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'

function ProjectForm({ initial = {}, businessId, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', status: 'active', description: '', note: '', tags: '', links: [],
    businessId,
    ...initial,
    tags: initial.tags ? initial.tags.join(', ') : '',
  })
  const f = (k) => (e) => setForm(s => ({ ...s, [k]: e.target.value }))

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ ...form, tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Project Name *</label>
        <input required className="input" value={form.name} onChange={f('name')} placeholder="e.g. Realm Engine" />
      </div>
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Status</label>
        <select className="input" value={form.status} onChange={f('status')}>
          {Object.entries(STATUSES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Description</label>
        <input className="input" value={form.description} onChange={f('description')} placeholder="One-line description" />
      </div>
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Working Note</label>
        <textarea className="input h-24 resize-none" value={form.note} onChange={f('note')} placeholder="Where things are up to..." />
      </div>
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Tags (comma-separated)</label>
        <input className="input" value={form.tags} onChange={f('tags')} placeholder="PWA, iOS, Gumroad" />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary">Save Project</button>
      </div>
    </form>
  )
}

function ProjectTaskPanel({ project, accent, tasks, addTask, updateTask, deleteTask }) {
  const [newText, setNewText]       = useState('')
  const [newPriority, setNewPriority] = useState('normal')
  const [deleteId, setDeleteId]     = useState(null)
  const [showDone, setShowDone]     = useState(false)

  const linked   = tasks.filter(t => t.projectId === project.id)
  const open     = linked.filter(t => !t.done)
  const done     = linked.filter(t => t.done)
  const total    = linked.length
  const pct      = total > 0 ? Math.round((done.length / total) * 100) : 0

  function handleAdd(e) {
    e.preventDefault()
    if (!newText.trim()) return
    addTask({
      text: newText.trim(),
      category: project.businessId || 'personal',
      projectId: project.id,
      priority: newPriority,
    })
    setNewText('')
    setNewPriority('normal')
  }

  const priorityColor = { high: '#D85A30', normal: accent, low: '#5C5650' }

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '0.5px solid rgba(255,255,255,0.07)' }}>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1" style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
          <div style={{
            height: '100%', borderRadius: 2,
            width: `${pct}%`,
            background: pct === 100 ? '#2D9E5A' : accent,
            boxShadow: pct > 0 ? `0 0 6px ${accent}70` : 'none',
            transition: 'width 0.35s ease',
          }} />
        </div>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#A09890', flexShrink: 0 }}>
          {done.length}/{total} done{pct === 100 && total > 0 ? ' ✓' : ''}
        </p>
      </div>

      {/* Open tasks */}
      {open.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {open.map(t => (
            <div key={t.id} className="flex items-center gap-2 group">
              {/* Checkbox */}
              <button
                onClick={() => updateTask(t.id, { done: true })}
                className="shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors"
                style={{ borderColor: priorityColor[t.priority] || accent, background: 'transparent' }}>
              </button>
              {/* Text */}
              <p className="flex-1 min-w-0 truncate" style={{ fontSize: '0.8rem', color: '#C8BFB5' }}>
                {t.text}
              </p>
              {/* Priority pip */}
              {t.priority !== 'normal' && (
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem',
                  color: priorityColor[t.priority], letterSpacing: '0.08em', flexShrink: 0 }}>
                  {t.priority.toUpperCase()}
                </span>
              )}
              {/* Delete */}
              <button
                onClick={() => setDeleteId(t.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-red-400"
                style={{ color: '#5C5650' }}>
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {open.length === 0 && done.length === 0 && (
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#5C5650', marginBottom: 12 }}>
          No tasks yet — add one below
        </p>
      )}

      {/* Completed tasks toggle */}
      {done.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowDone(s => !s)}
            className="flex items-center gap-1.5 mb-1.5"
            style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#5C5650', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {showDone ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            {done.length} completed
          </button>
          {showDone && (
            <div className="space-y-1.5 opacity-50">
              {done.map(t => (
                <div key={t.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => updateTask(t.id, { done: false })}
                    className="shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors"
                    style={{ borderColor: accent, background: accent }}>
                    <span style={{ color: 'white', fontSize: '0.5rem', lineHeight: 1 }}>✓</span>
                  </button>
                  <p className="flex-1 min-w-0 truncate line-through" style={{ fontSize: '0.8rem', color: '#7A7470' }}>
                    {t.text}
                  </p>
                  <button
                    onClick={() => setDeleteId(t.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-red-400"
                    style={{ color: '#5C5650' }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick-add form */}
      <form onSubmit={handleAdd} className="flex items-center gap-2"
        style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '6px 10px',
          border: '0.5px solid rgba(255,255,255,0.06)' }}>
        <input
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: '#EDE8E0', fontFamily: '"DM Sans", sans-serif', fontSize: '0.8rem' }}
          placeholder="Add a task…"
          value={newText}
          onChange={e => setNewText(e.target.value)}
        />
        <select
          value={newPriority}
          onChange={e => setNewPriority(e.target.value)}
          className="outline-none text-xs rounded shrink-0"
          style={{ background: '#1F1C19', color: '#A09890', border: '0.5px solid rgba(255,255,255,0.08)',
            fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', padding: '2px 4px', borderRadius: 5 }}>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
        <button type="submit"
          style={{ background: accent, color: 'white', border: 'none', borderRadius: 5,
            padding: '3px 8px', cursor: 'pointer', flexShrink: 0,
            boxShadow: `0 0 8px ${accent}60` }}>
          <Plus size={13} />
        </button>
      </form>

      {deleteId && (
        <ConfirmDialog title="Delete Task" message="Delete this task? This cannot be undone."
          onConfirm={() => { deleteTask(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)} />
      )}
    </div>
  )
}

function ProjectCard({ project, tasks, events, accent, onDelete, onEdit, addTask, updateTask, deleteTask }) {
  const [open, setOpen] = useState(false)

  const linked = tasks.filter(t => t.projectId === project.id)
  const done   = linked.filter(t => t.done).length
  const total  = linked.length
  const pct    = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setOpen(s=>!s)} className="text-text-primary text-sm font-medium text-left hover:text-text-primary/80">
              {project.name}
            </button>
            <StatusBadge status={project.status} />
          </div>
          {project.description && <p className="text-text-tertiary text-xs mt-1 truncate">{project.description}</p>}

          {/* Inline mini progress bar */}
          {total > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.07)', borderRadius: 2, maxWidth: 120 }}>
                <div style={{
                  height: '100%', borderRadius: 2, width: `${pct}%`,
                  background: pct === 100 ? '#2D9E5A' : accent,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#5C5650' }}>
                {done}/{total}
              </span>
            </div>
          )}

          {project.tags?.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1.5">
              {project.tags.map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-bg-elevated text-text-tertiary">{tag}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setOpen(s=>!s)} className="p-1 text-text-tertiary hover:text-text-secondary">
            {open ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </button>
          <button onClick={() => onEdit(project)} className="p-1 text-text-tertiary hover:text-text-secondary text-xs">Edit</button>
          <button onClick={() => onDelete(project.id)} className="p-1 text-text-tertiary hover:text-red-400">
            <Trash2 size={14}/>
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {project.note && (
            <p className="text-text-secondary text-xs whitespace-pre-wrap">{project.note}</p>
          )}
          {project.links?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {project.links.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 text-xs text-app hover:underline">
                  <ExternalLink size={10}/> {l.label}
                </a>
              ))}
            </div>
          )}

          {/* Full task panel */}
          <ProjectTaskPanel
            project={project}
            accent={accent}
            tasks={tasks}
            addTask={addTask}
            updateTask={updateTask}
            deleteTask={deleteTask}
          />
        </div>
      )}
    </div>
  )
}

function BusinessSection({ bizId, biz }) {
  const { projects, tasks, events, addProject, updateProject, deleteProject,
          addTask, updateTask, deleteTask,
          updateSettings, settings } = useStore()
  const [showAdd, setShowAdd]     = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [deleteId, setDeleteId]   = useState(null)
  const [editNote, setEditNote]   = useState(false)
  const [statusNote, setStatusNote] = useState(settings?.[`${bizId}StatusNote`] || '')

  const bizProjects = projects
    .filter(p => p.businessId === bizId)
    .sort((a,b) => {
      const so = { active:0, planning:1, paused:2, 'on-hold':3, complete:4 }
      return (so[a.status]??5) - (so[b.status]??5) || b.updatedAt.localeCompare(a.updatedAt)
    })

  const activeCount = bizProjects.filter(p => p.status === 'active').length

  return (
    <section>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-1 h-10 rounded-full shrink-0 mt-1" style={{ backgroundColor: biz.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-semibold text-text-primary">{biz.label}</h2>
            <span className="text-text-tertiary text-sm">{activeCount} active</span>
          </div>
          {editNote
            ? <div className="flex gap-2 mt-1">
                <input autoFocus className="input text-xs flex-1" value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                  onBlur={() => { updateSettings({ [`${bizId}StatusNote`]: statusNote }); setEditNote(false) }}
                  onKeyDown={e => e.key === 'Enter' && e.target.blur()}
                  placeholder="Current focus or status note..." />
              </div>
            : <button onClick={() => setEditNote(true)} className="text-text-tertiary text-xs mt-1 text-left hover:text-text-secondary">
                {statusNote || 'Add a status note…'}
              </button>
          }
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-ghost text-xs shrink-0">
          <Plus size={14}/> Project
        </button>
      </div>

      <div className="space-y-2 ml-4">
        {bizProjects.length === 0
          ? <p className="text-text-tertiary text-sm">No projects yet.</p>
          : bizProjects.map(p => (
              <ProjectCard key={p.id} project={p} tasks={tasks} events={events}
                accent={biz.color}
                addTask={addTask} updateTask={updateTask} deleteTask={deleteTask}
                onDelete={(id) => setDeleteId(id)}
                onEdit={(p) => setEditProject(p)} />
            ))
        }
      </div>

      {showAdd && (
        <Modal title={`New ${biz.label} Project`} onClose={() => setShowAdd(false)}>
          <ProjectForm businessId={bizId}
            onSave={(data) => { addProject(data); setShowAdd(false) }}
            onClose={() => setShowAdd(false)} />
        </Modal>
      )}

      {editProject && (
        <Modal title="Edit Project" onClose={() => setEditProject(null)}>
          <ProjectForm initial={editProject} businessId={bizId}
            onSave={(data) => { updateProject(editProject.id, data); setEditProject(null) }}
            onClose={() => setEditProject(null)} />
        </Modal>
      )}

      {deleteId && (
        <ConfirmDialog title="Delete Project" message="Delete this project? Linked tasks will remain."
          onConfirm={() => { deleteProject(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)} />
      )}
    </section>
  )
}

export default function Businesses() {
  const navigate = useNavigate()
  return (
    <SectionShell accent="#C4522A" bgImage={bgImg}>
    <div className="p-4 md:p-6 max-w-2xl space-y-10">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="section-title">Businesses</h1>
        <button onClick={() => navigate('/hub')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', letterSpacing: '0.14em', color: 'rgba(196,82,42,0.8)', background: 'rgba(196,82,42,0.1)', border: '0.5px solid rgba(196,82,42,0.35)', borderRadius: 6, padding: '5px 9px', cursor: 'pointer', textTransform: 'uppercase' }}>
          <LayoutGrid size={11} strokeWidth={1.5} />HUB
        </button>
      </div>
      {Object.entries(BUSINESSES).map(([id, biz]) => (
        <BusinessSection key={id} bizId={id} biz={biz} />
      ))}
    </div>
    </SectionShell>
  )
}
