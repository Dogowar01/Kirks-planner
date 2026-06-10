import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, isToday, isPast, parseISO, startOfDay, addDays, addMonths, isWithinInterval, startOfMonth, endOfMonth, differenceInDays } from 'date-fns'
import { Bell, Plus, Calendar, CheckSquare, Briefcase, TrendingUp, Target, Pencil, Trash2, X, ChevronRight, Zap, ArrowRight, RotateCcw } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { BUSINESSES } from '../../lib/constants'
import CategoryBadge from '../../components/CategoryBadge'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import heroBg from '../../assets/art-newyork.jpg'
import HoloRings from '../../components/HoloRings'

const CAT_COLORS = {
  signal9:  '#C4522A',
  app:      '#3B82F6',
  writing:  '#7C3AED',
  personal: '#7F77DD',
}

const WMO_CODES = {
  0:  { label: 'Clear',         icon: '☀️' },
  1:  { label: 'Mostly Clear',  icon: '🌤️' },
  2:  { label: 'Partly Cloudy', icon: '⛅' },
  3:  { label: 'Overcast',      icon: '☁️' },
  45: { label: 'Fog',           icon: '🌫️' },
  48: { label: 'Fog',           icon: '🌫️' },
  51: { label: 'Light Drizzle', icon: '🌦️' },
  53: { label: 'Drizzle',       icon: '🌦️' },
  55: { label: 'Heavy Drizzle', icon: '🌧️' },
  61: { label: 'Light Rain',    icon: '🌧️' },
  63: { label: 'Rain',          icon: '🌧️' },
  65: { label: 'Heavy Rain',    icon: '🌧️' },
  71: { label: 'Light Snow',    icon: '🌨️' },
  73: { label: 'Snow',          icon: '❄️' },
  75: { label: 'Heavy Snow',    icon: '❄️' },
  80: { label: 'Showers',       icon: '🌦️' },
  81: { label: 'Showers',       icon: '🌧️' },
  82: { label: 'Heavy Showers', icon: '⛈️' },
  95: { label: 'Thunderstorm',  icon: '⛈️' },
  96: { label: 'Thunderstorm',  icon: '⛈️' },
  99: { label: 'Thunderstorm',  icon: '⛈️' },
}
function wmo(code) { return WMO_CODES[code] || { label: 'Unknown', icon: '—' } }

const WEATHER_CACHE_KEY = 's9_weather_cache'
const WEATHER_TTL = 30 * 60 * 1000 // 30 min

function useWeather() {
  const [data, setData] = useState(() => {
    try {
      const c = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) || 'null')
      if (c && Date.now() - c.ts < WEATHER_TTL) return c.data
    } catch {}
    return null
  })

  useEffect(() => {
    // Still fresh from cache — skip fetch
    try {
      const c = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) || 'null')
      if (c && Date.now() - c.ts < WEATHER_TTL) return
    } catch {}

    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const { latitude: lat, longitude: lon } = coords
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current=temperature_2m,weathercode,windspeed_10m,apparent_temperature` +
          `&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max` +
          `&timezone=auto&forecast_days=3`
        )
        const json = await res.json()
        const c = json.current
        const d = json.daily
        const result = {
          temp:      Math.round(c.temperature_2m),
          feelsLike: Math.round(c.apparent_temperature),
          wind:      Math.round(c.windspeed_10m),
          code:      c.weathercode,
          days: [0, 1, 2].map(i => ({
            maxTemp: Math.round(d.temperature_2m_max[i]),
            minTemp: Math.round(d.temperature_2m_min[i]),
            rain:    d.precipitation_probability_max[i],
            code:    d.weathercode[i],
          })),
        }
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: result }))
        setData(result)
      } catch {}
    }, () => {})
  }, [])

  return data
}

const RATES_CACHE_KEY = 's9_rates_cache'
const RATES_TTL = 12 * 60 * 60 * 1000 // 12 hours

function useRates() {
  const [history, setHistory] = useState(() => {
    try {
      const c = JSON.parse(localStorage.getItem(RATES_CACHE_KEY) || 'null')
      if (c && Date.now() - c.ts < RATES_TTL) return c.data
    } catch {}
    return null
  })
  const [error, setError] = useState(false)

  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem(RATES_CACHE_KEY) || 'null')
      if (c && Date.now() - c.ts < RATES_TTL) return
    } catch {}

    const base = 'https://api.frankfurter.dev/v1'
    // Ask for 10 days back so we always get 5 business days after weekends
    const from = new Date(Date.now() - 86400000 * 10).toISOString().slice(0, 10)
    const to   = new Date().toISOString().slice(0, 10)

    Promise.all([
      fetch(`${base}/${from}..${to}?from=AUD&to=USD,JPY`).then(r => r.json()),
      fetch(`${base}/latest?from=AUD&to=USD,JPY`).then(r => r.json()),
    ])
      .then(([range, latest]) => {
        if (!range.rates) { setError(true); return }

        // Sorted dates ascending, take last 5
        const dates = Object.keys(range.rates).sort().slice(-5)
        const result = {
          USD: dates.map(d => range.rates[d].USD),
          JPY: dates.map(d => range.rates[d].JPY),
          latest: latest.rates,
        }
        localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: result }))
        setHistory(result)
      })
      .catch(() => setError(true))
  }, [])

  return { history, error }
}

function Sparkline({ values, width = 80, height = 32, color }) {
  if (!values || values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pad = 2
  const w = width - pad * 2
  const h = height - pad * 2

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * w
    const y = pad + h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')

  const up = values[values.length - 1] >= values[0]
  const lineColor = color || (up ? '#4ade80' : '#f87171')
  // Filled area under the line
  const first = points.split(' ')[0]
  const last  = points.split(' ').at(-1)
  const [lx] = last.split(',')
  const [fx] = first.split(',')
  const area = `${fx},${pad + h} ${points} ${lx},${pad + h}`

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color?.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${color?.replace('#','')})`} />
      <polyline points={points} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* End dot */}
      <circle cx={lx} cy={last.split(',')[1]} r="2.5" fill={lineColor} />
    </svg>
  )
}

const PLUM       = '#C084FC'
const PLUM_GLOW  = 'rgba(192,132,252,0.6)'
const PLUM_DIM   = 'rgba(192,132,252,0.45)'

function usePinnedCountdown(settings) {
  const [tick, setTick] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const pinnedId = settings?.pinnedCountdownId
  if (!pinnedId) return null

  let events = []
  try { events = JSON.parse(localStorage.getItem('s9_countdowns') || '[]') } catch {}
  const ev = events.find(e => e.id === pinnedId)
  if (!ev) return null

  const ms = new Date(ev.date).getTime() - tick
  if (ms <= 0) return { label: ev.label, date: ev.date, arrived: true }
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return { label: ev.label, date: ev.date, d, h, m, s, arrived: false }
}

