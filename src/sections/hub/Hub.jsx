import { useNavigate } from 'react-router-dom'
import { useStore } from '../../hooks/useStore'
import { format, isToday, startOfWeek, endOfWeek } from 'date-fns'
import HoloRings from '../../components/HoloRings'

const ACCENT = '#C4522A'

const SECTIONS = [
  // Daily
  {
    group: 'Daily',
    items: [
      { to: '/dashboard',  label: 'Dashboard',       emoji: '◉', desc: 'Overview & live feed',    color: '#C4522A' },
      { to: '/habits',     label: 'Habits',           emoji: '⚡', desc: 'Daily streak tracker',    color: '#F09030' },
      { to: '/journal',    label: 'Journal',          emoji: '✦', desc: 'Reflections & moods',      color: '#8B5CF6' },
      { to: '/routine',    label: 'Morning Routine',  emoji: '☀', desc: 'Daily startup sequence',   color: '#F5C842' },
      { to: '/focus',      label: 'Focus Mode',       emoji: '◎', desc: 'Work mode selector',       color: '#00C8FF' },
      { to: '/ambient',    label: 'Ambient Clock',    emoji: '◈', desc: 'Fullscreen time display',  color: '#C4522A' },
    ],
  },
  // Creative
  {
    group: 'Creative',
    items: [
      { to: '/writing',    label: 'Writing Tracker',  emoji: '✍', desc: 'Word count & sessions',    color: '#7C3AED' },
      { to: '/reading',    label: 'Reading Log',      emoji: '📖', desc: 'Books & research',         color: '#3B82F6' },
      { to: '/review',     label: 'Weekly Review',    emoji: '◑', desc: 'Wins, focus & reflection', color: '#3EC88A' },
      { to: '/notes',      label: 'Notes',            emoji: '⊡', desc: 'Capture & organise',       color: '#A09890' },
    ],
  },
  // Work
  {
    group: 'Work & Projects',
    items: [
      { to: '/tasks',      label: 'Tasks',            emoji: '✓', desc: 'To-do list & reminders',  color: '#3EC88A' },
      { to: '/boards',     label: 'Boards',           emoji: '▦', desc: 'Project status tracker',   color: '#A040E0' },
      { to: '/calendar',   label: 'Calendar',         emoji: '▷', desc: 'Events & scheduling',      color: '#3B82F6' },
    ],
  },
  // Life
  {
    group: 'Life & Money',
    items: [
      { to: '/ledger',     label: 'Ledger',           emoji: '₿', desc: 'Income & expenses',        color: '#3EC88A' },
      { to: '/fuel',       label: 'Fuel Tracker',     emoji: '◬', desc: 'Vehicle & fill logs',      color: '#F09030' },
      { to: '/contacts',   label: 'Contacts',         emoji: '◷', desc: 'People & quick dial',      color: '#EC4899' },
      { to: '/vault',      label: 'Vault',            emoji: '⌁', desc: 'Secure storage',           color: '#6366F1' },
    ],
  },
  // Tools
  {
    group: 'Utilities',
    items: [
      { to: '/tools',      label: 'Tools',            emoji: '⚙', desc: 'Calculator, clocks & more', color: '#A09890' },
      { to: '/settings',   label: 'Settings',         emoji: '◈', desc: 'App preferences',           color: '#5C5650' },
    ],
  },
]

