import { useState } from 'react'
import { Plus, X, Pencil, ChevronRight } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { BUSINESSES } from '../../lib/constants'
import SectionShell from '../../components/SectionShell'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import bgImg from '../../assets/art-abstract.jpg'

const ACCENT = '#A040E0'

const COLUMNS = [
  { id: 'planning', label: 'Planning',  color: '#00C8FF' },
  { id: 'active',   label: 'Active',    color: '#3EC88A' },
  { id: 'paused',   label: 'Paused',    color: '#F09030' },
  { id: 'complete', label: 'Complete',  color: '#A09890' },
]

const BIZ_COLORS = {
  signal9: '#C4522A',
  app:     '#3B82F6',
  writing: '#7C3AED',
}

const BIZ_LABELS = {
  signal9: 'Signal9',
  app:     'App Sales',
  writing: 'Writing',
}

function ProjectCard({ project, onEdit, onMove, onDelete, index }) {
  const color = BIZ_COLORS[project.businessId] || '#A09890'
  const anim = index % 2 === 0
    ? `phase-in-left 1.1s cubic-bezier(0.22,1,0.36,1) ${0.1 + index * 0.07}s both`
    : `phase-in-right 1.1s cubic-bezier(0.22,1,0.36,1) ${0.1 + index * 0.07}s both`

  return (
    <div style={{
      background: 'rgba(14,12,11,0.92)',
      border: `0.5px solid rgba(255,255,255,0.07)`,
      borderTop: `2px solid ${color}`,
      borderRadius: 10,
      padding: 0,
      overflow: 'hidden',
      animation: anim,
      clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
    }}>
      {/* Left stripe */}
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{ width: 3, background: color, boxShadow: `0 0 8px ${color}80`, flexShrink: 0 }} />
        <div style={{ flex: 1, padding: '10px 12px' }}>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
            <p style={{ flex: 1, fontSize: '0.85rem', color: '#EDE8E0', fontWeight: 500, lineHeight: 1.3 }}>
              {project.name}
            </p>
            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
              <button onClick={() => onEdit(project)}
                style={{ color: '#5C5650', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                <Pencil size={11} />
              </button>
              <button onClick={() => onDelete(project.id)}
                style={{ color: '#5C5650', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                <X size={11} />
              </button>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', color: '#6A6258', lineHeight: 1.5, marginBottom: 6,
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {project.description}
            </p>
          )}

          {/* Tags */}
          {project.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
              {project.tags.map(tag => (
                <span key={tag} style={{
                  fontFamily: '"DM Mono", monospace', fontSize: '0.4rem', letterSpacing: '0.08em',
                  color: `${color}CC`, background: `${color}15`, border: `0.5px solid ${color}40`,
                  borderRadius: 999, padding: '1px 6px',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Business + move controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontFamily: '"DM Mono", monospace', fontSize: '0.42rem', letterSpacing: '0.1em',
              color: `${color}80`, background: `${color}10`, borderRadius: 4, padding: '2px 6px',
            }}>
              {BIZ_LABELS[project.businessId] || project.businessId}
            </span>
            <div style={{ display: 'flex', gap: 3 }}>
              {COLUMNS.filter(c => c.id !== project.status).map(col => (
                <button key={col.id} onClick={() => onMove(project.id, col.id)}
                  title={`Move to ${col.label}`}
                  style={{
                    fontFamily: '"DM Mono", monospace', fontSize: '0.38rem', letterSpacing: '0.06em',
                    color: col.color, background: `${col.color}12`, border: `0.5px solid ${col.color}40`,
                    borderRadius: 4, padding: '2px 5px', cursor: 'pointer', textTransform: 'uppercase',
                  }}>
                  → {col.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProjectForm({ initial = {}, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', businessId: 'signal9', status: 'planning',
    description: '', tags: '',
    ...initial,
    tags: Array.isArray(initial.tags) ? initial.tags.join(', ') : (initial.tags || ''),
  })
  const f = k => e => setForm(s => ({ ...s, [k]: e.target.value }))

  return (
    <form onSubmit={e => {
      e.preventDefault()
      onSave({
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      })
    }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', color: '#A09890', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Project Name *</label>
        <input required className="input" value={form.name} onChange={f('name')} placeholder="Project name" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', color: '#A09890', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Business</label>
          <select className="input" value={form.businessId} onChange={f('businessId')}>
            {Object.entries(BIZ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', color: '#A09890', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Status</label>
          <select className="input" value={form.status} onChange={f('status')}>
            {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', color: '#A09890', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Description</label>
        <textarea className="input" style={{ resize: 'none', minHeight: 72 }} value={form.description} onChange={f('description')} placeholder="What is this project?" />
      </div>
      <div>
        <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', color: '#A09890', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Tags (comma-separated)</label>
        <input className="input" value={form.tags} onChange={f('tags')} placeholder="PWA, iOS, art…" />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary"><Plus size={14} /> Save</button>
      </div>
    </form>
  )
}

export default function Boards() {
  const { projects, addProject, updateProject, deleteProject } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [filterBiz, setFilterBiz] = useState('all')

  const filtered = filterBiz === 'all' ? projects : projects.filter(p => p.businessId === filterBiz)

  function byStatus(status) {
    return filtered.filter(p => p.status === status)
  }

  return (
    <SectionShell accent={ACCENT} bgImage={bgImg}>
      <PageHeader subtitle="PROJECT TRACKER" title="Boards" accent={ACCENT}>
        <button onClick={() => setShowAdd(true)} style={{
          background: `rgba(160,64,224,0.12)`, border: `0.5px solid rgba(160,64,224,0.5)`,
          color: ACCENT, borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.12em',
        }}>
          <Plus size={14} strokeWidth={2} /> PROJECT
        </button>
      </PageHeader>

      <div className="p-4 md:p-6">

        {/* Biz filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {['all', ...Object.keys(BIZ_LABELS)].map(biz => (
            <button key={biz} onClick={() => setFilterBiz(biz)}
              style={{
                fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', letterSpacing: '0.12em',
                textTransform: 'uppercase', padding: '5px 10px', borderRadius: 6,
                background: filterBiz === biz ? `${ACCENT}20` : 'rgba(255,255,255,0.03)',
                border: `0.5px solid ${filterBiz === biz ? `${ACCENT}60` : 'rgba(255,255,255,0.07)'}`,
                color: filterBiz === biz ? ACCENT : '#5C5650', cursor: 'pointer', transition: 'all 0.2s',
              }}>
              {biz === 'all' ? 'All' : BIZ_LABELS[biz]}
            </button>
          ))}
        </div>

        {/* Kanban columns — scroll horizontally on mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(220px, 1fr))', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {COLUMNS.map(col => {
            const cards = byStatus(col.id)
            return (
              <div key={col.id} style={{
                background: 'rgba(14,12,11,0.5)',
                border: `0.5px solid ${col.color}25`,
                borderTop: `2px solid ${col.color}60`,
                borderRadius: 12, padding: 10, minHeight: 120,
              }}>
                {/* Column header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: col.color, boxShadow: `0 0 6px ${col.color}` }} />
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: col.color }}>
                      {col.label}
                    </span>
                  </div>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#3A3530',
                    background: '#1A1714', borderRadius: 999, padding: '1px 7px' }}>
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cards.map((proj, i) => (
                    <ProjectCard
                      key={proj.id}
                      project={proj}
                      index={i}
                      onEdit={setEditing}
                      onMove={(id, status) => updateProject(id, { status })}
                      onDelete={setDeleteId}
                    />
                  ))}
                  {cards.length === 0 && (
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#2A2520',
                      letterSpacing: '0.1em', textAlign: 'center', padding: '20px 0' }}>
                      EMPTY
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showAdd && (
        <Modal title="New Project" onClose={() => setShowAdd(false)}>
          <ProjectForm
            onSave={data => { addProject(data); setShowAdd(false) }}
            onClose={() => setShowAdd(false)}
          />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Project" onClose={() => setEditing(null)}>
          <ProjectForm
            initial={editing}
            onSave={data => { updateProject(editing.id, data); setEditing(null) }}
            onClose={() => setEditing(null)}
          />
        </Modal>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete Project"
          message="Delete this project? This cannot be undone."
          onConfirm={() => { deleteProject(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </SectionShell>
  )
}