function LiveClock({ taskCount = 0, eventCount = 0 }) {
  const [now, setNow] = useState(new Date())
  const weather = useWeather()
  const { history: ratesHistory, error: ratesError } = useRates()
  const { settings } = useStore()
  const pinned = usePinnedCountdown(settings)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  const hour = now.getHours()
  const greeting = hour < 5 ? 'Still awake,' : hour < 12 ? 'Good morning,' : hour < 17 ? 'Good afternoon,' : 'Good evening,'

  return (
    <div className="relative overflow-hidden"
      style={{
        borderBottom: '0.5px solid rgba(0,200,255,0.12)',
        minHeight: 210,
        boxShadow: '0 1px 0 rgba(0,200,255,0.06), 0 4px 40px rgba(0,0,0,0.6)',
      }}>

      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 30%',
        opacity: 0.38,
      }} />

      {/* Deep gradient — heavier vignette for contrast */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(6,5,4,0.95) 0%, rgba(12,11,10,0.55) 50%, rgba(4,10,20,0.9) 100%)',
      }} />

      {/* Architectural grid — precision graph paper, slow drift */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(196,82,42,0.055) 1px, transparent 1px),
          linear-gradient(90deg, rgba(196,82,42,0.055) 1px, transparent 1px)
        `,
        backgroundSize: '36px 36px',
        animation: 'grid-drift 18s linear infinite',
      }} />

      {/* Tokyo rain curtain — vertical cyan hairlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `repeating-linear-gradient(
          90deg,
          transparent 0px,
          transparent 5px,
          rgba(0,200,255,0.018) 5px,
          rgba(0,200,255,0.018) 5.5px
        )`,
      }} />

      {/* Dual scanlines — cyan + amber at different speeds */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 140,
          background: 'linear-gradient(to bottom, transparent 0%, rgba(0,200,255,0.028) 45%, rgba(0,200,255,0.028) 55%, transparent 100%)',
          animation: 'hero-scan 10s linear infinite',
        }} />
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 80,
          background: 'linear-gradient(to bottom, transparent 0%, rgba(200,140,0,0.018) 50%, transparent 100%)',
          animation: 'hero-scan 7s linear 3.5s infinite',
        }} />
      </div>

      {/* Data stream — right edge */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 10px, rgba(0,200,255,0.2) 10px, rgba(0,200,255,0.2) 11px)',
        animation: 'data-stream-flow 1.8s linear infinite',
      }} />

      {/* Atmospheric orbs — drifting */}
      <div style={{
        position: 'absolute', top: -60, right: -40,
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,200,255,0.09) 0%, rgba(196,82,42,0.05) 50%, transparent 70%)',
        pointerEvents: 'none',
        animation: 'orb-drift 20s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: -80, left: 20,
        width: 250, height: 250, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(196,82,42,0.12) 0%, rgba(160,80,160,0.04) 60%, transparent 75%)',
        pointerEvents: 'none',
        animation: 'orb-drift 15s ease-in-out 5s infinite reverse',
      }} />

      {/* ── HOLO RING CLUSTERS — hero layer ── */}
      <HoloRings size={300} color="#C4522A" style={{
        position: 'absolute', bottom: -90, left: -90, opacity: 0.52, zIndex: 2,
      }} />
      <HoloRings size={200} color="#00C8FF" style={{
        position: 'absolute', top: -50, right: -50, opacity: 0.44, zIndex: 2,
      }} />
      <HoloRings size={145} color="#A040E0" style={{
        position: 'absolute', top: '30%', left: '30%', opacity: 0.36, zIndex: 2,
      }} />

      {/* ── ACCENT SCAN LINE — runs once on mount ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 3 }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent 0%, rgba(196,82,42,0.44) 10%, rgba(196,82,42,0.8) 30%, #C4522A 50%, rgba(196,82,42,0.8) 70%, rgba(196,82,42,0.44) 90%, transparent 100%)',
          boxShadow: '0 0 12px rgba(196,82,42,0.55), 0 0 24px rgba(196,82,42,0.28)',
          filter: 'blur(0.5px)',
          animation: 'prismatic-scan 2.4s cubic-bezier(0.4,0,0.6,1) 1 forwards',
        }} />
      </div>

      {/* ── HOLOGRAPHIC FOIL OVERLAY — iridescent sheen on hero ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
        background: 'linear-gradient(135deg, rgba(255,30,160,0.04) 0%, rgba(100,60,255,0.05) 25%, rgba(0,180,255,0.04) 50%, rgba(0,255,160,0.03) 75%, rgba(255,200,0,0.04) 100%)',
        backgroundSize: '400% 400%',
        animation: 'holo-border 10s ease infinite',
      }} />

      {/* ── GHOST TYPOGRAPHY — massive italic "SIGNAL9" — holographic stroke ── */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', pointerEvents: 'none', overflow: 'hidden',
        zIndex: 1,
      }}>
        <span style={{
          fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 900,
          fontSize: 'clamp(90px, 32vw, 200px)',
          color: 'transparent',
          WebkitTextStroke: '1px rgba(140,100,255,0.09)',
          letterSpacing: '-0.06em', userSelect: 'none',
          whiteSpace: 'nowrap',
          animation: 'ghost-drift 22s ease-in-out infinite',
        }}>
          SIGNAL9
        </span>
      </div>

      {/* ── RADAR PING — top-right corner ── */}
      <div style={{ position: 'absolute', top: '15%', right: '12%', zIndex: 2, pointerEvents: 'none' }}>
        {/* Origin dot */}
        <div style={{
          width: 5, height: 5, borderRadius: '50%',
          background: '#00C8FF', boxShadow: '0 0 10px rgba(0,200,255,0.9), 0 0 20px rgba(0,200,255,0.5)',
          position: 'relative',
        }} />
        {/* Expanding rings */}
        {[0, 1.4, 2.8].map((delay, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: 12, height: 12,
            marginTop: -6, marginLeft: -6,
            borderRadius: '50%',
            border: '1px solid rgba(0,200,255,0.5)',
            animation: `radar-ping 3.5s ease-out ${delay}s infinite`,
            transformOrigin: 'center',
          }} />
        ))}
      </div>

      {/* ── ARCHITECTURAL DIAGONAL LINES — precision angle marks ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 1 }}>
        {/* Primary diagonal — top-left to mid-right */}
        <div style={{
          position: 'absolute', top: -30, left: '5%',
          width: '70%', height: '0.5px',
          background: 'linear-gradient(to right, transparent, rgba(0,200,255,0.12) 20%, rgba(0,200,255,0.2) 50%, rgba(0,200,255,0.08) 80%, transparent)',
          transform: 'rotate(22deg)', transformOrigin: 'left center',
        }} />
        {/* Secondary diagonal — shorter, lower */}
        <div style={{
          position: 'absolute', bottom: '28%', left: '55%',
          width: '55%', height: '0.5px',
          background: 'linear-gradient(to right, transparent, rgba(196,82,42,0.18) 30%, rgba(196,82,42,0.1) 70%, transparent)',
          transform: 'rotate(-14deg)', transformOrigin: 'left center',
        }} />
        {/* Cross-hair tick intersection marker */}
        <div style={{
          position: 'absolute', top: '38%', left: '62%',
          width: 16, height: 0.5,
          background: 'rgba(0,200,255,0.4)',
          transform: 'rotate(22deg)',
        }} />
        <div style={{
          position: 'absolute', top: 'calc(38% - 8px)', left: '62.5%',
          width: 0.5, height: 16,
          background: 'rgba(0,200,255,0.4)',
        }} />
      </div>

      {/* Corner brackets — bright cyan */}
      <CornerBrackets size={18} thickness={1} color="#00C8FF" opacity={0.55} inset={10} />

      {/* SYSTEM HUD — top right */}
      <div style={{
        position: 'absolute', top: 'calc(env(safe-area-inset-top) + 10px)', right: 16, zIndex: 5,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
        animation: 'hud-slide-in 0.7s ease 0.3s both',
        background: 'rgba(6,5,4,0.55)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        border: '0.5px solid rgba(0,200,255,0.18)',
        borderRadius: 8, padding: '10px 14px 12px',
        boxShadow: '0 0 24px rgba(0,200,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}>
        <div style={{
          fontFamily: '"DM Mono", monospace', fontSize: '0.5rem',
          background: 'linear-gradient(90deg, #ff1ea0, #643cff, #00b4ff, #00ffa0, #ffd000, #ff1ea0)',
          backgroundSize: '300% 100%',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'holo-border 3s linear infinite',
          letterSpacing: '0.2em', textTransform: 'uppercase',
          paddingBottom: 6, borderBottom: '0.5px solid rgba(100,60,255,0.25)', marginBottom: 1,
          width: '100%', textAlign: 'right',
        }}>
          ■ SIG9 LIVE
        </div>
        {[
          ['STATUS', 'ONLINE',        '#00FF9D'],
          ['TASKS',  `${taskCount}`,  '#E05828'],
          ['EVENTS', `${eventCount}`, '#00C8FF'],
        ].map(([k, v, c]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: '"DM Mono"', fontSize: '0.46rem', color: 'rgba(0,200,255,0.4)', letterSpacing: '0.14em' }}>{k}</span>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: c, boxShadow: `0 0 8px ${c}, 0 0 16px ${c}88` }} />
            <span style={{ fontFamily: '"DM Mono"', fontSize: '0.55rem', fontWeight: 700, color: c, letterSpacing: '0.06em', textShadow: `0 0 12px ${c}` }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative px-6 pb-6" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 40px)' }}>
        {/* Date line — DM Mono precision */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 2, height: 10, background: '#C4522A', boxShadow: '0 0 6px #C4522A' }} />
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.62rem', color: '#7A7268', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {format(now, "EEE · dd MMM yyyy")}
          </p>
          <div style={{ width: 1, height: 8, background: 'rgba(0,200,255,0.3)' }} />
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.62rem', color: 'rgba(0,200,255,0.55)', letterSpacing: '0.12em' }}>
            WK{format(now, "w")}
          </p>
        </div>

        {/* Glitch-animated greeting */}
        <h1 style={{
          fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600,
          fontSize: 'clamp(1.65rem, 5.5vw, 2.6rem)', color: '#EDE8E0', lineHeight: 1.1,
          letterSpacing: '-0.02em', position: 'relative',
          animation: 'title-ghost 16s ease-in-out infinite, chromatic-pulse 12s ease-in-out infinite 4s',
        }}>
          {greeting} Kirk.
          {/* Blinking cyan cursor */}
          <span style={{
            display: 'inline-block', width: 2.5, height: '0.75em',
            background: '#00C8FF', marginLeft: 6, verticalAlign: 'middle',
            boxShadow: '0 0 10px rgba(0,200,255,1), 0 0 20px rgba(0,200,255,0.5)',
            animation: 'cursor-blink 1.1s ease-in-out infinite',
          }} />
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 4 }}>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', color: '#EDE8E0', margin: 0, letterSpacing: '0.04em' }}>
            {format(now, "HH:mm")}
          </p>
          <div style={{ width: 1, height: 12, background: 'rgba(0,200,255,0.35)' }} />
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', color: 'rgba(0,200,255,0.5)', margin: 0, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            SIG9 · LIVE
          </p>
        </div>

        {/* Precision divider — electric cyan */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 14 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00C8FF', boxShadow: '0 0 8px rgba(0,200,255,1), 0 0 20px rgba(0,200,255,0.5)', flexShrink: 0 }} />
          <div style={{ height: 0.5, flex: 1, background: 'linear-gradient(to right, rgba(0,200,255,0.8), rgba(0,200,255,0.15) 55%, transparent)' }} />
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 0.5, height: i === 0 ? 8 : 4, background: `rgba(0,200,255,${0.65 - i*0.12})`, marginLeft: 11, flexShrink: 0 }} />
          ))}
          <div style={{ height: 0.5, width: 16, background: 'linear-gradient(to right, rgba(0,200,255,0.08), transparent)', marginLeft: 4 }} />
        </div>

        {/* Exchange rate sparklines */}
        {(ratesHistory || ratesError) ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            {[['USD', 4], ['JPY', 0]].map(([ccy, dp]) => {
              const vals = ratesHistory?.[ccy]
              const latest = ratesHistory?.latest?.[ccy]
              const up = vals ? vals[vals.length - 1] >= vals[0] : null
              const trendColor = up === null ? '#A09890' : up ? '#00FF9D' : '#FF4D6A'
              return (
                <div key={ccy} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(0,0,0,0.35)',
                  border: `0.5px solid ${up === null ? 'rgba(255,255,255,0.06)' : up ? 'rgba(0,255,157,0.15)' : 'rgba(255,77,106,0.15)'}`,
                  borderRadius: 8, padding: '6px 10px',
                  boxShadow: up === null ? 'none' : `0 0 12px ${trendColor}15`,
                }}>
                  <div>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: 'rgba(0,200,255,0.4)', letterSpacing: '0.14em' }}>AUD/{ccy}</div>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontWeight: 600, fontSize: '0.95rem', color: '#EDE8E0', lineHeight: 1.2, letterSpacing: '0.02em' }}>
                      {latest ? latest.toFixed(dp) : '—'}
                    </div>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: trendColor, letterSpacing: '0.06em', marginTop: 1, textShadow: `0 0 8px ${trendColor}80` }}>
                      {up === null ? '' : up ? '▲ UP 5D' : '▼ DOWN 5D'}
                    </div>
                  </div>
                  <Sparkline values={vals} width={72} height={30} color={trendColor} />
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ marginTop: 4, fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#7A7470' }}>loading rates…</div>
        )}

        {/* 3-day weather strip */}
        {weather ? (
          <div style={{
            marginTop: 14,
            display: 'flex', alignItems: 'stretch', gap: 0,
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 12,
            border: '0.5px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}>
            {/* Current conditions */}
            <div style={{ flex: '0 0 auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, borderRight: '0.5px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 22 }}>{wmo(weather.code).icon}</span>
                <span style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '1.5rem', color: '#EDE8E0', lineHeight: 1 }}>{weather.temp}°</span>
              </div>
              <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#A09890', letterSpacing: '0.08em' }}>
                {wmo(weather.code).label.toUpperCase()}
              </div>
              <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', color: '#7A7470', letterSpacing: '0.06em', marginTop: 1 }}>
                FEELS {weather.feelsLike}° · WIND {weather.wind}km/h
              </div>
            </div>

            {/* 3-day forecast */}
            <div style={{ flex: 1, display: 'flex' }}>
              {weather.days.map((day, i) => {
                const cond = wmo(day.code)
                const label = ['TODAY', 'TMW', 'D+2'][i]
                return (
                  <div key={i} style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '8px 4px', gap: 3,
                    borderRight: i < 2 ? '0.5px solid rgba(255,255,255,0.07)' : 'none',
                  }}>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#7A7470', letterSpacing: '0.1em' }}>{label}</div>
                    <div style={{ fontSize: 18 }}>{cond.icon}</div>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: '#EDE8E0', fontWeight: 700 }}>
                      {day.maxTemp}°<span style={{ color: '#7A7470', fontWeight: 400 }}>/{day.minTemp}°</span>
                    </div>
                    {day.rain > 20 && (
                      <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: '#60a5fa', letterSpacing: '0.05em' }}>{day.rain}% 💧</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 10, fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#7A7470' }}>loading weather…</div>
        )}

        {/* Pinned countdown */}
        {pinned && (
          <div style={{
            marginTop: 16,
            padding: '12px 14px',
            borderRadius: 10,
            background: 'rgba(192,132,252,0.06)',
            border: `0.5px solid ${PLUM}30`,
            boxShadow: `0 0 20px ${PLUM}10`,
          }}>
            {/* Label row */}
            <div className="flex items-center gap-2 mb-2">
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: PLUM, boxShadow: `0 0 6px ${PLUM_GLOW}`, flexShrink: 0, display: 'block' }} />
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: PLUM_DIM, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.9 }}>
                {pinned.label}
              </p>
            </div>

            {pinned.arrived ? (
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', color: PLUM }}>🎉 This day has arrived!</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: 8, justifyContent: 'start' }}>
                {[['d', pinned.d, 'Days'], ['h', pinned.h, 'Hrs'], ['m', pinned.m, 'Min'], ['s', pinned.s, 'Sec']].map(([k, val, lbl]) => (
                  <div key={k} style={{ textAlign: 'center', minWidth: 42 }}>
                    <p style={{
                      fontFamily: '"Share Tech Mono", "DM Mono", monospace',
                      fontSize: '1.6rem',
                      lineHeight: 1,
                      color: PLUM,
                      textShadow: `0 0 16px ${PLUM_GLOW}, 0 0 30px ${PLUM}50`,
                      letterSpacing: '-0.02em',
                    }}>
                      {String(val).padStart(2, '0')}
                    </p>
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: PLUM_DIM, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>
                      {lbl}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#5C5650', marginTop: 8, letterSpacing: '0.06em' }}>
              {new Date(pinned.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      position: 'relative', overflow: 'hidden', textAlign: 'left',
      padding: '14px 12px 12px', borderRadius: 10, cursor: 'pointer',
      background: `linear-gradient(135deg, ${color}30 0%, ${color}12 60%, rgba(80,20,180,0.08) 100%)`,
      border: `1px solid ${color}55`,
      boxShadow: `0 0 40px ${color}22, 0 0 0 0.5px ${color}30 inset, inset 0 1px 0 rgba(255,255,255,0.1)`,
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      transition: 'all 0.18s', width: '100%',
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 60px ${color}45, 0 0 0 1px ${color}60 inset, inset 0 1px 0 rgba(255,255,255,0.14)`; e.currentTarget.style.transform = 'translateY(-2px)' }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 40px ${color}22, 0 0 0 0.5px ${color}30 inset, inset 0 1px 0 rgba(255,255,255,0.1)`; e.currentTarget.style.transform = '' }}>
      {/* Watermark icon */}
      <div style={{ position: 'absolute', bottom: 8, right: 8, opacity: 0.2, pointerEvents: 'none' }}>
        <Icon size={26} style={{ color }} strokeWidth={1} />
      </div>
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: `linear-gradient(to right, ${color}, ${color}44, transparent)` }} />
      {/* Neon number */}
      <p style={{
        fontFamily: '"DM Mono", monospace', fontWeight: 700,
        fontSize: '2.1rem', lineHeight: 1, letterSpacing: '-0.02em',
        color, textShadow: `0 0 20px ${color}cc, 0 0 50px ${color}66, 0 0 80px ${color}33`,
        marginBottom: 8,
      }}>
        {String(value).padStart(2, '0')}
      </p>
      {/* Label */}
      <p style={{
        fontFamily: '"DM Mono", monospace', fontSize: '0.44rem',
        color: `${color}aa`, letterSpacing: '0.18em', textTransform: 'uppercase',
      }}>
        {label}
      </p>
    </button>
  )
}

// ─── Focus Moment ────────────────────────────────────────────────────────────
const FOCUS_BLOCKS = [
  {
    id: 'stuck',
    label: "I don't know where to start.",
    blurb: "Everything's loaded. The hardest part is picking the first brick.",
    rituals: ['one_thing', 'two_minute'],
  },
  {
    id: 'overwhelmed',
    label: "I'm overwhelmed — too much.",
    blurb: "You can't do everything today. You can do one thing.",
    rituals: ['brain_dump', 'pick_one'],
  },
  {
    id: 'scattered',
    label: "I can't focus — my mind's everywhere.",
    blurb: "Scattered attention isn't a character flaw. It's a signal.",
    rituals: ['ground_now', 'clear_desk'],
  },
  {
    id: 'drained',
    label: "I'm exhausted. No energy.",
    blurb: "Running on empty is data, not failure.",
    rituals: ['honest_audit', 'minimum_viable'],
  },
  {
    id: 'avoidance',
    label: "I'm avoiding something.",
    blurb: "Avoidance always costs more than the thing you're avoiding.",
    rituals: ['name_it', 'five_minutes'],
  },
]

const FOCUS_RITUALS = {
  one_thing: {
    title: 'The One Thing',
    steps: [
      { body: "You have a list. Maybe a long one. But today only one thing actually needs to move." },
      { body: "If you could only get one thing done today — and it had to actually matter — what would it be?", input: 'What is that one thing?' },
      { body: "That's your target. Everything else is noise until that's done. Go do it.", release: true },
    ],
  },
  two_minute: {
    title: 'Two-Minute Start',
    steps: [
      { body: "You don't have to finish it. You just have to start it. Two minutes — that's the only commitment." },
      { body: "What's the smallest possible action you could take on the most important thing right now?", input: 'e.g. Open the file. Write the first line. Send that one email.' },
      { body: "Set a two-minute timer and do just that. When it ends — you'll probably keep going. But you don't have to.", release: true },
    ],
  },
  brain_dump: {
    title: 'Get It Out of Your Head',
    steps: [
      { body: "Your brain is trying to hold everything at once. That's why it's noisy. Write it all down and let your head go quiet." },
      { body: "Dump everything that's pulling at you — tasks, worries, things half-done, things you promised.", input: 'Just list them. No order, no filter.' },
      { body: "Good. It's on paper, not in your head. Now pick one and only one to touch today.", release: true },
    ],
  },
  pick_one: {
    title: 'One or None',
    steps: [
      { body: "Trying to prioritise everything is the same as prioritising nothing. You need a rule." },
      { body: "Look at everything on your plate. What has the highest real consequence if it slips?", input: 'Name it.' },
      { body: "That's your one. The rest go on a list where they'll wait. They're not forgotten — they're parked.", release: true },
    ],
  },
  ground_now: {
    title: 'Right Here, Right Now',
    steps: [
      { body: "Take a breath. A real one — slow in, slow out. You don't have to fix tomorrow before you can work today." },
      { body: "What's one thing that's physically true right now — about where you are, what you can see or feel?", input: 'e.g. Sun on the desk. Coffee going cold. Quiet room.' },
      { body: "You're here. The work is here. Start with what's in front of you — just that.", release: true },
    ],
  },
  clear_desk: {
    title: 'Clear the Decks',
    steps: [
      { body: "A scattered environment feeds a scattered mind. Before you work — two minutes to clear the space." },
      { body: "Close tabs you don't need right now. Put your phone face-down. Clear one surface near you." },
      { body: "Now: one task, one window, one focus. Everything else can wait 25 minutes.", release: true },
    ],
  },
  honest_audit: {
    title: 'Honest Check-In',
    steps: [
      { body: "Before you push through, be honest about what's actually going on. Pushing harder when you're depleted just digs the hole deeper." },
      { body: "On a scale of 1–10, how's your actual energy right now — not what you wish it was?", input: 'Be honest. Nobody sees this.' },
      { body: "If it's below 5, your job today isn't to produce — it's to protect tomorrow. Rest is work.", release: true },
    ],
  },
  minimum_viable: {
    title: 'Minimum Viable Day',
    steps: [
      { body: "You're not at full capacity. That's fine. The move isn't to push through — it's to set a minimum viable target." },
      { body: "What's one small, real thing you can do today that would mean the day wasn't wasted?", input: 'Small is right. Small is honest.' },
      { body: "Do that one thing. Then decide if you have more. Low-output days protect high-output weeks.", release: true },
    ],
  },
  name_it: {
    title: 'Name the Thing',
    steps: [
      { body: "Avoidance grows in the dark. The moment you name the thing, it gets smaller." },
      { body: "What are you actually avoiding — be specific. Not 'that project' — what exactly about it?", input: 'Name it precisely.' },
      { body: "Usually it's one of three things: you don't know how to start, you're afraid it won't be good enough, or it's going to require a hard conversation. Which is it?", release: true },
    ],
  },
  five_minutes: {
    title: 'Five Minutes Only',
    steps: [
      { body: "You're not going to do it all right now. You're just going to touch it. Five minutes — that breaks the seal." },
      { body: "What's the one micro-action that would count as progress on the thing you're avoiding?", input: 'e.g. Open the document. Write the first bullet. Send the draft.' },
      { body: "Set a five-minute timer. Do only that. When it ends, you decide if you continue. But you'll have started.", release: true },
    ],
  },
}

function FocusMomentModal({ onClose }) {
  const [phase, setPhase]   = useState('blocks')  // 'blocks' | 'rituals' | 'ritual'
  const [block, setBlock]   = useState(null)
  const [ritual, setRitual] = useState(null)
  const [step, setStep]     = useState(0)
  const [input, setInput]   = useState('')

  const PLUM = '#C084FC'

  function pickBlock(b) {
    setBlock(b)
    if (b.rituals.length === 1) {
      setRitual(FOCUS_RITUALS[b.rituals[0]])
      setStep(0)
      setInput('')
      setPhase('ritual')
    } else {
      setPhase('rituals')
    }
  }

  function pickRitual(id) {
    setRitual(FOCUS_RITUALS[id])
    setStep(0)
    setInput('')
    setPhase('ritual')
  }

  function next() {
    const r = ritual
    if (step < r.steps.length - 1) {
      setStep(s => s + 1)
      setInput('')
    } else {
      onClose()
    }
  }

  function reset() {
    setPhase('blocks')
    setBlock(null)
    setRitual(null)
    setStep(0)
    setInput('')
  }

  const currentStep = ritual?.steps[step]
  const isLast = ritual && step === ritual.steps.length - 1

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}>
      <div
        style={{ background: '#0F0D0C', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto', padding: '24px 24px calc(env(safe-area-inset-bottom) + 28px)', borderTop: `1.5px solid ${PLUM}55` }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Zap size={16} color={PLUM} strokeWidth={1.5} style={{ filter: `drop-shadow(0 0 6px ${PLUM})` }} />
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, letterSpacing: '0.15em', color: PLUM }}>
              {phase === 'blocks' ? 'FOCUS MOMENT' : phase === 'rituals' ? block?.blurb.toUpperCase().slice(0,30)+'…' : ritual?.title.toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {phase !== 'blocks' && (
              <button onClick={reset} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }}>
                <RotateCcw size={14} />
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Phase: pick what's going on */}
        {phase === 'blocks' && (
          <div>
            <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.15rem', color: '#EDE8E0', marginBottom: 6, lineHeight: 1.4 }}>
              What's going on right now?
            </p>
            <p style={{ fontSize: 11, color: '#7A7068', fontFamily: '"DM Mono", monospace', marginBottom: 20 }}>Pick the one that fits closest.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FOCUS_BLOCKS.map(b => (
                <button
                  key={b.id}
                  onClick={() => pickBlock(b)}
                  style={{ textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', touchAction: 'manipulation', transition: 'border-color 0.15s, background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${PLUM}55`; e.currentTarget.style.background = `${PLUM}0a` }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}>
                  <p style={{ fontSize: 14, color: '#EDE8E0', fontWeight: 500, marginBottom: 3 }}>{b.label}</p>
                  <p style={{ fontSize: 11, color: '#7A7068', fontFamily: '"DM Mono", monospace', lineHeight: 1.5 }}>{b.blurb}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Phase: pick ritual */}
        {phase === 'rituals' && block && (
          <div>
            <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.1rem', color: '#EDE8E0', marginBottom: 16, lineHeight: 1.5 }}>
              "{block.blurb}"
            </p>
            <p style={{ fontSize: 11, color: '#7A7068', fontFamily: '"DM Mono", monospace', marginBottom: 16, letterSpacing: '0.1em' }}>PICK AN APPROACH</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {block.rituals.map(rid => {
                const r = FOCUS_RITUALS[rid]
                return (
                  <button
                    key={rid}
                    onClick={() => pickRitual(rid)}
                    style={{ textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', touchAction: 'manipulation' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${PLUM}55` }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}>
                    <span style={{ fontSize: 14, color: '#EDE8E0' }}>{r.title}</span>
                    <ArrowRight size={14} color={PLUM} />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Phase: step through ritual */}
        {phase === 'ritual' && ritual && currentStep && (
          <div>
            {/* Step progress */}
            <div style={{ display: 'flex', gap: 5, marginBottom: 20 }}>
              {ritual.steps.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 2, borderRadius: 1, background: i <= step ? PLUM : 'rgba(255,255,255,0.1)', boxShadow: i === step ? `0 0 6px ${PLUM}` : 'none', transition: 'all 0.3s ease' }} />
              ))}
            </div>

            {/* Body */}
            <p style={{ fontSize: 15, color: '#EDE8E0', lineHeight: 1.7, marginBottom: currentStep.input ? 20 : 32, fontWeight: step === 0 ? 400 : 400 }}>
              {currentStep.body.split('*').map((part, i) =>
                i % 2 === 1
                  ? <em key={i} style={{ color: PLUM, fontStyle: 'italic' }}>{part}</em>
                  : <span key={i}>{part}</span>
              )}
            </p>

            {/* Input */}
            {currentStep.input && (
              <textarea
                autoFocus
                placeholder={currentStep.input}
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `0.5px solid ${PLUM}44`, borderRadius: 12, padding: '12px 14px', color: '#EDE8E0', fontSize: 13, fontFamily: '"DM Mono", monospace', resize: 'none', minHeight: 80, outline: 'none', marginBottom: 20, boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = `${PLUM}99`}
                onBlur={e => e.target.style.borderColor = `${PLUM}44`}
              />
            )}

            {/* CTA */}
            <button
              onClick={next}
              style={{ width: '100%', background: isLast ? PLUM : 'rgba(255,255,255,0.08)', border: isLast ? 'none' : '0.5px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: '15px 20px', color: isLast ? '#000' : '#EDE8E0', fontFamily: '"DM Mono", monospace', fontSize: 13, fontWeight: isLast ? 700 : 400, letterSpacing: '0.1em', cursor: 'pointer', boxShadow: isLast ? `0 0 20px rgba(192,132,252,0.45)` : 'none', touchAction: 'manipulation' }}>
              {isLast ? (currentStep.release ? 'GO DO IT →' : 'DONE') : 'CONTINUE →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function FocusMomentButton() {
  const [open, setOpen] = useState(false)
  const PLUM = '#C084FC'
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: `linear-gradient(135deg, rgba(192,132,252,0.12) 0%, rgba(192,132,252,0.06) 100%)`, border: `1px solid rgba(192,132,252,0.25)`, borderRadius: 14, padding: '13px 20px', color: PLUM, fontFamily: '"DM Mono", monospace', fontSize: 12, letterSpacing: '0.15em', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', boxShadow: `0 0 20px rgba(192,132,252,0.08)` }}>
        <Zap size={14} strokeWidth={1.5} style={{ filter: `drop-shadow(0 0 4px ${PLUM})` }} />
        FOCUS MOMENT
      </button>
      {open && <FocusMomentModal onClose={() => setOpen(false)} />}
    </>
  )
}

function QuickAdd({ onAdd }) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState('personal')

  function handleKey(e) {
    if (e.key === 'Enter' && text.trim()) {
      onAdd({ text: text.trim(), category })
      setText('')
    }
  }

  return (
    <div className="flex gap-2 items-center"
      style={{ background: '#161412', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 12px' }}>
      <select value={category} onChange={e => setCategory(e.target.value)}
        className="text-xs py-1 px-2 rounded-md outline-none shrink-0"
        style={{ background: '#1F1C19', color: '#C8BFB5', border: '0.5px solid rgba(255,255,255,0.08)', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem' }}>
        <option value="signal9">Signal9</option>
        <option value="app">App Dev</option>
        <option value="writing">Writing</option>
        <option value="personal">Personal</option>
      </select>
      <input
        className="flex-1 bg-transparent outline-none text-sm"
        style={{ color: '#EDE8E0', fontFamily: '"DM Sans", sans-serif' }}
        placeholder="Quick-add a task… press Enter"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKey}
      />
      <button onClick={() => { if (text.trim()) { onAdd({ text: text.trim(), category }); setText('') }}}
        style={{ background: '#C4522A', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem' }}>
        <Plus size={14} />
      </button>
    </div>
  )
}

// ─── Architectural corner brackets ───────────────────────────────────────────
function CornerBrackets({ size = 12, thickness = 1, color = '#C4522A', opacity = 0.5, inset = 0 }) {
  const s = { position: 'absolute', width: size, height: size, pointerEvents: 'none' }
  const h = { position: 'absolute', background: color, height: thickness, left: 0, right: 0 }
  const v = { position: 'absolute', background: color, width: thickness, top: 0, bottom: 0 }
  return (
    <>
      <div style={{ ...s, top: inset, left: inset }}>
        <div style={{ ...h, top: 0 }} /><div style={{ ...v, left: 0 }} />
      </div>
      <div style={{ ...s, top: inset, right: inset }}>
        <div style={{ ...h, top: 0 }} /><div style={{ ...v, right: 0 }} />
      </div>
      <div style={{ ...s, bottom: inset, left: inset }}>
        <div style={{ ...h, bottom: 0 }} /><div style={{ ...v, left: 0 }} />
      </div>
      <div style={{ ...s, bottom: inset, right: inset }}>
        <div style={{ ...h, bottom: 0 }} /><div style={{ ...v, right: 0 }} />
      </div>
    </>
  )
}

function SectionLabel({ children, color, seq = '—' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
      {/* Sequence tag */}
      <span style={{ fontFamily: '"DM Mono"', fontSize: '0.36rem', color: `${color}55`, letterSpacing: '0.08em', flexShrink: 0 }}>{seq}</span>
      {/* Bracket + label */}
      <span style={{ fontFamily: '"DM Mono"', fontSize: '0.52rem', color: `${color}70`, flexShrink: 0 }}>[</span>
      <p style={{
        fontFamily: '"DM Mono", monospace', fontSize: '0.58rem',
        color: color || '#A09890',
        letterSpacing: '0.22em', textTransform: 'uppercase',
        textShadow: `0 0 10px ${color}55`,
      }}>
        {children}
      </p>
      <span style={{ fontFamily: '"DM Mono"', fontSize: '0.52rem', color: `${color}70`, flexShrink: 0 }}>]</span>
      {/* Fading rule + terminal dot */}
      <div style={{ flex: 1, height: 0.5, background: `linear-gradient(to right, ${color}45, transparent)` }} />
      <div style={{ width: 3, height: 3, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, opacity: 0.65, flexShrink: 0 }} />
    </div>
  )
}

function SectionShell({ color, children, style }) {
  return (
    <div style={{ position: 'relative', animation: 'section-appear 0.4s ease both' }}>
      {/* Corner markers — outside clip-path, staggered blink */}
      {[
        { top: 0, left: 0 },
        { bottom: 0, left: 0 },
        { bottom: 0, right: 0 },
      ].map((pos, i) => {
        const isBottom = 'bottom' in pos
        const isRight  = 'right' in pos
        return (
          <div key={i} style={{
            position: 'absolute', ...pos, width: 12, height: 12,
            pointerEvents: 'none', zIndex: 10,
            animation: `corner-blink ${2.2 + i * 0.8}s ease-in-out ${i * 0.45}s infinite`,
          }}>
            <div style={{ position: 'absolute', [isBottom ? 'bottom' : 'top']: 0, left: 0, right: 0, height: 1, background: color, opacity: 0.6 }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, [isRight ? 'right' : 'left']: 0, width: 1, background: color, opacity: 0.6 }} />
          </div>
        )
      })}

      {/* Clipped shell */}
      <div style={{
        '--section-accent': color,
        '--section-card-tint': color + '22',
        '--section-card-border': color + '50',
        position: 'relative',
        padding: '16px 14px 18px',
        background: `linear-gradient(155deg, ${color}2E 0%, ${color}14 45%, rgba(80,20,180,0.06) 100%)`,
        border: `1px solid ${color}55`,
        boxShadow: `0 0 80px ${color}18, 0 0 30px ${color}10, inset 0 1px 0 ${color}40`,
        clipPath: 'polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%)',
        filter: `drop-shadow(0 0 32px ${color}40) drop-shadow(0 4px 14px rgba(0,0,0,0.7))`,
        ...style,
      }}>
        {/* Animated power-on bar */}
        <div style={{ position: 'relative', height: 1.5, marginBottom: 14, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: `linear-gradient(to right, ${color} 0%, ${color}cc 25%, ${color}55 60%, transparent 100%)`,
            boxShadow: `0 0 14px 1px ${color}99, 0 0 5px ${color}dd`,
            transformOrigin: 'left',
            animation: 'power-bar-sweep 1.1s cubic-bezier(0.22,1,0.36,1) both',
          }} />
          {/* Anchor tick */}
          <div style={{ position: 'absolute', left: 0, top: -3, width: 2, height: 8, background: `linear-gradient(to bottom, ${color}, transparent)` }} />
          {/* Diminishing ticks */}
          {[15, 32, 58].map((pct, i) => (
            <div key={i} style={{
              position: 'absolute', left: `${pct}%`, top: -1,
              width: 0.5, height: [5,4,3][i],
              background: `${color}${['cc','88','55'][i]}`,
            }} />
          ))}
        </div>
        {children}
      </div>
    </div>
  )
}

// Expand recurring events up to ~400 days so Today and Upcoming are always accurate
function expandRecurring(events) {
  const today = startOfDay(new Date())
  const farFuture = addDays(today, 400)
  const result = []
  for (const ev of events) {
    result.push(ev)
    if (!ev.recurring || ev.recurring === 'none') continue
    const base = parseISO(ev.date)
    for (let i = 1; i <= 60; i++) {
      const d = ev.recurring === 'weekly'       ? addDays(base, 7 * i)
              : ev.recurring === 'fortnightly'  ? addDays(base, 14 * i)
              : addMonths(base, i)
      if (d > farFuture) break
      result.push({ ...ev, id: `${ev.id}_r${i}`, date: format(d, 'yyyy-MM-dd'), _recurring: true })
    }
  }
  return result
}

const aud = (n) => Math.abs(n).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })

const BIZ_COLORS = { signal9: '#C4522A', app: '#3B82F6' }
const BIZ_LABELS = { signal9: 'Signal9 Studio', app: 'App Development' }

const BIZ_CATS = {
  signal9: ['Print', 'Market', 'Commission', 'Workshop', 'Digital', 'Other'],
  app:     ['Gumroad', 'App Store', 'Freelance', 'Consulting', 'Subscription', 'Other'],
}
const EXPENSE_CATS = {
  signal9: ['Supplies', 'Printing', 'Market Fees', 'Software', 'Equipment', 'Marketing', 'Other'],
  app:     ['Software', 'Hosting', 'Tools', 'Marketing', 'Equipment', 'Freelance', 'Other'],
}

function QuickEntryForm({ onSave, onClose }) {
  const [form, setForm] = useState({ businessId: 'signal9', type: 'income', date: format(new Date(), 'yyyy-MM-dd'), amount: '', category: 'Print', source: '', note: '' })
  const f = k => e => setForm(s => ({ ...s, [k]: e.target.value }))

  function handleBizChange(e) {
    const biz = e.target.value
    setForm(s => ({ ...s, businessId: biz, category: (s.type === 'income' ? BIZ_CATS[biz] : EXPENSE_CATS[biz])?.[0] || 'Other' }))
  }
  function handleTypeChange(t) {
    setForm(s => ({ ...s, type: t, category: (t === 'income' ? BIZ_CATS[s.businessId] : EXPENSE_CATS[s.businessId])?.[0] || 'Other' }))
  }

  const cats = form.type === 'income' ? (BIZ_CATS[form.businessId] || []) : (EXPENSE_CATS[form.businessId] || [])

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, amount: Number(form.amount) }) }} className="space-y-4">
      {/* Type toggle */}
      <div className="flex gap-2">
        {['income', 'expense'].map(t => (
          <button key={t} type="button" onClick={() => handleTypeChange(t)}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              fontFamily: '"DM Mono", monospace', letterSpacing: '0.08em', textTransform: 'uppercase',
              background: form.type === t ? (t === 'income' ? 'rgba(45,158,90,0.2)' : 'rgba(220,38,38,0.15)') : '#1F1C19',
              color: form.type === t ? (t === 'income' ? '#2D9E5A' : '#DC2626') : '#C8BFB5',
            }}>
            {t === 'income' ? '+ Income' : '− Expense'}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Business</label>
          <select className="input" value={form.businessId} onChange={handleBizChange}>
            <option value="signal9">Signal9 Studio</option>
            <option value="app">App Development</option>
          </select>
        </div>
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Date</label>
          <input type="date" className="input" value={form.date} onChange={f('date')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Amount (AUD) *</label>
          <input required type="number" step="0.01" min="0.01" className="input" value={form.amount} onChange={f('amount')} placeholder="350.00" />
        </div>
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Category</label>
          <select className="input" value={form.category} onChange={f('category')}>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-text-secondary text-xs mb-1 block">{form.type === 'income' ? 'Source' : 'Payee'} *</label>
        <input required className="input" value={form.source} onChange={f('source')}
          placeholder={form.type === 'income' ? 'e.g. Harvest Market' : 'e.g. Officeworks'} />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary">Save Entry</button>
      </div>
    </form>
  )
}

function FinancePulse({ onNavigate }) {
  const { finance, addFinanceEntry } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const { entries = [] } = finance

  const now = new Date()
  const mStart = startOfMonth(now)
  const mEnd   = endOfMonth(now)

  // Combined month totals across both businesses
  const monthEntries = entries.filter(e => { const d = parseISO(e.date); return d >= mStart && d <= mEnd })
  const monthIncome  = monthEntries.filter(e => (e.type || 'income') === 'income').reduce((a, e) => a + e.amount, 0)
  const monthExpense = monthEntries.filter(e => e.type === 'expense').reduce((a, e) => a + e.amount, 0)
  const monthNet     = monthIncome - monthExpense

  // Month progress
  const dayOfMonth = now.getDate()
  const totalDays  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const monthPct   = Math.round((dayOfMonth / totalDays) * 100)

  // Last 4 entries across all businesses, newest first
  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 4)

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#A09890', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          Finance
        </p>
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)} className="btn-ghost text-xs py-1"><Plus size={12}/> Entry</button>
          <button onClick={onNavigate}
            style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.1em',
              color: '#C4522A', background: 'rgba(196,82,42,0.1)', border: '0.5px solid rgba(196,82,42,0.25)',
              borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>
            LEDGER →
          </button>
        </div>
      </div>

      <div className="card">
        {/* Month net summary */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#A09890', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
              {format(now, 'MMMM')} net
            </p>
            <p style={{ fontFamily: '"DM Mono", monospace', fontWeight: 700, fontSize: '1.7rem', lineHeight: 1, letterSpacing: '-0.01em', color: monthNet >= 0 ? '#00FF9D' : '#FF4D6A', textShadow: monthNet >= 0 ? '0 0 20px rgba(0,255,157,0.4)' : '0 0 20px rgba(255,77,106,0.4)' }}>
              {monthNet < 0 ? '−' : '+'}{aud(monthNet)}
            </p>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: '#A09890', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>In</p>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', color: '#00FF9D', textShadow: '0 0 8px rgba(0,255,157,0.5)' }}>{aud(monthIncome)}</p>
            </div>
            <div>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: '#A09890', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Out</p>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', color: monthExpense > 0 ? '#FF4D6A' : '#A09890', textShadow: monthExpense > 0 ? '0 0 8px rgba(255,77,106,0.4)' : 'none' }}>{aud(monthExpense)}</p>
            </div>
          </div>
        </div>

        {/* Month progress bar */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: '#5C5650', letterSpacing: '0.08em' }}>
              DAY {dayOfMonth} OF {totalDays}
            </span>
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: '#5C5650', letterSpacing: '0.08em' }}>
              {monthPct}% THROUGH {format(now, 'MMM').toUpperCase()}
            </span>
          </div>
          <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
            <div style={{
              height: '100%', width: `${monthPct}%`, borderRadius: 1,
              background: `linear-gradient(to right, ${monthNet >= 0 ? '#00C870' : '#C4522A'}, ${monthNet >= 0 ? '#00FF9D' : '#FF4D6A'})`,
              boxShadow: `0 0 10px ${monthNet >= 0 ? 'rgba(0,255,157,0.6)' : 'rgba(255,77,106,0.6)'}`,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* Recent entries */}
        {recent.length > 0 ? (
          <div className="space-y-2" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
            {recent.map(e => {
              const isExp = e.type === 'expense'
              const color = BIZ_COLORS[e.businessId] || '#C8BFB5'
              return (
                <div key={e.id} className="flex items-center gap-2">
                  <div className="w-1 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#A09890', width: 36, flexShrink: 0 }}>
                    {format(parseISO(e.date), 'dd MMM')}
                  </p>
                  <p className="flex-1 min-w-0 truncate" style={{ fontSize: '0.7rem', color: '#C8BFB5' }}>{e.source}</p>
                  <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', color: isExp ? '#FF4D6A' : '#00FF9D', fontWeight: 600, flexShrink: 0, textShadow: isExp ? '0 0 6px rgba(255,77,106,0.4)' : '0 0 6px rgba(0,255,157,0.35)' }}>
                    {isExp ? '−' : '+'}{aud(e.amount)}
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#7A7470' }}>No entries yet.</p>
        )}
      </div>

      {showAdd && (
        <Modal title="Add Entry" onClose={() => setShowAdd(false)}>
          <QuickEntryForm
            onSave={(data) => { addFinanceEntry(data); setShowAdd(false) }}
            onClose={() => setShowAdd(false)} />
        </Modal>
      )}
    </section>
  )
}

// ─── Missions ─────────────────────────────────────────────────────────────────

const BIZ_ACCENT = { signal9: '#C4522A', app: '#3B82F6', writing: '#7C3AED', personal: '#7F77DD' }
const BIZ_LABEL  = { signal9: 'Signal9', app: 'App Dev', writing: 'Writing', personal: 'Personal' }

function MissionForm({ initial = {}, onSave, onClose }) {
  const [form, setForm] = useState({
    title: '', definedDone: '', businessId: 'app', targetDate: '', status: 'active',
    ...initial,
  })
  const f = k => e => setForm(s => ({ ...s, [k]: e.target.value }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Mission title *</label>
        <input required className="input" placeholder="e.g. Launch Tether on App Store"
          value={form.title} onChange={f('title')} />
      </div>
      <div>
        <label className="text-text-secondary text-xs mb-1 block">What does done look like?</label>
        <input className="input" placeholder="e.g. App is live, first 50 downloads"
          value={form.definedDone} onChange={f('definedDone')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Business arm</label>
          <select className="input" value={form.businessId} onChange={f('businessId')}>
            <option value="signal9">Signal9</option>
            <option value="app">App Dev</option>
            <option value="writing">Writing</option>
            <option value="personal">Personal</option>
          </select>
        </div>
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Target date</label>
          <input type="date" className="input" value={form.targetDate} onChange={f('targetDate')} />
        </div>
      </div>
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Status</label>
        <div className="flex gap-2">
          {['active', 'paused', 'complete'].map(s => (
            <button key={s} type="button"
              onClick={() => setForm(prev => ({ ...prev, status: s }))}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize"
              style={{
                fontFamily: '"DM Mono", monospace', letterSpacing: '0.06em',
                background: form.status === s
                  ? s === 'active' ? 'rgba(45,158,90,0.2)' : s === 'complete' ? 'rgba(59,130,246,0.2)' : 'rgba(92,86,80,0.3)'
                  : '#1F1C19',
                color: form.status === s
                  ? s === 'active' ? '#2D9E5A' : s === 'complete' ? '#60A5FA' : '#A09890'
                  : '#C8BFB5',
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary">Save Mission</button>
      </div>
    </form>
  )
}

function MissionsWidget({ onNavigateToTasks }) {
  const { missions, tasks, addMission, updateMission, deleteMission } = useStore()
  const [showAdd, setShowAdd]       = useState(false)
  const [editing, setEditing]       = useState(null)   // mission object being edited
  const [deleteId, setDeleteId]     = useState(null)
  const [expanded, setExpanded]     = useState(null)   // mission id expanded to show tasks

  const active = missions
    .filter(m => m.status !== 'complete')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, 5)

  const completed = missions.filter(m => m.status === 'complete')

  function taskStats(missionId) {
    const linked = tasks.filter(t => t.missionId === missionId)
    const done   = linked.filter(t => t.done).length
    return { total: linked.length, done }
  }

  function daysLabel(targetDate) {
    if (!targetDate) return null
    const diff = differenceInDays(new Date(targetDate), new Date())
    if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`, color: '#f87171' }
    if (diff === 0) return { label: 'due today', color: '#FBBF24' }
    return { label: `${diff}d left`, color: diff < 7 ? '#FBBF24' : '#A09890' }
  }

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#C89840', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            Active Missions
          </p>
          {active.length > 0 && (
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#5C5650',
              background: '#1F1C19', border: '0.5px solid rgba(255,255,255,0.07)',
              borderRadius: 999, padding: '1px 6px' }}>
              {active.length}/5
            </span>
          )}
        </div>
        {active.length < 5 && (
          <button onClick={() => setShowAdd(true)} className="btn-ghost text-xs py-1">
            <Plus size={12} /> Mission
          </button>
        )}
      </div>

      {/* Empty state */}
      {active.length === 0 && (
        <button onClick={() => setShowAdd(true)}
          className="card w-full flex flex-col items-center justify-center gap-2 py-6 hover:border-white/10 transition-colors"
          style={{ borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.08)' }}>
          <Target size={20} style={{ color: '#5C5650' }} />
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#5C5650', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            No active missions — add one
          </p>
          <p style={{ fontSize: '0.7rem', color: '#7A7470', maxWidth: 220, textAlign: 'center', lineHeight: 1.5 }}>
            What are the 3–5 things you're actively driving right now?
          </p>
        </button>
      )}

      {/* Mission cards */}
      {active.length > 0 && (
        <div className="space-y-2">
          {active.map(m => {
            const color = BIZ_ACCENT[m.businessId] || '#A09890'
            const { total, done } = taskStats(m.id)
            const pct = total > 0 ? Math.round((done / total) * 100) : 0
            const days = daysLabel(m.targetDate)
            const isExpanded = expanded === m.id
            const linkedTasks = tasks.filter(t => t.missionId === m.id && !t.done).slice(0, 4)

            return (
              <div key={m.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Top accent bar */}
                <div style={{ height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />

                <div style={{ padding: '12px 14px' }}>
                  {/* Row 1: title + actions */}
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p style={{ fontSize: '0.875rem', color: '#EDE8E0', fontWeight: 500, lineHeight: 1.3 }}>
                          {m.title}
                        </p>
                        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color, letterSpacing: '0.1em',
                          background: color + '18', border: `0.5px solid ${color}40`, borderRadius: 999, padding: '1px 5px' }}>
                          {BIZ_LABEL[m.businessId] || m.businessId}
                        </span>
                        {m.status === 'paused' && (
                          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#A09890', letterSpacing: '0.1em',
                            background: 'rgba(92,86,80,0.2)', borderRadius: 999, padding: '1px 5px' }}>
                            PAUSED
                          </span>
                        )}
                      </div>
                      {m.definedDone && (
                        <p style={{ fontSize: '0.7rem', color: '#7A7470', marginTop: 3, lineHeight: 1.4 }}>
                          ✓ {m.definedDone}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setEditing(m)}
                        className="p-1 rounded transition-colors hover:bg-white/5" style={{ color: '#5C5650' }}>
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => setDeleteId(m.id)}
                        className="p-1 rounded transition-colors hover:bg-red-900/20" style={{ color: '#5C5650' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: progress + days */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1" style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2,
                        background: pct === 100 ? '#2D9E5A' : color,
                        boxShadow: pct > 0 ? `0 0 6px ${color}80` : 'none',
                        transition: 'width 0.4s ease' }} />
                    </div>
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#A09890', flexShrink: 0 }}>
                      {total > 0 ? `${done}/${total} tasks` : 'no linked tasks'}
                    </p>
                    {days && (
                      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: days.color, flexShrink: 0 }}>
                        {days.label}
                      </p>
                    )}
                  </div>

                  {/* Row 3: quick actions */}
                  <div className="flex items-center gap-3 mt-2.5">
                    <button onClick={() => setExpanded(isExpanded ? null : m.id)}
                      className="flex items-center gap-1 transition-colors"
                      style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#5C5650', letterSpacing: '0.08em' }}>
                      <ChevronRight size={10} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                      {isExpanded ? 'HIDE TASKS' : 'TASKS'}
                    </button>
                    <button onClick={() => updateMission(m.id, { status: m.status === 'active' ? 'complete' : 'active' })}
                      className="transition-colors"
                      style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem',
                        color: m.status === 'complete' ? '#2D9E5A' : '#5C5650', letterSpacing: '0.08em' }}>
                      {m.status === 'complete' ? '✓ COMPLETE' : 'MARK DONE'}
                    </button>
                  </div>

                  {/* Expanded task list */}
                  {isExpanded && (
                    <div style={{ marginTop: 10, borderTop: '0.5px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                      {linkedTasks.length === 0 ? (
                        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#5C5650' }}>
                          No open tasks linked to this mission. Add tasks in the Tasks tab and assign this mission.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {linkedTasks.map(t => (
                            <div key={t.id} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                              <p style={{ fontSize: '0.75rem', color: '#C8BFB5', flex: 1, minWidth: 0 }} className="truncate">{t.text}</p>
                              {t.priority === 'high' && (
                                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#C4522A' }}>HIGH</span>
                              )}
                            </div>
                          ))}
                          {tasks.filter(t => t.missionId === m.id && !t.done).length > 4 && (
                            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', color: '#5C5650' }}>
                              +{tasks.filter(t => t.missionId === m.id && !t.done).length - 4} more
                            </p>
                          )}
                        </div>
                      )}
                      <button onClick={() => onNavigateToTasks(m.id)}
                        style={{ marginTop: 8, fontFamily: '"DM Mono", monospace', fontSize: '0.55rem',
                          color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        VIEW ALL IN TASKS →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Completed missions count */}
      {completed.length > 0 && (
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#5C5650', marginTop: 10, letterSpacing: '0.1em' }}>
          {completed.length} mission{completed.length !== 1 ? 's' : ''} completed
        </p>
      )}

      {/* Modals */}
      {showAdd && (
        <Modal title="New Mission" onClose={() => setShowAdd(false)}>
          <MissionForm onSave={data => { addMission(data); setShowAdd(false) }} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Mission" onClose={() => setEditing(null)}>
          <MissionForm initial={editing} onSave={data => { updateMission(editing.id, data); setEditing(null) }} onClose={() => setEditing(null)} />
        </Modal>
      )}
      {deleteId && (
        <ConfirmDialog title="Delete Mission"
          message="Delete this mission? Tasks linked to it won't be deleted, just unlinked."
          onConfirm={() => { deleteMission(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)} />
      )}
    </section>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { tasks, events, projects, notes, addTask } = useStore()
  const [missionFilter, setMissionFilter] = useState(null)

  const today = startOfDay(new Date())
  const in7 = addDays(today, 7)

  // Expand recurring events once — used throughout
  const allExpanded = expandRecurring(events)

  const openTasks = tasks.filter(t => !t.done)
  const upcomingEvents = allExpanded.filter(e => {
    const d = parseISO(e.date)
    return isWithinInterval(d, { start: today, end: in7 })
  })
  const activeProjects = projects.filter(p => p.status === 'active')

  const todayEvents = allExpanded
    .filter(e => isToday(parseISO(e.date)))
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))

  const topTasks = [...openTasks]
    .sort((a, b) => {
      if (a.reminder !== b.reminder) return b.reminder - a.reminder
      const pd = { high: 0, normal: 1, low: 2 }
      if (pd[a.priority] !== pd[b.priority]) return pd[a.priority] - pd[b.priority]
      return a.createdAt.localeCompare(b.createdAt)
    })
    .slice(0, 5)

  const next5Events = (() => {
    const sorted = [...allExpanded]
      .filter(e => !isPast(parseISO(e.date)) || isToday(parseISO(e.date)))
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
    // Deduplicate recurring events by title — keep only the soonest occurrence
    const seenTitles = new Set()
    return sorted.filter(e => {
      if (seenTitles.has(e.title)) return false
      seenTitles.add(e.title)
      return true
    }).slice(0, 5)
  })()

  return (
    <div>
      <LiveClock taskCount={openTasks.length} eventCount={upcomingEvents.length} />

      <div className="p-5 md:p-6 max-w-3xl space-y-7">

        {/* Stats */}
        <SectionShell color="#E05828">
          <SectionLabel color="#FF7040" seq="01">Overview</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={CheckSquare} label="Open Tasks"      value={openTasks.length}       color="#D4724A" onClick={() => navigate('/tasks')} />
            <StatCard icon={Calendar}    label="Events (7d)"     value={upcomingEvents.length}   color="#D4724A" onClick={() => navigate('/calendar')} />
            <StatCard icon={Briefcase}   label="Active Projects" value={activeProjects.length}   color="#D4724A" onClick={() => navigate('/tasks')} />
          </div>
        </SectionShell>

        {/* Quick Add + Focus Moment */}
        <SectionShell color="#B040D8">
          <SectionLabel color="#CC60F0" seq="02">Actions</SectionLabel>
          <div className="space-y-3">
            <QuickAdd onAdd={(data) => addTask(data)} />
            <FocusMomentButton />
          </div>
        </SectionShell>

        {/* Missions */}
        <SectionShell color="#D89820">
          <MissionsWidget onNavigateToTasks={(missionId) => {
            setMissionFilter(missionId)
            navigate('/tasks')
          }} />
        </SectionShell>

        {/* Today */}
        {todayEvents.length > 0 && (
          <SectionShell color="#20C880">
            <section>
              <SectionLabel color="#20E890" seq="04">Today</SectionLabel>
              <div className="space-y-2">
                {todayEvents.map(ev => (
                  <button key={ev.id} onClick={() => navigate('/calendar')}
                    className="card w-full text-left flex items-center gap-3 hover:border-white/10 transition-colors">
                    <div className="w-0.5 h-8 rounded-full shrink-0" style={{ background: CAT_COLORS[ev.category] }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: '#EDE8E0' }}>{ev.title}</p>
                      {ev.time && <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: '#A09890' }}>{ev.time}{ev.endTime ? ` — ${ev.endTime}` : ''}</p>}
                    </div>
                    {ev.reminder && <Bell size={11} style={{ color: '#A09890' }} />}
                    <CategoryBadge category={ev.category} size="xs" />
                  </button>
                ))}
              </div>
            </section>
          </SectionShell>
        )}

        {/* Top tasks */}
        <SectionShell color="#E04820">
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <SectionLabel color="#FF6040" seq="05">Active Tasks</SectionLabel>
            <button onClick={() => navigate('/tasks')} style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#A09890', letterSpacing: '0.1em' }}>
              ALL →
            </button>
          </div>
          {topTasks.length === 0
            ? <p style={{ color: '#A09890', fontSize: '0.875rem' }}>No open tasks.</p>
            : <div className="space-y-2">
                {topTasks.map(t => (
                  <button key={t.id} onClick={() => navigate('/tasks')}
                    className="card w-full text-left flex items-center gap-3 hover:border-white/10 transition-colors">
                    <div className="w-3.5 h-3.5 rounded-sm border shrink-0" style={{ borderColor: CAT_COLORS[t.category] + '80' }} />
                    <p className="text-sm flex-1 min-w-0 truncate" style={{ color: '#C8BFB5' }}>{t.text}</p>
                    {t.reminder && <Bell size={11} style={{ color: '#A09890' }} />}
                    {t.priority === 'high' && <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#C4522A', letterSpacing: '0.1em' }}>HIGH</span>}
                  </button>
                ))}
              </div>
          }
        </section>
        </SectionShell>

        {/* Upcoming */}
        <SectionShell color="#8840CC">
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <SectionLabel color="#AA60EE" seq="06">Upcoming</SectionLabel>
              <button onClick={() => navigate('/calendar')} style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#A09890', letterSpacing: '0.1em' }}>
                CALENDAR →
              </button>
            </div>
            {next5Events.length === 0
              ? <p style={{ color: '#A09890', fontSize: '0.875rem' }}>No upcoming events.</p>
              : <div className="space-y-2">
                  {next5Events.map(ev => (
                    <button key={ev.id} onClick={() => navigate('/calendar')}
                      className="card w-full text-left flex items-center gap-3 hover:border-white/10 transition-colors">
                      <div className="shrink-0 text-center w-9">
                        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#A09890', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          {format(parseISO(ev.date), 'MMM')}
                        </p>
                        <p style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '1.3rem', color: '#EDE8E0', lineHeight: 1 }}>
                          {format(parseISO(ev.date), 'd')}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: '#C8BFB5' }}>{ev.title}</p>
                        {ev.time && <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: '#A09890' }}>{ev.time}</p>}
                      </div>
                      <CategoryBadge category={ev.category} size="xs" />
                    </button>
                  ))}
                </div>
            }
          </section>
        </SectionShell>

      </div>
    </div>
  )
}
