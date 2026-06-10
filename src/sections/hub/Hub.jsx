import { useNavigate } from 'react-router-dom'
import { useStore } from '../../hooks/useStore'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import HoloRings from '../../components/HoloRings'
import {
  LayoutDashboard, Flame, PenLine, Sun, Target, Clock,
  FileText, BookOpen, BarChart2, StickyNote,
  CheckSquare, Kanban, CalendarDays,
  BookMarked, Fuel, Users, ShieldCheck,
  Wrench, Settings, Moon, CreditCard, Smile, ShoppingCart,
} from 'lucide-react'

const ACCENT = '#C4522A'

const SECTIONS = [
  {
    group: 'Daily',
    items: [
      { to: '/dashboard', label: 'Dashboard',      desc: 'Overview & live command centre', color: '#C4522A', Icon: LayoutDashboard },
      { to: '/habits',    label: 'Habits',          desc: 'Daily streaks & consistency',    color: '#F09030', Icon: Flame },
      { to: '/journal',   label: 'Journal',         desc: 'Reflections & daily writing',    color: '#8B5CF6', Icon: PenLine },
      { to: '/mood',      label: 'Mood & Energy',   desc: 'Daily check-in & trends',        color: '#EC4899', Icon: Smile },
      { to: '/sleep',     label: 'Sleep Tracker',   desc: 'Log sleep & track quality',      color: '#6366F1', Icon: Moon },
      { to: '/routine',   label: 'Morning Routine', desc: 'Daily startup sequence',         color: '#F5C842', Icon: Sun },
      { to: '/focus',     label: 'Focus Mode',      desc: 'Work mode selector & timer',     color: '#00C8FF', Icon: Target },
      { to: '/ambient',   label: 'Ambient Clock',   desc: 'Fullscreen time display',        color: '#C4522A', Icon: Clock },
    ],
  },
  {
    group: 'Creative',
    items: [
      { to: '/writing',  label: 'Writing Tracker', desc: 'Word counts & session logs',     color: '#7C3AED', Icon: FileText },
      { to: '/reading',  label: 'Reading Log',     desc: 'Books, research & craft reads',  color: '#3B82F6', Icon: BookOpen },
      { to: '/review',   label: 'Weekly Review',   desc: 'Wins, challenges & next focus',  color: '#3EC88A', Icon: BarChart2 },
      { to: '/notes',    label: 'Notes',           desc: 'Quick capture & ideas',          color: '#A09890', Icon: StickyNote },
    ],
  },
  {
    group: 'Work & Projects',
    items: [
      { to: '/tasks',    label: 'Tasks',     desc: 'To-do list & reminders',         color: '#3EC88A', Icon: CheckSquare },
      { to: '/boards',   label: 'Boards',    desc: 'Project status tracker',         color: '#A040E0', Icon: Kanban },
      { to: '/calendar', label: 'Calendar',  desc: 'Events & scheduling',            color: '#3B82F6', Icon: CalendarDays },
    ],
  },
  {
    group: 'Life & Money',
    items: [
      { to: '/ledger',        label: 'Ledger',        desc: 'Income, expenses & finance',  color: '#3EC88A', Icon: BookMarked },
      { to: '/subscriptions', label: 'Subscriptions', desc: 'Track recurring costs',        color: '#10B981', Icon: CreditCard },
      { to: '/shopping',      label: 'Shopping',      desc: 'Lists & groceries',            color: '#F97316', Icon: ShoppingCart },
      { to: '/fuel',          label: 'Fuel Tracker',  desc: 'Vehicle fill logs & costs',   color: '#F09030', Icon: Fuel },
      { to: '/contacts',      label: 'Contacts',      desc: 'People & quick dial',         color: '#EC4899', Icon: Users },
      { to: '/vault',         label: 'Vault',         desc: 'Secure credential storage',   color: '#6366F1', Icon: ShieldCheck },
    ],
  },
  {
    group: 'Utilities',
    items: [
      { to: '/tools',    label: 'Tools',    desc: 'Calculator, world clocks & more', color: '#A09890', Icon: Wrench },
      { to: '/settings', label: 'Settings', desc: 'App preferences & data',          color: '#5C5650', Icon: Settings },
    ],
  },
]

