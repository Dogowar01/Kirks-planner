import { useState } from 'react'
import { Plus, Pencil, X, ChevronRight } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import SectionShell from '../../components/SectionShell'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import bgImg from '../../assets/art-abstract.webp'

const ACCENT = '#A040E0'

const STATUSES = [
  { id: 'active',   label: 'Active',    color: '#3EC88A' },
  { id: 'planning', label: 'Planning',  color: '#00C8FF' },
  { id: 'paused',   label: 'Paused',    color: '#F09030' },
  { id: 'complete', label: 'Complete',  color: '#6A6460' },
]

const BIZ_COLORS = { signal9: '#C4522A', app: '#3B82F6', writing: '#7C3AED' }
const BIZ_LABELS = { signal9: 'Signal9', app: 'App Sales', writing: 'Writing' }

function nextStatus(current) {
  const idx = STATUSES.findIndex(s => s.id === current)
  return STATUSES[(idx + 1) % STATUSES.length].id
}

function ProjectCard({ project, onEdit, onDelete, onStatusChange, index }) {
  const bizColor  = BIZ_COLORS[project.businessId] || '#A09890'
  const statusObj = STATUSES.find(s => s.id === project.status) || STATUSES[0]
  const anim = index % 2 === 0
    ? `phase-in-left 1.1s cubic-bezier(0.22,1,0.36,1) ${0.05 + index * 0.06}s both`
    : `phase-in-right 1.1s cubic-bezier(0.22,1,0.36,1) ${0.05 + index * 0.06}s both`

  return (
    <div style={{
      background: 'rgba(14,12,11,0.88)',
      border: '0.5px solid rgba(255,255,255,0.07)',
      borderRadius: 12, overflow: 'hidden', animation: anim,
      clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)',
    }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Left accent stripe in biz colour */}
        <div style={{ width: 3, background: bizColor, boxShadow: `0 0 8px ${bizColor}80`, flexShrink: 0 }} />

        <div style={{ flex: 1, padding: '13px 14px' }}>
          {/* Title + actions */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7 }}>
            <p style={{ flex: 1, fontSize: '0.95rem', color: '#EDE8E0', fontWeight: 500, lineHeight: 1.35 }}>
              {project.name}
            </p>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0, paddingTop: 2 }}>
              <button onClick={() => onEdit(project)}
                style={{ color: '#5C5650', background: 'none', border: 'none', cursor: 'pointer', padding: 3, borderRadius: 4 }}>
                <Pencil size={13} />
              </button>
              <button onClick={() => onDelete(project.id)}
                style={{ color: '#5C5650', background: 'none', border: 'none', cursor: 'pointer', padding: 3, borderRadius: 4 }}>
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.58rem', color: '#6A6258', lineHeight: 1.6, marginBottom: 10,
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {project.description}
            </p>
          )}

          {/* Tags */}
          {project.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
              {project.tags.map(tag => (
                <span key={tag} style={{
                  fontFamily: '"DM Mono", monospace', fontSize: '0.42rem', letterSpacing: '0.07em',
                  color: `${bizColor}CC`, background: `${bizColor}15`,
                  border: `0.5px solid ${bizColor}40`, borderRadius: 999, padding: '2px 7px',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer: biz label + tappable status badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', letterSpacing: '0.1em',
              color: `${bizColor}70`, textTransform: 'uppercase',
            }}>
              {BIZ_LABELS[project.businessId] || project.businessId}
            </span>

            {/* Tap to cycle status */}
            <button
              onClick={() => onStatusChange(project.id, nextStatus(project.status))}
              title="Tap to advance status"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontFamily: '"DM Mono", monospace', fontSize: '0.46rem', letterSpacing: '0.1em',
                color: statusObj.color, background: `${statusObj.color}15`,
                border: `0.5px solid ${statusObj.color}50`, borderRadius: 99,
                padding: '4px 10px', cursor: 'pointer', textTransform: 'uppercase',
                transition: 'all 0.2s',
              }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusObj.color, boxShadow: `0 0 5px ${statusObj.color}` }} />
              {statusObj.label}
              <ChevronRight size={10} style={{ opacity: 0.5 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProjectForm({ initial = {}, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', businessId: 'signal9', status: 'active',
    description: '', tags: '',
    ...initial,
    tags: Array.isArray(initial.tags) ? initial.tags.join(', ') : (initial.tags || ''),
  })
  const f = k => e => setForm(s => ({ ...s, [k]: e.target.value }))

  return (
    <form onSubmit={e => {
      e.preventDefault()
      onSave({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) })
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
            {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
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
  const [activeTab, setActiveTab] = useState('active')
  const [filterBiz, setFilterBiz] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const filtered = projects
    .filter(p => filterBiz === 'all' || p.businessId === filterBiz)
    .filter(p => p.status === activeTab)

  const countFor = status => projects
    .filter(p => filterBiz === 'all' || p.businessId === filterBiz)
    .filter(p => p.status === status).length

  return (
    <SectionShell accent={ACCENT} bgImage={bgImg}>
      <PageHeader subtitle="PROJECT TRACKER" title="Boards" accent={ACCENT} showBack>
        <button onClick={() => setShowAdd(true)} style={{
          background: 'rgba(160,64,224,0.12)', border: '0.5px solid rgba(160,64,224,0.5)',
          color: ACCENT, borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.12em',
        }}>
          <Plus size={14} strokeWidth={2} /> PROJECT
        </button>
      </PageHeader>

      <div className="p-4 md:p-6 max-w-2xl">

        {/* Business filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
          {['all', ...Object.keys(BIZ_LABELS)].map(biz => (
            <button key={biz} onClick={() => setFilterBiz(biz)} style={{
              fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', letterSpacing: '0.12em',
              textTransform: 'uppercase', padding: '5px 11px', borderRadius: 6, cursor: 'pointer',
              background: filterBiz === biz ? `${ACCENT}20` : 'rgba(255,255,255,0.03)',
              border: `0.5px solid ${filterBiz === biz ? `${ACCENT}60` : 'rgba(255,255,255,0.07)'}`,
              color: filterBiz === biz ? ACCENT : '#5C5650', transition: 'all 0.2s',
            }}>
              {biz === 'all' ? 'All' : BIZ_LABELS[biz]}
            </button>
          ))}
        </div>

        {/* Status tabs */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid rgba(255,255,255,0.07)', marginBottom: 18, gap: 2 }}>
          {STATUSES.map(s => {
            const active = activeTab === s.id
            const count = countFor(s.id)
            return (
              <button key={s.id} onClick={() => setActiveTab(s.id)} style={{
                flex: 1, fontFamily: '"DM Mono", monospace', fontSize: '0.48rem',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '9px 4px 10px', border: 'none', cursor: 'pointer',
                background: 'transparent',
                color: active ? s.color : '#4A4540',
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
                  transition: 'all 0.2s',
                }}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* Project cards */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.1rem', color: '#3A3530', marginBottom: 8 }}>
              Nothing here
            </p>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#2A2520', letterSpacing: '0.1em' }}>
              {activeTab === 'active' ? 'ADD A PROJECT TO GET STARTED' : `NO ${activeTab.toUpperCase()} PROJECTS`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((proj, i) => (
              <ProjectCard
                key={proj.id}
                project={proj}
                index={i}
                onEdit={setEditing}
                onDelete={setDeleteId}
                onStatusChange={(id, status) => updateProject(id, { status })}
              />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <Modal title="New Project" onClose={() => setShowAdd(false)}>
          <ProjectForm onSave={data => { addProject(data); setShowAdd(false) }} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Project" onClose={() => setEditing(null)}>
          <ProjectForm initial={editing} onSave={data => { updateProject(editing.id, data); setEditing(null) }} onClose={() => setEditing(null)} />
        </Modal>
      )}
      {deleteId && (
        <ConfirmDialog title="Delete Project" message="Delete this project? This cannot be undone."
          onConfirm={() => { deleteProject(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)} />
      )}
    </SectionShell>
  )
}
