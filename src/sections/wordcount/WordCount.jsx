import { useState } from 'react'
import { format, parseISO, subDays, eachDayOfInterval } from 'date-fns'
import { Plus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useStore } from '../../hooks/useStore'
import Modal from '../../components/Modal'
import EmptyState from '../../components/EmptyState'
import { PenLine } from 'lucide-react'

function streak(sessions, projectId, goal) {
  let count = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = format(subDays(today, i), 'yyyy-MM-dd')
    const dayTotal = sessions.filter(s => s.projectId === projectId && s.date === d).reduce((a, s) => a + s.count, 0)
    if (dayTotal >= goal) count++
    else if (i > 0) break
  }
  return count
}

function SessionForm({ projects, onSave, onClose }) {
  const [form, setForm] = useState({ projectId: projects[0]?.id || '', date: format(new Date(), 'yyyy-MM-dd'), count: '', note: '' })
  const f = k => e => setForm(s => ({ ...s, [k]: e.target.value }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, count: Number(form.count) }) }} className="space-y-4">
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Project *</label>
        <select required className="input" value={form.projectId} onChange={f('projectId')}>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Date</label>
          <input type="date" className="input" value={form.date} onChange={f('date')} />
        </div>
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Word Count *</label>
          <input required type="number" min="1" className="input" value={form.count} onChange={f('count')} placeholder="1000" />
        </div>
      </div>
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Session Note</label>
        <input className="input" value={form.note} onChange={f('note')} placeholder="Optional — what did you write?" />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary">Log Words</button>
      </div>
    </form>
  )
}

export default function WordCount() {
  const { projects, wordcount, addWordSession, setWordGoal, settings } = useStore()
  const [selectedProject, setSelectedProject] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const writingProjects = projects.filter(p => p.businessId === 'writing')
  const active = selectedProject || writingProjects[0]

  const { sessions = [], goals = {} } = wordcount
  const goal = goals[active?.id] || settings?.dailyWordGoal || 1000

  const today = new Date()
  const last14 = eachDayOfInterval({ start: subDays(today, 13), end: today })

  const chartData = last14.map(day => {
    const d = format(day, 'yyyy-MM-dd')
    const total = sessions
      .filter(s => s.projectId === active?.id && s.date === d)
      .reduce((a, s) => a + s.count, 0)
    return { day: format(day, 'dd'), total, date: d }
  })

  const totalWords = sessions
    .filter(s => s.projectId === active?.id)
    .reduce((a, s) => a + s.count, 0)

  const currentStreak = active ? streak(sessions, active.id, goal) : 0

  const recentSessions = sessions
    .filter(s => s.projectId === active?.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20)

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">Word Count</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={16}/> Log Session</button>
      </div>

      {writingProjects.length === 0
        ? <EmptyState icon={PenLine} title="No writing projects" description="Add a writing project in the Businesses section first." />
        : <>
            {/* Project selector */}
            <div className="flex gap-1.5 flex-wrap mb-6">
              {writingProjects.map(p => (
                <button key={p.id}
                  onClick={() => setSelectedProject(p)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${active?.id === p.id ? 'bg-writing text-white' : 'bg-bg-elevated text-text-secondary hover:text-text-primary'}`}>
                  {p.name}
                </button>
              ))}
            </div>

            {active && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="card text-center">
                    <p className="text-text-tertiary text-[10px] uppercase tracking-wide mb-1">Total Words</p>
                    <p className="text-2xl font-mono font-semibold text-text-primary">{totalWords.toLocaleString()}</p>
                  </div>
                  <div className="card text-center">
                    <p className="text-text-tertiary text-[10px] uppercase tracking-wide mb-1">Daily Goal</p>
                    <div className="flex items-center justify-center gap-1">
                      <input type="number" className="input text-center text-lg font-mono font-semibold w-24 py-0.5 px-1"
                        value={goal}
                        onChange={e => active && setWordGoal(active.id, Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="card text-center">
                    <p className="text-text-tertiary text-[10px] uppercase tracking-wide mb-1">Streak</p>
                    <p className="text-2xl font-mono font-semibold text-writing">{currentStreak} <span className="text-sm text-text-tertiary">days</span></p>
                  </div>
                </div>

                {/* Bar chart */}
                <div className="card mb-6">
                  <p className="text-text-tertiary text-xs font-medium uppercase tracking-wide mb-3">Last 14 Days</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={chartData} barSize={14}>
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6B6762' }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ background: '#282826', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: '#A8A49C' }}
                        itemStyle={{ color: '#1D9E75' }}
                        formatter={(v) => [v.toLocaleString() + ' words', '']}
                      />
                      <Bar dataKey="total" radius={[3,3,0,0]}>
                        {chartData.map((entry, i) => (
                          <Cell key={i} fill={entry.total >= goal ? '#1D9E75' : entry.total > 0 ? '#378ADD' : '#282826'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-2 justify-end">
                    <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary"><div className="w-2 h-2 rounded-sm bg-writing"/> Goal met</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary"><div className="w-2 h-2 rounded-sm bg-app"/> Some words</div>
                  </div>
                </div>

                {/* Sessions log */}
                <div>
                  <p className="text-text-tertiary text-xs font-medium uppercase tracking-wide mb-3">Session Log</p>
                  {recentSessions.length === 0
                    ? <p className="text-text-tertiary text-sm">No sessions logged yet.</p>
                    : <div className="space-y-2">
                        {recentSessions.map(s => (
                          <div key={s.id} className="card flex items-center gap-3">
                            <div className="shrink-0 text-center w-12">
                              <p className="text-text-tertiary text-[10px] font-mono">{format(parseISO(s.date), 'dd MMM')}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                              {s.note && <p className="text-text-secondary text-xs truncate">{s.note}</p>}
                            </div>
                            <p className="text-text-primary font-mono text-sm font-semibold shrink-0">
                              +{s.count.toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              </>
            )}
          </>
      }

      {showAdd && (
        <Modal title="Log Writing Session" onClose={() => setShowAdd(false)}>
          <SessionForm projects={writingProjects}
            onSave={(data) => { addWordSession(data); setShowAdd(false) }}
            onClose={() => setShowAdd(false)} />
        </Modal>
      )}
    </div>
  )
}