// ── Individual tile ────────────────────────────────────────────────────────
function HubTile({ item, onClick, index }) {
  const delay = 0.03 + index * 0.035
  const { Icon } = item

  return (
    <button
      onClick={onClick}
      style={{
        background: 'rgba(13,11,10,0.9)',
        border: `0.5px solid rgba(255,255,255,0.07)`,
        borderRadius: 14,
        padding: '18px 16px 16px',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        animation: `phase-in 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
        transition: 'background 0.25s, border-color 0.25s, transform 0.18s',
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `${item.color}0F`
        e.currentTarget.style.borderColor = `${item.color}50`
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(13,11,10,0.9)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Top accent line that appears on hover via CSS — done with position */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${item.color}80, transparent)` }} />

      {/* Cut-corner accent dot */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderBottom: `0.5px solid ${item.color}50`, borderLeft: `0.5px solid ${item.color}50` }} />

      {/* Icon in glowing circle */}
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: `${item.color}18`,
        border: `0.5px solid ${item.color}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 16px ${item.color}20`,
        flexShrink: 0,
      }}>
        <Icon size={20} color={item.color} strokeWidth={1.5} />
      </div>

      {/* Text */}
      <div>
        <p style={{
          fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600,
          fontSize: '0.95rem', color: '#EDE8E0', marginBottom: 4, lineHeight: 1.2,
        }}>
          {item.label}
        </p>
        <p style={{
          fontFamily: '"DM Mono", monospace', fontSize: '0.44rem',
          color: '#4A4540', letterSpacing: '0.06em', lineHeight: 1.6,
        }}>
          {item.desc}
        </p>
      </div>

      {/* Arrow indicator */}
      <div style={{
        position: 'absolute', bottom: 12, right: 14,
        fontFamily: '"DM Mono", monospace', fontSize: '0.38rem',
        color: `${item.color}50`, letterSpacing: '0.1em',
      }}>
        OPEN →
      </div>
    </button>
  )
}