function HubTile({ item, onClick, index }) {
  const delay = 0.04 + index * 0.04
  return (
    <button
      onClick={onClick}
      style={{
        background: 'rgba(13,12,11,0.85)',
        border: `0.5px solid ${item.color}28`,
        borderRadius: 14,
        padding: '16px 14px 14px',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        animation: `phase-in 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
        transition: 'background 0.2s, border-color 0.2s, transform 0.15s',
        clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `${item.color}12`
        e.currentTarget.style.borderColor = `${item.color}55`
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(13,12,11,0.85)'
        e.currentTarget.style.borderColor = `${item.color}28`
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Corner accent */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderBottom: `0.5px solid ${item.color}40`, borderLeft: `0.5px solid ${item.color}40` }} />

      <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{item.emoji}</span>
      <div>
        <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: '0.9rem', color: item.color, marginBottom: 3, lineHeight: 1.2 }}>
          {item.label}
        </p>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', color: '#5C5650', letterSpacing: '0.08em', lineHeight: 1.5 }}>
          {item.desc}
        </p>
      </div>
    </button>
  )
}

export default function Hub() {
  const navigate = useNavigate()
  const { tasks, habits, habitLogs, routine, routineLog, writing } = useStore()
  const today = format(new Date(), 'yyyy-MM-dd')

  // Quick stats
  const todayTasks = tasks.filter(t => !t.done).length
  const todayLogs = habitLogs.filter(l => l.date === today)
  const habitsDone = todayLogs.length
  const habitsTotal = habits.length
  const todayLog = routineLog.find(l => l.date === today)
  const routineDone = todayLog ? todayLog.completed.length : 0
  const routineTotal = routine.length

  // Words today
  const wordsToday = writing.filter(s => s.date === today).reduce((sum, s) => sum + (s.words || 0), 0)

  // Week words
  const ws = startOfWeek(new Date(), { weekStartsOn: 1 })
  const we = endOfWeek(new Date(), { weekStartsOn: 1 })
  const weekSessions = writing.filter(s => {
    const d = new Date(s.date)
    return d >= ws && d <= we
  })
  const wordsWeek = weekSessions.reduce((sum, s) => sum + (s.words || 0), 0)

  let tileIndex = 0

  return (
    <div style={{ minHeight: '100vh', background: '#080706', position: 'relative', overflow: 'hidden' }}>

      {/* Ambient rings */}
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 0 }}>
        <HoloRings color="#C4522A" size={Math.min(typeof window !== 'undefined' ? window.innerWidth * 1.1 : 600, 700)} style={{ opacity: 0.08, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      </div>

      {/* Grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `linear-gradient(rgba(196,82,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(196,82,42,0.04) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 40px' }}>

        {/* Header */}
        <div style={{
          padding: '20px 20px 18px',
          background: 'linear-gradient(to bottom, rgba(8,7,6,0.99) 0%, rgba(13,12,11,0.92) 100%)',
          backdropFilter: 'blur(24px)',
          borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.38rem', color: `${ACCENT}70`, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 4 }}>
            ■ NAVIGATION HUB
          </p>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: '1.5rem', color: ACCENT, margin: 0, textShadow: `0 0 20px ${ACCENT}40` }}>
            Signal9
          </h1>

          {/* Quick stats strip */}
          <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
            {[
              { label: 'TASKS OPEN', value: todayTasks, color: '#3EC88A' },
              { label: 'HABITS TODAY', value: `${habitsDone}/${habitsTotal}`, color: '#F09030' },
              { label: 'ROUTINE', value: routineTotal > 0 ? `${routineDone}/${routineTotal}` : '—', color: '#F5C842' },
              { label: 'WORDS TODAY', value: wordsToday.toLocaleString(), color: '#7C3AED' },
              { label: 'THIS WEEK', value: wordsWeek.toLocaleString(), color: '#00C8FF' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.38rem', color: '#4A4540', letterSpacing: '0.14em' }}>{s.label}</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', color: s.color, fontWeight: 600 }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Holographic bottom edge */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 1.5,
            background: 'linear-gradient(90deg, rgba(255,30,160,0.8) 0%, rgba(100,60,255,0.85) 20%, rgba(0,180,255,0.9) 40%, rgba(0,255,160,0.8) 60%, rgba(255,200,0,0.75) 80%, rgba(255,60,60,0.7) 100%)',
            animation: 'holo-border 4s linear infinite',
          }} />
        </div>

        {/* Section groups */}
        <div style={{ padding: '20px 16px', maxWidth: 680 }}>
          {SECTIONS.map(group => (
            <div key={group.group} style={{ marginBottom: 28 }}>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', color: '#3A3530', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
                — {group.group}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {group.items.map(item => {
                  const idx = tileIndex++
                  return (
                    <HubTile
                      key={item.to}
                      item={item}
                      index={idx}
                      onClick={() => navigate(item.to)}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
