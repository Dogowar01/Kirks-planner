import { useState, useMemo } from 'react'
import { Moon, Plus, Trash2, Star } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import SectionShell from '../../components/SectionShell'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import bgImg from '../../assets/art-ethereal.jpg'

const ACCENT = '#6366F1'

const QUALITY_LABELS = ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Great']
const QUALITY_COLORS = ['', '#FF4D6A', '#F97316', '#F5C842', '#3EC88A', '#00C8FF']

function pad(n) { return String(n).padStart(2, '0') }

function calcDuration(bedtime, waketime) {
  if (!bedtime || !waketime) return null
  const [bh, bm] = bedtime.split(':').map(Number)
  const [wh, wm] = waketime.split(':').map(Number)
  let mins = (wh * 60 + wm) - (bh * 60 + bm)
  if (mins < 0) mins += 24 * 60
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return { h, m, total: mins }
}

function DurationBadge({ bedtime, waketime }) {
  const d = calcDuration(bedtime, waketime)
  if (!d) return null
  const color = d.total >= 420 ? '#3EC88A' : d.total >= 300 ? '#F5C842' : '#FF4D6A'
  return (
    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', fontWeight: 700, color, textShadow: `0 0 8px ${color}60` }}>
      {d.h}h {pad(d.m)}m
    </span>
  )
}

function QualityStars({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={onChange ? () => onChange(n === value ? 0 : n) : undefined}
          style={{ background: 'none', border: 'none', cursor: onChange ? 'pointer' : 'default', padding: 2 }}>
          <Star size={16} color={n <= value ? '#F5C842' : '#2A2520'} fill={n <= value ? '#F5C842' : 'none'} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  )
}

