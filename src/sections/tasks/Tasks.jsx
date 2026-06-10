import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Plus, Bell, Trash2, ChevronDown, ChevronUp, Target, Pencil } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { CATEGORIES } from '../../lib/constants'
import SectionShell from '../../components/SectionShell'
import PageHeader from '../../components/PageHeader'
import bgImg from '../../assets/art-ethereal.jpg'
import CategoryBadge from '../../components/CategoryBadge'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import { CheckSquare } from 'lucide-react'

const CAT_FILTERS = [
  { id: 'all',      label: 'All' },
  { id: 'signal9',  label: 'Signal9' },
  { id: 'app',      label: 'App Dev' },
  { id: 'writing',  label: 'Writing' },
  { id: 'personal', label: 'Personal' },
  { id: 'reminders',label: 'Reminders' },
]

function TaskForm({ initial = {}, projects, missions, onSave, onClose }) {
  const [form, setForm] = useState({
    text: '', category: 'personal', priority: 'normal', reminder: false,
    reminderDate: '', reminderTime: '', note: '', projectId: '', missionId: '',
    ...initial
  })
  const f = (k) => (v) => setForm(s => ({ ...s, [k]: typeof v === 'object' ? v.target.value : v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Task *</label>
        <input required className="input" placeholder="What needs doing?" value={form.text} onChange={f('text')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Category</label>
          <select className="input" value={form.category} onChange={f('category')}>
            {Object.entries(CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Priority</label>
          <select className="input" value={form.priority} onChange={f('priority')}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      {projects.length > 0 && (
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Linked Project</label>
          <select className="input" value={form.projectId} onChange={f('projectId')}>
            <option value="">None</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}
      {missions.filter(m => m.status !== 'complete').length > 0 && (
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Mission</label>
          <select className="input" value={form.missionId} onChange={f('missionId')}>
            <option value="">None</option>
            {missions.filter(m => m.status !== 'complete').map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input type="checkbox" id="rem" checked={form.reminder} onChange={e => setForm(s=>({...s,reminder:e.target.checked}))} className="accent-signal9" />
        <label htmlFor="rem" className="text-text-secondary text-sm">Set reminder</label>
      </div>
      {form.reminder && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-text-secondary text-xs mb-1 block">Date</label>
            <input type="date" className="input" value={form.reminderDate} onChange={f('reminderDate')} />
          </div>
          <div>
            <label className="text-text-secondary text-xs mb-1 block">Time</label>
            <input type="time" className="input" value={form.reminderTime} onChange={f('reminderTime')} />
          </div>
        </div>
      )}
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Note</label>
        <textarea className="input h-20 resize-none" placeholder="Optional detail..." value={form.note} onChange={f('note')} />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary">Save Task</button>
      </div>
    </form>
  )
}

function TaskItem({ task, onToggle, onDelete, onEdit, projects, missions, index = 0 }) {
  const [showDetail, setShowDetail] = useState(false)
  const proj    = projects.find(p => p.id === task.projectId)
  const mission = missions?.find(m => m.id === task.missionId)
  const priorityColor = task.priority === 'high' ? '#D85A30' : task.priority === 'low' ? '#A09890' : undefined
  const catColor = CATEGORIES[task.category]?.color || '#F09030'
  const anim = index % 2 === 0
    ? `phase-in-left 1.1s cubic-bezier(0.22,1,0.36,1) ${0.2 + index * 0.08}s both`
    : `phase-in-right 1.1s cubic-bezier(0.22,1,0.36,1) ${0.2 + index * 0.08}s both`

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', animation: anim }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Left accent stripe */}
        <div style={{ width: 3, flexShrink: 0, background: catColor, boxShadow: `0 0 8px ${catColor}80` }} />
        <div style={{ flex: 1, padding: '12px 14px' }}>
      <div className="flex items-start gap-3">
        <button onClick={() => onToggle(task.id, !task.done)}
          className="mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors"
          style={{ borderColor: task.done ? CATEGORIES[task.category]?.color : CATEGORIES[task.category]?.color,
                   backgroundColor: task.done ? CATEGORIES[task.category]?.color : 'transparent' }}>
          {task.done && <span className="text-white text-[10px]">✓</span>}
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={() => setShowDetail(s=>!s)} className="text-left w-full">
            <p className={`text-sm ${task.done ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>{task.text}</p>
          </button>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <CategoryBadge category={task.category} size="xs" />
            {task.reminder && <Bell size={10} className="text-text-tertiary" />}
            {task.priority !== 'normal' && (
              <span className="text-[10px] font-medium" style={{ color: priorityColor }}>{task.priority}</span>
            )}
            {mission && (
              <span className="flex items-center gap-0.5 text-[10px]" style={{ color: '#7C3AED', fontFamily: '"DM Mono", monospace' }}>
                <Target size={8} /> {mission.title}
              </span>
            )}
            {proj && <span className="text-text-tertiary text-[10px] truncate">{proj.name}</span>}
          </div>
          {showDetail && task.note && (
            <p className="text-text-secondary text-xs mt-2 whitespace-pre-wrap">{task.note}</p>
          )}
          {showDetail && task.reminderDate && (
            <p className="text-text-tertiary text-xs mt-1 font-mono">
              Reminder: {format(parseISO(task.reminderDate), 'd MMM yyyy')}{task.reminderTime ? ` at ${task.reminderTime}` : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setShowDetail(s=>!s)} className="p-1 text-text-tertiary hover:text-text-secondary">
            {showDetail ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </button>
          <button onClick={() => onEdit(task)} className="p-1 text-text-tertiary hover:text-text-secondary transition-colors" title="Edit task">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1 text-text-tertiary hover:text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
        </div>
      </div>
    </div>
  )
}

export default function Tasks() {
  const { tasks, projects, missions = [], addTask, updateTask, deleteTask } = useStore()
  const [filter, setFilter]       = useState('all')
  const [missionFilter, setMissionFilter] = useState('')   // mission id or ''
  const [showModal, setShowModal] = useState(false)
  const [showDone, setShowDone]   = useState(false)
  const [deleteId, setDeleteId]   = useState(null)
  const [editTask, setEditTask]   = useState(null)

  const activeMissions = missions.filter(m => m.status !== 'complete')

  const filtered = tasks.filter(t => {
    if (t.done) return false
    if (missionFilter) return t.missionId === missionFilter
    if (filter === 'all') return true
    if (filter === 'reminders') return t.reminder
    return t.category === filter
  }).sort((a,b) => {
    if (a.reminder !== b.reminder) return b.reminder - a.reminder
    const pd = { high: 0, normal: 1, low: 2 }
    if (pd[a.priority] !== pd[b.priority]) return pd[a.priority] - pd[b.priority]
    return a.createdAt.localeCompare(b.createdAt)
  })

  const done = tasks.filter(t => t.done)

  return (
    <SectionShell accent="#F09030" bgImage={bgImg}>
      <PageHeader subtitle="TASK MANAGER" title="Tasks" accent="#F09030" showBack>
        <button onClick={() => setShowModal(true)} style={{
          background: 'rgba(240,144,48,0.12)', border: '0.5px solid rgba(240,144,48,0.5)',
          color: '#F09030', borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.12em',
          boxShadow: '0 0 12px rgba(212,120,10,0.1)',
        }}>
          <Plus size={14} strokeWidth={2} /> ADD
        </button>
      </PageHeader>
    <div className="p-4 md:p-6 max-w-2xl">

      {/* Category filter bar */}
      <div className="flex gap-1.5 flex-wrap mb-2">
        {CAT_FILTERS.map(f => (
          <button key={f.id} onClick={() => { setFilter(f.id); setMissionFilter('') }}
            className={`chip ${filter === f.id && !missionFilter ? 'active' : ''}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Mission filter bar */}
      {activeMissions.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-4 items-center">
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#5C5650', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Mission:
          </span>
          {activeMissions.map(m => (
            <button key={m.id}
              onClick={() => setMissionFilter(missionFilter === m.id ? '' : m.id)}
              className={`chip ${missionFilter === m.id ? 'active' : ''}`}
              style={{ '--section-accent': '#7C3AED', '--section-chip-bg': 'rgba(124,58,237,0.2)', '--section-card-border': 'rgba(124,58,237,0.4)' }}>
              <Target size={8} style={{ display: 'inline', marginRight: 3 }} />
              {m.title}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0
        ? <EmptyState icon={CheckSquare} title="No tasks" description="Add a task above or quick-add from the dashboard." />
        : <div className="space-y-2">
            {filtered.map((t, i) => (
              <TaskItem key={t.id} task={t} projects={projects} missions={missions} index={i}
                onToggle={(id, done) => updateTask(id, { done })}
                onDelete={(id) => setDeleteId(id)}
                onEdit={(t) => setEditTask(t)} />
            ))}
          </div>
      }

      {done.length > 0 && (
        <div className="mt-6">
          <button onClick={() => setShowDone(s=>!s)}
            className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-3">
            {showDone ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            Completed ({done.length})
          </button>
          {showDone && (
            <div className="space-y-2 opacity-60">
              {done.map(t => (
                <TaskItem key={t.id} task={t} projects={projects} missions={missions}
                  onToggle={(id, d) => updateTask(id, { done: d })}
                  onDelete={(id) => setDeleteId(id)}
                  onEdit={(t) => setEditTask(t)} />
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <Modal title="Add Task" onClose={() => setShowModal(false)}>
          <TaskForm projects={projects} missions={missions}
            onSave={(data) => { addTask(data); setShowModal(false) }}
            onClose={() => setShowModal(false)} />
        </Modal>
      )}

      {editTask && (
        <Modal title="Edit Task" onClose={() => setEditTask(null)}>
          <TaskForm
            initial={editTask}
            projects={projects}
            missions={missions}
            onSave={(data) => { updateTask(editTask.id, data); setEditTask(null) }}
            onClose={() => setEditTask(null)} />
        </Modal>
      )}

      {deleteId && (
        <ConfirmDialog title="Delete Task" message="Delete this task? This cannot be undone."
          onConfirm={() => { deleteTask(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)} />
      )}
    </div>
    </SectionShell>
  )
}
