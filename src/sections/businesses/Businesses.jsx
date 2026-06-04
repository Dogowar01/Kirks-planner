import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, ExternalLink, Bell } from 'lucide-react'
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

function ProjectCard({ project, tasks, events, onDelete, onEdit }) {
  const [open, setOpen] = useState(false)
  const linked = tasks.filter(t => t.projectId === project.id && !t.done)

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
        <div className="mt-4 space-y-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
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
          {linked.length > 0 && (
            <div>
              <p className="text-text-tertiary text-[10px] uppercase tracking-wide mb-2">Open Tasks</p>
              <div className="space-y-1">
                {linked.map(t => (
                  <div key={t.id} className="flex items-center gap-2 text-xs text-text-secondary">
                    <div className="w-3 h-3 rounded border border-text-tertiary shrink-0" />
                    {t.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BusinessSection({ bizId, biz }) {
  const { projects, tasks, events, addProject, updateProject, deleteProject, updateSettings, settings } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [editNote, setEditNote] = useState(false)
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
  return (
    <SectionShell accent="#C4522A" bgImage={bgImg}>
    <div className="p-4 md:p-6 max-w-2xl space-y-10">
      <h1 className="section-title" style={{ color: '#C4522A' }}>Businesses</h1>
      {Object.entries(BUSINESSES).map(([id, biz]) => (
        <BusinessSection key={id} bizId={id} biz={biz} />
      ))}
    </div>
    </SectionShell>
  )
}