function SleepCard({ log, onDelete, index }) {
  const anim = index % 2 === 0
    ? `phase-in-left 0.7s cubic-bezier(0.22,1,0.36,1) ${index * 0.04}s both`
    : `phase-in-right 0.7s cubic-bezier(0.22,1,0.36,1) ${index * 0.04}s both`
  const qColor = QUALITY_COLORS[log.quality] || '#A09890'

  return (
    <div style={{
      background: 'rgba(14,12,11,0.85)', border: '0.5px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '14px 16px', animation: anim,
      clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: `${ACCENT}80`, letterSpacing: '0.12em' }}>
              {new Date(log.date + 'T12:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)', display: 'inline-block' }} />
            <DurationBadge bedtime={log.bedtime} waketime={log.waketime} />
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: log.notes ? 8 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: 'rgba(160,140,120,0.5)', letterSpacing: '0.1em' }}>BED</span>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.85rem', color: '#EDE8E0' }}>{log.bedtime || '--:--'}</span>
            </div>
            <Moon size={14} color={`${ACCENT}60`} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: 'rgba(160,140,120,0.5)', letterSpacing: '0.1em' }}>WAKE</span>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.85rem', color: '#EDE8E0' }}>{log.waketime || '--:--'}</span>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <QualityStars value={log.quality} />
              {log.quality > 0 && (
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: qColor, letterSpacing: '0.08em' }}>
                  {QUALITY_LABELS[log.quality]}
                </span>
              )}
            </div>
          </div>
          {log.notes && (
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: 'rgba(160,140,120,0.6)', margin: 0, lineHeight: 1.5 }}>
              {log.notes}
            </p>
          )}
        </div>
        <button onClick={() => onDelete(log.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,77,106,0.4)', padding: '2px 4px', marginLeft: 8, flexShrink: 0 }}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

const EMPTY_FORM = { date: new Date().toISOString().slice(0,10), bedtime: '22:30', waketime: '06:30', quality: 4, notes: '' }

export default function Sleep() {
  const { sleep, addSleepLog, deleteSleepLog } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const sorted = useMemo(() => [...sleep].sort((a,b) => b.date.localeCompare(a.date)), [sleep])

  const avgDuration = useMemo(() => {
    const recent = sorted.slice(0, 7).map(l => calcDuration(l.bedtime, l.waketime)).filter(Boolean)
    if (!recent.length) return null
    const avg = Math.round(recent.reduce((s,d) => s + d.total, 0) / recent.length)
    return { h: Math.floor(avg / 60), m: avg % 60 }
  }, [sorted])

  const avgQuality = useMemo(() => {
    const recent = sorted.slice(0, 7).filter(l => l.quality > 0)
    if (!recent.length) return null
    return (recent.reduce((s,l) => s + l.quality, 0) / recent.length).toFixed(1)
  }, [sorted])

  const save = () => {
    if (!form.bedtime || !form.waketime) return
    addSleepLog({ ...form })
    setShowForm(false)
    setForm(EMPTY_FORM)
  }

  const inputStyle = {
    background: 'rgba(13,12,11,0.9)', border: `1px solid ${ACCENT}30`, borderRadius: 8,
    color: '#EDE8E0', fontFamily: '"DM Mono", monospace', fontSize: '0.85rem',
    padding: '0.55rem 0.75rem', outline: 'none', width: '100%', boxSizing: 'border-box', colorScheme: 'dark',
  }
  const label = (text) => (
    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: `${ACCENT}80`, display: 'block', marginBottom: '0.3rem' }}>{text}</span>
  )

  return (
    <SectionShell accent={ACCENT} bgImage={bgImg}>
      <PageHeader subtitle="HEALTH" title="Sleep Tracker" accent={ACCENT} showBack>
        <button onClick={() => { setShowForm(true); setForm(EMPTY_FORM) }}
          style={{ background: `${ACCENT}20`, border: `1px solid ${ACCENT}50`, color: ACCENT, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} />LOG
        </button>
      </PageHeader>

      <div className="p-4 max-w-2xl" style={{ paddingBottom: '3rem' }}>

        {/* Stats strip */}
        {sorted.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { label: '7-DAY AVG', value: avgDuration ? `${avgDuration.h}h ${pad(avgDuration.m)}m` : '—', color: '#3EC88A' },
              { label: 'AVG QUALITY', value: avgQuality ? `${avgQuality}/5` : '—', color: '#F5C842' },
              { label: 'LOGS', value: sorted.length, color: ACCENT },
            ].map(({ label: l, value, color }) => (
              <div key={l} style={{ background: 'rgba(14,12,11,0.8)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.42rem', color: 'rgba(160,140,120,0.5)', letterSpacing: '0.18em', marginBottom: 4 }}>{l}</div>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '1rem', fontWeight: 700, color, textShadow: `0 0 10px ${color}50` }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Log list */}
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: `${ACCENT}40` }}>
            <Moon size={32} style={{ margin: '0 auto 1rem', display: 'block' }} />
            <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.1rem', marginBottom: '0.5rem', color: `${ACCENT}60` }}>No sleep logs yet</p>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.1em' }}>Tap LOG to record last night</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sorted.map((log, i) => (
              <SleepCard key={log.id} log={log} onDelete={setDeleteId} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Log form modal */}
      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.3rem', color: ACCENT, margin: '0 0 1.5rem', textShadow: `0 0 16px ${ACCENT}50` }}>Log Sleep</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>{label('Date')}<input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} style={inputStyle} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>{label('Bedtime')}<input type="time" value={form.bedtime} onChange={e => setForm(f => ({...f, bedtime: e.target.value}))} style={inputStyle} /></div>
              <div>{label('Wake Time')}<input type="time" value={form.waketime} onChange={e => setForm(f => ({...f, waketime: e.target.value}))} style={inputStyle} /></div>
            </div>
            {form.bedtime && form.waketime && (
              <div style={{ textAlign: 'center', padding: '8px', background: `${ACCENT}10`, borderRadius: 8, border: `0.5px solid ${ACCENT}30` }}>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: `${ACCENT}70`, letterSpacing: '0.1em' }}>DURATION · </span>
                <DurationBadge bedtime={form.bedtime} waketime={form.waketime} />
              </div>
            )}
            <div>
              {label('Quality')}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <QualityStars value={form.quality} onChange={q => setForm(f => ({...f, quality: q}))} />
                {form.quality > 0 && <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: QUALITY_COLORS[form.quality] }}>{QUALITY_LABELS[form.quality]}</span>}
              </div>
            </div>
            <div>{label('Notes (optional)')}<textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} placeholder="Dreams, interruptions, anything notable..." style={{ ...inputStyle, resize: 'vertical' }} /></div>
          </div>
          <button onClick={save} style={{ marginTop: '1.5rem', width: '100%', background: `linear-gradient(135deg, ${ACCENT}40, ${ACCENT}22)`, border: `1px solid ${ACCENT}70`, borderRadius: 10, color: ACCENT, fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1rem', padding: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
            Save Log
          </button>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteId}
        message="Delete this sleep log?"
        onConfirm={() => { deleteSleepLog(deleteId); setDeleteId(null) }}
        onCancel={() => setDeleteId(null)}
        accent={ACCENT}
      />
    </SectionShell>
  )
}
