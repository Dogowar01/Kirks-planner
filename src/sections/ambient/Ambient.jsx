import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import HoloRings from '../../components/HoloRings'
import RainCanvas from '../../components/RainCanvas'

const WMO_ICONS = {
  0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',
  61:'🌧️',63:'🌧️',65:'🌧️',71:'🌨️',73:'❄️',75:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',
  95:'⛈️',96:'⛈️',99:'⛈️',
}

function useAmbientWeather() {
  const [data, setData] = useState(() => {
    try { const c = JSON.parse(localStorage.getItem('s9_weather_cache') || 'null'); return c?.data || null } catch { return null }
  })
  return data
}

function useAmbientClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id) }, [])
  return now
}

const GREETINGS = [
  { start: 5,  end: 11, text: 'Good morning,' },
  { start: 11, end: 17, text: 'Good afternoon,' },
  { start: 17, end: 21, text: 'Good evening,' },
  { start: 21, end: 24, text: 'Good night,' },
  { start: 0,  end: 5,  text: 'Still up,' },
]

function greeting(now) {
  const h = now.getHours()
  return (GREETINGS.find(g => h >= g.start && h < g.end) || GREETINGS[0]).text
}

export default function Ambient() {
  const navigate = useNavigate()
  const now = useAmbientClock()
  const weather = useAmbientWeather()
  const [show, setShow] = useState(false)
  const [ready, setReady] = useState(false)  // guards against iOS ghost-click on mount

  useEffect(() => {
    setTimeout(() => setShow(true), 100)
    setTimeout(() => setReady(true), 420)   // activate tap-to-exit after ghost-click window
  }, [])

  // Read pinned countdown
  const pinned = (() => {
    try {
      const id = JSON.parse(localStorage.getItem('s9_settings_v1') || 'null')?.pinnedCountdownId
      if (!id) return null
      const events = JSON.parse(localStorage.getItem('s9_countdowns') || '[]')
      const ev = events.find(e => e.id === id)
      if (!ev) return null
      const ms = new Date(ev.date).getTime() - Date.now()
      if (ms <= 0) return null
      return {
        label: ev.label,
        d: Math.floor(ms / 86400000),
        h: Math.floor((ms % 86400000) / 3600000),
      }
    } catch { return null }
  })()

  const timeStr = format(now, 'HH:mm')
  const secStr  = format(now, 'ss')
  const dateStr = format(now, 'EEEE · d MMMM yyyy')
  const wIcon   = weather ? (WMO_ICONS[weather.code] || '—') : null

  return (
    <>
      {/* Rain rendered as sibling — avoids opacity stacking-context trap */}
      <RainCanvas color="#C4522A" opacity={0.5} intensity={2} windAngle={10} zIndex={9999} />

    <div
      onClick={() => ready && navigate(-1)}
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: '#080706',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        cursor: ready ? 'pointer' : 'default', overflow: 'hidden',
        opacity: show ? 1 : 0, transition: 'opacity 1s ease',
      }}>

      {/* Architectural grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(196,82,42,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(196,82,42,0.12) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      {/* HoloRings */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <HoloRings color="#C4522A" size={Math.min(window.innerWidth * 0.9, 600)} style={{ opacity: 0.65, position: 'absolute' }} />
        <HoloRings color="#00C8FF" size={Math.min(window.innerWidth * 0.6, 400)} style={{ opacity: 0.50, position: 'absolute' }} />
        <HoloRings color="#8B5CF6" size={Math.min(window.innerWidth * 0.35, 240)} style={{ opacity: 0.45, position: 'absolute' }} />
      </div>

      {/* Radial glow behind clock */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 55% at 50% 50%, rgba(196,82,42,0.18) 0%, transparent 70%)',
      }} />

      {/* Subtle vignette */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.4) 100%)' }} />

      {/* Centre content */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, animation: 'phase-in 1.5s ease both' }}>

        {/* Greeting */}
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', color: '#C4522A', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 16, textShadow: '0 0 16px rgba(196,82,42,0.6)' }}>
          {greeting(now)} Kirk
        </p>

        {/* Large time */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
          <span style={{
            fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600,
            fontSize: 'clamp(5rem, 22vw, 11rem)',
            color: '#F5F0E8',
            textShadow: '0 0 60px rgba(196,82,42,0.6), 0 0 120px rgba(196,82,42,0.3)',
            lineHeight: 0.9,
            letterSpacing: '-0.03em',
          }}>{timeStr}</span>
          <span style={{
            fontFamily: '"DM Mono", monospace', fontWeight: 400,
            fontSize: 'clamp(1.2rem, 4vw, 2.5rem)',
            color: '#E05828',
            alignSelf: 'flex-end', paddingBottom: '0.15em',
            textShadow: '0 0 16px rgba(196,82,42,0.8)',
          }}>{secStr}</span>
        </div>

        {/* Date */}
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 'clamp(0.55rem, 1.8vw, 0.8rem)', color: '#B0A898', letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 18 }}>
          {dateStr}
        </p>

        {/* Weather + pinned countdown row */}
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', alignItems: 'center', marginTop: 28 }}>
          {weather && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, animation: 'phase-in 1s ease 0.4s both' }}>
              <span style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)' }}>{wIcon}</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: 'clamp(1.4rem, 4vw, 2rem)', color: '#EDE8E0', lineHeight: 1, textShadow: '0 0 20px rgba(196,82,42,0.4)' }}>{weather.temp}°</p>
                <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: '#A09888', letterSpacing: '0.12em' }}>FEELS {weather.feelsLike}°</p>
              </div>
            </div>
          )}
          {pinned && (
            <div style={{ animation: 'phase-in 1s ease 0.6s both', textAlign: 'center' }}>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.42rem', color: 'rgba(192,132,252,0.9)', letterSpacing: '0.2em', marginBottom: 4 }}>{pinned.label.toUpperCase()}</p>
              <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: 'clamp(1.3rem, 4vw, 2rem)', color: '#D8A8FF', lineHeight: 1, textShadow: '0 0 24px rgba(192,132,252,0.7)' }}>
                {pinned.d}<span style={{ fontSize: '0.5em', opacity: 0.8 }}>d</span> {pinned.h}<span style={{ fontSize: '0.5em', opacity: 0.8 }}>h</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tap to exit hint */}
      <p style={{
        position: 'absolute', bottom: 28, fontFamily: '"DM Mono", monospace',
        fontSize: '0.38rem', color: 'rgba(196,82,42,0.6)', letterSpacing: '0.2em',
        animation: 'phase-in 1s ease 2s both',
      }}>TAP ANYWHERE TO EXIT</p>

      {/* Bottom accent line */}
      <div style={{
        position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(196,82,42,0.6), transparent)',
      }} />
    </div>
    </>
  )
}