// ── Group divider ──────────────────────────────────────────────────────────
function GroupLabel({ label, index }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: index === 0 ? 0 : 8,
      animation: `phase-in 0.6s ease ${0.1 + index * 0.05}s both`,
    }}>
      <div style={{ width: 3, height: 3, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 6px ${ACCENT}`, opacity: 0.7, flexShrink: 0 }} />
      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.46rem', color: '#2A2520', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
        {label}
      </p>
      <div style={{ flex: 1, height: 0.5, background: 'linear-gradient(to right, rgba(196,82,42,0.2), transparent)' }} />
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function Hub() {
  const navigate = useNavigate()
  const { tasks, habits, habitLogs, routine, routineLog, writing } = useStore()
  const today = format(new Date(), 'yyyy-MM-dd')

  // Quick stats
  const openTasks = tasks.filter(t => !t.done).length
  const habitsDone = habitLogs.filter(l => l.date === today).length
  const habitsTotal = habits.length
  const todayLog = routineLog.find(l => l.date === today)
  const routineDone = todayLog ? todayLog.completed.length : 0
  const routineTotal = routine.length
  const wordsToday = writing.filter(s => s.date === today).reduce((sum, s) => sum + (s.words || 0), 0)

  const ws = startOfWeek(new Date(), { weekStartsOn: 1 })
  const we = endOfWeek(new Date(), { weekStartsOn: 1 })
  const wordsWeek = writing.filter(s => { const d = new Date(s.date); return d >= ws && d <= we }).reduce((sum, s) => sum + (s.words || 0), 0)

  let tileIndex = 0

  return (
    <div style={{ minHeight: '100vh', background: '#080706', position: 'relative', overflow: 'hidden' }}>

      {/* Background rings — pulsating */}
      <div style={{ position: 'fixed', top: '35%', right: '-8%', pointerEvents: 'none', zIndex: 0 }}>
        <HoloRings color="#C4522A" size={520} pulse style={{ opacity: 0.55, '--pulse-lo': '0.35', '--pulse-hi': '0.7', animation: 'holo-pulse 4s ease-in-out infinite' }} />
      </div>
      <div style={{ position: 'fixed', bottom: '-8%', left: '-10%', pointerEvents: 'none', zIndex: 0 }}>
        <HoloRings color="#00C8FF" size={380} pulse style={{ opacity: 0.45, '--pulse-lo': '0.28', '--pulse-hi': '0.6', animation: 'holo-pulse 5.5s ease-in-out 1.2s infinite' }} />
      </div>

      {/* Architectural grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `linear-gradient(rgba(196,82,42,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(196,82,42,0.035) 1px, transparent 1px)`,
        backgroundSize: '52px 52px',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Hero header ── */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(180deg, #0A0907 0%, rgba(10,9,7,0.95) 100%)',
          borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          padding: '32px 20px 24px',
        }}>
          {/* Ghost SIGNAL9 watermark */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 16, pointerEvents: 'none', overflow: 'hidden' }}>
            <span style={{
              fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 900,
              fontSize: 'clamp(60px, 20vw, 120px)', color: 'transparent',
              WebkitTextStroke: '0.5px rgba(196,82,42,0.08)',
              letterSpacing: '-0.06em', userSelect: 'none', lineHeight: 0.85,
            }}>
              SIG9
            </span>
          </div>

          {/* Holographic bottom edge */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 1.5,
            background: 'linear-gradient(90deg, rgba(255,30,160,0.7) 0%, rgba(100,60,255,0.8) 20%, rgba(0,180,255,0.85) 40%, rgba(0,255,160,0.75) 60%, rgba(255,200,0,0.7) 80%, rgba(255,60,60,0.65) 100%)',
            animation: 'holo-border 4s linear infinite',
          }} />

          {/* Scan line accent */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute', left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg, transparent 0%, rgba(196,82,42,0.35) 30%, rgba(196,82,42,0.6) 50%, rgba(196,82,42,0.35) 70%, transparent 100%)',
              animation: 'prismatic-scan 4s cubic-bezier(0.4,0,0.6,1) 0.5s 1 forwards',
            }} />
          </div>

          {/* Label */}
          <p style={{
            fontFamily: '"DM Mono", monospace', fontSize: '0.42rem',
            color: `${ACCENT}70`, letterSpacing: '0.28em', textTransform: 'uppercase',
            marginBottom: 10, animation: 'phase-in 0.8s ease 0.1s both',
          }}>
            ■ SIGNAL9 · NAVIGATION HUB
          </p>

          {/* Main title */}
          <h1 style={{
            fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600,
            fontSize: 'clamp(2rem, 7vw, 3.2rem)', color: '#EDE8E0', margin: '0 0 6px',
            letterSpacing: '-0.02em', lineHeight: 0.95,
            textShadow: `0 0 40px ${ACCENT}30`,
            animation: 'phase-in 0.8s ease 0.2s both',
          }}>
            Everything,
          </h1>
          <h1 style={{
            fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600,
            fontSize: 'clamp(2rem, 7vw, 3.2rem)', color: ACCENT, margin: '0 0 22px',
            letterSpacing: '-0.02em', lineHeight: 0.95,
            textShadow: `0 0 60px ${ACCENT}50, 0 0 120px ${ACCENT}25`,
            animation: 'phase-in 0.8s ease 0.3s both',
          }}>
            in one place.
          </h1>

          {/* Live stats strip */}
          <div style={{
            display: 'flex', gap: 0, flexWrap: 'nowrap', overflowX: 'auto',
            background: 'rgba(0,0,0,0.35)',
            border: '0.5px solid rgba(255,255,255,0.07)',
            borderRadius: 10, padding: '12px 16px',
            animation: 'phase-in 0.8s ease 0.5s both',
          }}>
            {[
              { label: 'TASKS OPEN',   value: openTasks,                                       color: '#3EC88A' },
              { label: 'HABITS',       value: habitsTotal > 0 ? `${habitsDone}/${habitsTotal}` : '—', color: '#F09030' },
              { label: 'ROUTINE',      value: routineTotal > 0 ? `${routineDone}/${routineTotal}` : '—', color: '#F5C842' },
              { label: 'WORDS TODAY',  value: wordsToday > 0 ? wordsToday.toLocaleString() : '—',  color: '#7C3AED' },
              { label: 'WORDS / WK',   value: wordsWeek > 0 ? wordsWeek.toLocaleString() : '—',    color: '#00C8FF' },
            ].map((s, i) => (
              <div key={s.label} style={{
                flex: '1 0 auto', display: 'flex', flexDirection: 'column', gap: 4,
                padding: '0 14px',
                borderRight: i < 4 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.36rem', color: '#3A3530', letterSpacing: '0.16em', whiteSpace: 'nowrap' }}>{s.label}</span>
                <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 700, fontSize: '1.1rem', color: s.color, lineHeight: 1, textShadow: `0 0 12px ${s.color}60` }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section grid ── */}
        <div style={{ padding: '24px 16px 48px' }}>
          {SECTIONS.map((group, gi) => (
            <div key={group.group} style={{ marginBottom: 32 }}>
              <GroupLabel label={group.group} index={gi} />
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
