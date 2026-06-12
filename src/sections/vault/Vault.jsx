import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Unlock, Plus, Eye, EyeOff, Copy, Check, Trash2, Pencil, X, ShieldCheck, Fingerprint, KeyRound, RefreshCw, LayoutGrid } from 'lucide-react'
import { useVault, VAULT_TYPES } from '../../hooks/useVault'
import SectionShell from '../../components/SectionShell'
import ConfirmDialog from '../../components/ConfirmDialog'
import bgImg from '../../assets/art-vintage-woman.png'

// ─── Accent colours ─────────────────────────────────────────
const PLUM = '#C084FC'
const PLUM_DIM = 'rgba(192,132,252,0.15)'
const PLUM_BORDER = 'rgba(192,132,252,0.35)'

// ─── PIN Pad ────────────────────────────────────────────────
const KEYS = [1,2,3,4,5,6,7,8,9,'✓',0,'⌫']

function PinDots({ value, maxLen = 6 }) {
  const filled = value.length
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '16px 0' }}>
      {Array.from({ length: maxLen }).map((_, i) => (
        <div key={i} style={{
          width: 14, height: 14, borderRadius: '50%',
          background: i < filled ? PLUM : 'transparent',
          border: `2px solid ${i < filled ? PLUM : 'rgba(255,255,255,0.2)'}`,
          boxShadow: i < filled ? `0 0 8px ${PLUM}` : 'none',
          transition: 'all 0.15s ease',
        }} />
      ))}
    </div>
  )
}

function PinPad({ onKey, disabled }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 12, maxWidth: 300, margin: '0 auto', width: '100%',
    }}>
      {KEYS.map(k => (
        <button
          key={k}
          disabled={disabled}
          onClick={() => onKey(String(k))}
          style={{
            height: 68, borderRadius: 14,
            background: k === '✓' ? PLUM : 'rgba(255,255,255,0.07)',
            border: k === '✓' ? 'none' : '0.5px solid rgba(255,255,255,0.12)',
            color: k === '✓' ? '#000' : '#EDE8E0',
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: k === '⌫' ? 22 : 26,
            fontWeight: k === '✓' ? 700 : 400,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.1s ease',
            boxShadow: k === '✓' ? `0 0 20px rgba(192,132,252,0.55)` : 'none',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
          }}>
          {k}
        </button>
      ))}
    </div>
  )
}

// ─── Setup Screen ────────────────────────────────────────────
function SetupScreen({ vault }) {
  // Use refs as the source of truth so auto-submit always reads current values
  const pinARef = useRef('')
  const pinBRef = useRef('')
  const stepRef = useRef('first')
  const busyRef = useRef(false)

  // Display state (just for rendering dots)
  const [display, setDisplay] = useState({ pinA: '', pinB: '', step: 'first' })
  const [error, setError] = useState('')

  const showError = (msg) => {
    setError(msg)
    setTimeout(() => setError(''), 2500)
  }

  async function submit() {
    if (busyRef.current) return
    if (stepRef.current === 'first') {
      if (pinARef.current.length < 4) { showError('Enter at least 4 digits'); return }
      stepRef.current = 'confirm'
      pinBRef.current = ''
      setDisplay(d => ({ ...d, step: 'confirm', pinB: '' }))
    } else {
      if (pinBRef.current.length < 4) { showError('Enter at least 4 digits'); return }
      if (pinARef.current !== pinBRef.current) {
        showError("PINs didn't match — try again")
        setTimeout(() => {
          stepRef.current = 'first'
          pinARef.current = ''
          pinBRef.current = ''
          setDisplay({ pinA: '', pinB: '', step: 'first' })
        }, 1800)
        return
      }
      busyRef.current = true
      await vault.setupPin(pinARef.current)
      busyRef.current = false
    }
  }

  async function handleKey(k) {
    if (busyRef.current) return
    const isConfirm = stepRef.current === 'confirm'
    const current   = isConfirm ? pinBRef.current : pinARef.current

    if (k === '⌫') {
      const next = current.slice(0, -1)
      if (isConfirm) { pinBRef.current = next; setDisplay(d => ({ ...d, pinB: next })) }
      else           { pinARef.current = next; setDisplay(d => ({ ...d, pinA: next })) }
      return
    }

    if (k === '✓') { await submit(); return }

    if (current.length < 6) {
      const next = current + k
      if (isConfirm) { pinBRef.current = next; setDisplay(d => ({ ...d, pinB: next })) }
      else           { pinARef.current = next; setDisplay(d => ({ ...d, pinA: next })) }
      if (next.length === 6) setTimeout(submit, 80)
    }
  }

  const currentVal = display.step === 'confirm' ? display.pinB : display.pinA

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12, filter: `drop-shadow(0 0 16px ${PLUM})` }}>◩</div>
      <h2 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.4rem', color: '#EDE8E0', marginBottom: 6 }}>
        Set Your Vault PIN
      </h2>
      <p style={{ fontSize: 12, color: '#B8B0A8', lineHeight: 1.6, maxWidth: 280, marginBottom: 4 }}>
        Choose a 4–6 digit PIN. All vault entries are encrypted with AES-256.{' '}
        <strong style={{ color: '#C4522A' }}>There is no recovery — don't forget it.</strong>
      </p>

      <p style={{ fontSize: 11, color: PLUM, fontFamily: '"DM Mono", monospace', letterSpacing: '0.1em', margin: '16px 0 4px' }}>
        {display.step === 'first' ? 'ENTER NEW PIN' : 'CONFIRM PIN'}
      </p>

      <PinDots value={currentVal} />

      {error && (
        <p style={{ fontSize: 12, color: '#E53E3E', margin: '0 0 12px', fontFamily: '"DM Mono", monospace' }}>{error}</p>
      )}

      <PinPad onKey={handleKey} disabled={busyRef.current} />
    </div>
  )
}

// ─── Lock Screen ─────────────────────────────────────────────
function LockScreen({ vault, onReset }) {
  const pinRef  = useRef('')
  const busyRef = useRef(false)
  const [pinDisplay, setPinDisplay] = useState('')
  const [error,    setError]     = useState('')
  const [bioAvail, setBioAvail]  = useState(false)
  const bioEnrolled = vault.isBioEnrolled()

  useEffect(() => {
    vault.bioAvailable().then(setBioAvail)
  }, [vault])

  const showError = (msg) => {
    setError(msg)
    setTimeout(() => setError(''), 2500)
  }

  async function submit() {
    if (busyRef.current) return
    if (pinRef.current.length < 4) { showError('Enter at least 4 digits'); return }
    busyRef.current = true
    const ok = await vault.unlockPin(pinRef.current)
    busyRef.current = false
    if (!ok) {
      pinRef.current = ''
      setPinDisplay('')
      showError('Incorrect PIN — try again')
    }
  }

  async function handleKey(k) {
    if (busyRef.current) return
    if (k === '⌫') {
      pinRef.current = pinRef.current.slice(0, -1)
      setPinDisplay(pinRef.current)
      return
    }
    if (k === '✓') { await submit(); return }
    if (pinRef.current.length < 6) {
      pinRef.current = pinRef.current + k
      setPinDisplay(pinRef.current)
      if (pinRef.current.length === 6) setTimeout(submit, 80)
    }
  }

  async function handleBio() {
    busyRef.current = true
    const ok = await vault.unlockBio()
    busyRef.current = false
    if (!ok) showError('Biometric failed — use PIN')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12, filter: `drop-shadow(0 0 16px ${PLUM})` }}>
        <Lock size={40} color={PLUM} strokeWidth={1.5} />
      </div>
      <h2 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.4rem', color: '#EDE8E0', marginBottom: 4 }}>
        Vault Locked
      </h2>
      <p style={{ fontSize: 12, color: '#B8B0A8', marginBottom: 4 }}>Enter your PIN then press ✓</p>

      <PinDots value={pinDisplay} />

      {error && (
        <p style={{ fontSize: 12, color: '#E53E3E', margin: '0 0 12px', fontFamily: '"DM Mono", monospace' }}>{error}</p>
      )}

      <PinPad onKey={handleKey} disabled={busyRef.current} />

      {bioAvail && bioEnrolled && (
        <button
          onClick={handleBio}
          disabled={busyRef.current}
          style={{
            marginTop: 20, display: 'flex', alignItems: 'center', gap: 10,
            background: PLUM_DIM, border: `1px solid ${PLUM_BORDER}`,
            color: PLUM, borderRadius: 14, padding: '14px 28px',
            fontFamily: '"DM Mono", monospace', fontSize: 13, letterSpacing: '0.1em',
            cursor: 'pointer', minHeight: 52, touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}>
          <Fingerprint size={18} />
          USE FACE / FINGERPRINT
        </button>
      )}

      <button
        onClick={onReset}
        style={{
          marginTop: 20, background: 'none', border: 'none',
          color: '#666', fontSize: 12, cursor: 'pointer',
          fontFamily: '"DM Mono", monospace', textDecoration: 'underline',
          padding: '12px 20px', minHeight: 44, touchAction: 'manipulation',
        }}>
        Forgot PIN / Reset Vault
      </button>
    </div>
  )
}

// ─── Entry Card ──────────────────────────────────────────────
function EntryCard({ entry, onEdit, index = 0 }) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied]     = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(entry.secret).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const TYPE_COLORS = {
    'PASSWORD':   '#E06840',
    'PIN / CODE': PLUM,
    'WIFI':       '#4ADE80',
    'ACCOUNT':    '#60A5FA',
    'NOTE':       '#F59E0B',
  }
  const typeColor = TYPE_COLORS[entry.type] || PLUM
  const anim = index % 2 === 0
    ? `phase-in-left 1.1s cubic-bezier(0.22,1,0.36,1) ${0.2 + index * 0.08}s both`
    : `phase-in-right 1.1s cubic-bezier(0.22,1,0.36,1) ${0.2 + index * 0.08}s both`

  return (
    <div
      onClick={() => onEdit(entry)}
      style={{
        background: `linear-gradient(135deg, ${typeColor}12 0%, rgba(13,12,11,0.88) 100%)`,
        border: `1px solid ${typeColor}30`,
        borderRadius: 12, overflow: 'hidden',
        cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s',
        marginBottom: 10,
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)',
        backdropFilter: 'blur(8px)',
        boxShadow: `0 0 20px ${typeColor}08`,
        animation: anim,
        display: 'flex',
      }}>
      {/* Left accent stripe */}
      <div style={{ width: 3, flexShrink: 0, background: typeColor, boxShadow: `0 0 8px ${typeColor}80` }} />
      <div style={{ flex: 1, padding: '14px 16px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: 14, color: '#EDE8E0', fontWeight: 600 }}>
          {entry.label}
        </span>
        <span style={{
          fontSize: 9, fontFamily: '"DM Mono", monospace', letterSpacing: '0.12em',
          padding: '2px 6px', borderRadius: 4,
          background: `${typeColor}22`,
          color: typeColor,
          border: `0.5px solid ${typeColor}44`,
          textShadow: `0 0 8px ${typeColor}80`,
        }}>
          {entry.type}
        </span>
      </div>

      {entry.username && (
        <p style={{ fontSize: 11, color: '#B8B0A8', fontFamily: '"DM Mono", monospace', marginBottom: 8 }}>
          {entry.username}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: '"Share Tech Mono", monospace', fontSize: 13, color: '#EDE8E0',
          letterSpacing: revealed ? '0.05em' : '0.25em',
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {revealed ? entry.secret : '••••••••'}
        </span>
        <div style={{ display: 'flex', gap: 8, marginLeft: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setRevealed(r => !r)}
            style={{ background: `${typeColor}12`, border: `0.5px solid ${typeColor}35`, borderRadius: 10, padding: '10px 14px', color: typeColor, cursor: 'pointer', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
          <button
            onClick={handleCopy}
            style={{ background: copied ? 'rgba(74,222,128,0.15)' : `${typeColor}08`, border: `0.5px solid ${copied ? 'rgba(74,222,128,0.4)' : typeColor+'30'}`, borderRadius: 10, padding: '10px 14px', color: copied ? '#4ADE80' : '#B8B0A8', cursor: 'pointer', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
      </div>

      {entry.notes && (
        <p style={{ fontSize: 11, color: '#7A7068', fontFamily: '"DM Mono", monospace', marginTop: 8, lineHeight: 1.5 }}>
          {entry.notes}
        </p>
      )}
      </div>
    </div>
  )
}

// ─── Entry Form (Add / Edit) ─────────────────────────────────
function EntryForm({ entry = {}, onSave, onDelete, onClose, title }) {
  const [label,    setLabel]    = useState(entry.label    || '')
  const [type,     setType]     = useState(entry.type     || 'PASSWORD')
  const [username, setUsername] = useState(entry.username || '')
  const [secret,   setSecret]   = useState(entry.secret   || '')
  const [notes,    setNotes]    = useState(entry.notes    || '')
  const [showSec,  setShowSec]  = useState(false)
  const [confirm,  setConfirm]  = useState(false)

  function handleSave() {
    if (!label.trim() || !secret.trim()) { alert('Label and secret are required.'); return }
    onSave({ label: label.trim(), type, username: username.trim(), secret: secret.trim(), notes: notes.trim() })
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '0.5px solid rgba(255,255,255,0.12)',
    borderRadius: 8, padding: '10px 12px',
    color: '#EDE8E0', fontSize: 16, /* 16px = iOS won't zoom on focus */
    fontFamily: '"DM Mono", monospace',
    outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle = { fontSize: 10, fontFamily: '"DM Mono", monospace', letterSpacing: '0.12em', color: '#B8B0A8', display: 'block', marginBottom: 6 }

  return (
    // Single scrollable container — sticky footer always at visible bottom
    <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', height: '100%' }}>
      {confirm && (
        <ConfirmDialog
          message={`Delete "${entry.label}"? This cannot be undone.`}
          onConfirm={() => { setConfirm(false); onDelete(entry.id) }}
          onCancel={() => setConfirm(false)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 14px', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
        <h3 style={{ fontFamily: '"DM Mono", monospace', fontSize: 13, letterSpacing: '0.12em', color: PLUM, margin: 0 }}>
          {title || (entry.id ? 'EDIT ENTRY' : 'ADD TO VAULT')}
        </h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#B8B0A8', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
      </div>

      {/* Fields */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>LABEL *</label>
          <input style={inputStyle} value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Netflix, Gate code, Bank PIN" maxLength={60} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>TYPE</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={type} onChange={e => setType(e.target.value)}>
            {VAULT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>USERNAME / EMAIL</label>
          <input style={inputStyle} value={username} onChange={e => setUsername(e.target.value)} placeholder="Optional" maxLength={80} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>PASSWORD / PIN / CODE *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              type={showSec ? 'text' : 'password'}
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="The thing you're storing"
              maxLength={200}
            />
            <button
              onClick={() => setShowSec(s => !s)}
              style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.14)', borderRadius: 10, padding: '0 16px', color: '#B8B0A8', cursor: 'pointer', flexShrink: 0, minWidth: 50, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}>
              {showSec ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>NOTES</label>
          <textarea
            style={{ ...inputStyle, minHeight: 72, resize: 'none' }}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="URL, hints, anything else…"
            maxLength={300}
          />
        </div>
      </div>

      {/* Action buttons — sticky within scroll container so keyboard can't cover them */}
      <div style={{
        position: 'sticky', bottom: 0,
        padding: '12px 20px calc(env(safe-area-inset-bottom) + 12px)',
        borderTop: '0.5px solid rgba(255,255,255,0.07)',
        background: '#111009',
        display: 'flex', gap: 10, justifyContent: 'flex-end',
      }}>
        {entry.id && (
          <button
            onClick={() => setConfirm(true)}
            style={{ background: 'rgba(239,68,68,0.12)', border: '0.5px solid rgba(239,68,68,0.3)', color: '#EF4444', borderRadius: 12, padding: '13px 18px', fontFamily: '"DM Mono", monospace', fontSize: 12, cursor: 'pointer', letterSpacing: '0.08em', minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}>
            <Trash2 size={15} />
          </button>
        )}
        <button
          onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.14)', color: '#B8B0A8', borderRadius: 12, padding: '13px 20px', fontFamily: '"DM Mono", monospace', fontSize: 13, cursor: 'pointer', letterSpacing: '0.08em', minHeight: 50, touchAction: 'manipulation' }}>
          CANCEL
        </button>
        <button
          onClick={handleSave}
          style={{ background: PLUM, border: 'none', color: '#000', borderRadius: 12, padding: '13px 24px', fontFamily: '"DM Mono", monospace', fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em', boxShadow: `0 0 14px rgba(192,132,252,0.45)`, minHeight: 50, touchAction: 'manipulation' }}>
          SAVE
        </button>
      </div>
    </div>
  )
}

// ─── Change PIN Modal ─────────────────────────────────────────
function ChangePinModal({ vault, onClose }) {
  const pinARef  = useRef('')
  const pinBRef  = useRef('')
  const stepRef  = useRef('first')
  const busyRef  = useRef(false)
  const [display, setDisplay] = useState({ pinA: '', pinB: '', step: 'first' })
  const [error, setError] = useState('')
  const [done, setDone]   = useState(false)

  const showError = (msg) => { setError(msg); setTimeout(() => setError(''), 2500) }

  async function submit() {
    if (busyRef.current) return
    if (stepRef.current === 'first') {
      if (pinARef.current.length < 4) { showError('Enter at least 4 digits'); return }
      stepRef.current = 'confirm'
      pinBRef.current = ''
      setDisplay(d => ({ ...d, step: 'confirm', pinB: '' }))
    } else {
      if (pinBRef.current.length < 4) { showError('Enter at least 4 digits'); return }
      if (pinARef.current !== pinBRef.current) {
        showError("PINs didn't match")
        setTimeout(() => {
          stepRef.current = 'first'
          pinARef.current = ''
          pinBRef.current = ''
          setDisplay({ pinA: '', pinB: '', step: 'first' })
        }, 1800)
        return
      }
      busyRef.current = true
      await vault.changePin(pinARef.current)
      busyRef.current = false
      setDone(true)
      setTimeout(onClose, 1200)
    }
  }

  async function handleKey(k) {
    if (busyRef.current) return
    const isConfirm = stepRef.current === 'confirm'
    const current   = isConfirm ? pinBRef.current : pinARef.current
    if (k === '⌫') {
      const next = current.slice(0, -1)
      if (isConfirm) { pinBRef.current = next; setDisplay(d => ({ ...d, pinB: next })) }
      else           { pinARef.current = next; setDisplay(d => ({ ...d, pinA: next })) }
      return
    }
    if (k === '✓') { await submit(); return }
    if (current.length < 6) {
      const next = current + k
      if (isConfirm) { pinBRef.current = next; setDisplay(d => ({ ...d, pinB: next })) }
      else           { pinARef.current = next; setDisplay(d => ({ ...d, pinA: next })) }
      if (next.length === 6) setTimeout(submit, 80)
    }
  }

  const currentVal = display.step === 'confirm' ? display.pinB : display.pinA

  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      {done ? (
        <p style={{ color: '#4ADE80', fontFamily: '"DM Mono", monospace', fontSize: 13, padding: 20 }}>✓ PIN changed — re-encrypted</p>
      ) : (
        <>
          <p style={{ fontSize: 11, color: PLUM, fontFamily: '"DM Mono", monospace', letterSpacing: '0.1em', marginBottom: 4 }}>
            {display.step === 'first' ? 'ENTER NEW PIN' : 'CONFIRM PIN'}
          </p>
          <PinDots value={currentVal} />
          {error && <p style={{ fontSize: 12, color: '#E53E3E', marginBottom: 12 }}>{error}</p>}
          <PinPad onKey={handleKey} disabled={busyRef.current} />
        </>
      )}
    </div>
  )
}

// ─── Password Generator ───────────────────────────────────────
function PasswordGenerator({ onClose }) {
  const [length, setLength] = useState(20)
  const [useUpper, setUseUpper] = useState(true)
  const [useLower, setUseLower] = useState(true)
  const [useNums, setUseNums] = useState(true)
  const [useSymbols, setUseSymbols] = useState(true)
  const [password, setPassword] = useState('')
  const [copied, setCopied] = useState(false)

  const generate = useCallback(() => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lower = 'abcdefghijklmnopqrstuvwxyz'
    const nums  = '0123456789'
    const syms  = '!@#$%^&*()-_=+[]{}|;:,.<>?'
    let pool = ''
    if (useUpper) pool += upper
    if (useLower) pool += lower
    if (useNums)  pool += nums
    if (useSymbols) pool += syms
    if (!pool) { setPassword('Enable at least one character type'); return }
    let pw = ''
    const arr = new Uint32Array(length)
    crypto.getRandomValues(arr)
    for (let i = 0; i < length; i++) pw += pool[arr[i] % pool.length]
    setPassword(pw)
    setCopied(false)
  }, [length, useUpper, useLower, useNums, useSymbols])

  useEffect(() => { generate() }, [generate])

  const copy = () => {
    if (!password) return
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const Toggle = ({ label, on, set }) => (
    <button onClick={() => set(v => !v)} style={{
      flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
      border: `1px solid ${on ? PLUM_BORDER : 'rgba(255,255,255,0.08)'}`,
      background: on ? PLUM_DIM : 'transparent',
      fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', letterSpacing: '0.1em',
      color: on ? PLUM : 'rgba(160,140,120,0.4)', transition: 'all 0.15s',
    }}>{label}</button>
  )

  return (
    <div style={{ padding: '16px', borderTop: '0.5px solid rgba(255,255,255,0.06)', animation: 'phase-in 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', letterSpacing: '0.18em', color: PLUM }}>PASSWORD GENERATOR</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(160,140,120,0.5)', cursor: 'pointer', padding: 4 }}><X size={14} /></button>
      </div>

      {/* Generated password display */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <div style={{
          background: 'rgba(13,12,11,0.95)', border: `1px solid ${PLUM_BORDER}`,
          borderRadius: 10, padding: '12px 48px 12px 14px',
          fontFamily: '"DM Mono", monospace', fontSize: '0.82rem',
          color: '#EDE8E0', letterSpacing: '0.06em', wordBreak: 'break-all',
          lineHeight: 1.5, minHeight: 44,
          boxShadow: `0 0 16px ${PLUM}22`,
        }}>{password}</div>
        <button onClick={copy} style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: copied ? '#4ADE80' : PLUM, transition: 'color 0.2s',
        }}>{copied ? <Check size={16} /> : <Copy size={16} />}</button>
      </div>

      {/* Length slider */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', color: 'rgba(160,140,120,0.5)', letterSpacing: '0.12em' }}>LENGTH</span>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: PLUM, fontWeight: 700 }}>{length}</span>
        </div>
        <input type="range" min={8} max={64} value={length} onChange={e => setLength(+e.target.value)}
          style={{ width: '100%', accentColor: PLUM, cursor: 'pointer' }} />
      </div>

      {/* Toggles */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <Toggle label="A–Z" on={useUpper} set={setUseUpper} />
        <Toggle label="a–z" on={useLower} set={setUseLower} />
        <Toggle label="0–9" on={useNums}  set={setUseNums} />
        <Toggle label="!@#" on={useSymbols} set={setUseSymbols} />
      </div>

      {/* Generate button */}
      <button onClick={generate} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        background: PLUM_DIM, border: `0.5px solid ${PLUM_BORDER}`, borderRadius: 10,
        padding: '12px', color: PLUM, fontFamily: '"DM Mono", monospace',
        fontSize: '0.62rem', letterSpacing: '0.15em', cursor: 'pointer',
        boxShadow: `0 0 12px ${PLUM}25`,
      }}><RefreshCw size={13} /> GENERATE NEW</button>
    </div>
  )
}

// ─── Vault Screen (Unlocked) ──────────────────────────────────
function VaultScreen({ vault }) {
  const [modal, setModal]     = useState(null)  // null | 'add' | { entry }
  const [bioAvail, setBioAvail] = useState(false)
  const [bioStatus, setBioStatus] = useState('')
  const [showGen, setShowGen] = useState(false)
  const { entries, isBioEnrolled, removeBio, enrollBio, lock } = vault

  useEffect(() => { vault.bioAvailable().then(setBioAvail) }, [vault])

  async function handleSave(data) {
    if (modal === 'add') {
      await vault.addEntry(data)
    } else {
      await vault.updateEntry(modal.id, data)
    }
    setModal(null)
  }

  async function handleDelete(id) {
    await vault.deleteEntry(id)
    setModal(null)
  }

  async function handleEnrolBio() {
    const pin = window.prompt('Enter your current vault PIN to enrol biometrics:')
    if (!pin) return
    setBioStatus('loading')
    const ok = await enrollBio(pin)
    setBioStatus(ok ? 'ok' : 'fail')
    setTimeout(() => setBioStatus(''), 2000)
  }

  const enrolled = isBioEnrolled()

  return (
    <div style={{ padding: '0 0 32px' }}>
      {/* Status bar */}
      <div style={{
        display: 'flex', gap: 12, padding: '14px 16px',
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'STATUS', value: 'OPEN', valueColor: '#4ADE80' },
          { label: 'ENTRIES', value: entries.length },
          { label: 'ENCRYPTION', value: 'AES-256' },
          { label: 'AUTO-LOCK', value: '5 MIN' },
        ].map(({ label, value, valueColor }) => (
          <div key={label} style={{ flex: '1 1 70px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontFamily: '"DM Mono", monospace', letterSpacing: '0.12em', color: '#7A7068', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 12, fontFamily: '"Share Tech Mono", monospace', color: valueColor || '#EDE8E0' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: 10 }}>
        <button
          onClick={() => setModal('add')}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: PLUM, border: 'none', borderRadius: 14, padding: '14px 16px', color: '#000', fontFamily: '"DM Mono", monospace', fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.1em', boxShadow: `0 0 16px rgba(192,132,252,0.4)`, minHeight: 52, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
          <Plus size={16} /> ADD ENTRY
        </button>
        <button
          onClick={() => setModal('changePin')}
          title="Change PIN"
          style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.14)', borderRadius: 14, padding: '14px 18px', color: '#B8B0A8', cursor: 'pointer', minWidth: 52, minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
          <KeyRound size={18} />
        </button>
        <button
          onClick={lock}
          title="Lock Vault"
          style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.14)', borderRadius: 14, padding: '14px 18px', color: '#B8B0A8', cursor: 'pointer', minWidth: 52, minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
          <Lock size={18} />
        </button>
        <button
          onClick={() => setShowGen(v => !v)}
          title="Password Generator"
          style={{ background: showGen ? PLUM_DIM : 'rgba(255,255,255,0.07)', border: showGen ? `0.5px solid ${PLUM_BORDER}` : '0.5px solid rgba(255,255,255,0.14)', borderRadius: 14, padding: '14px 18px', color: showGen ? PLUM : '#B8B0A8', cursor: 'pointer', minWidth: 52, minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.2s' }}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Password Generator panel */}
      {showGen && <PasswordGenerator onClose={() => setShowGen(false)} />}

      {/* Biometric enrolment strip */}
      {bioAvail && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{
            background: enrolled ? 'rgba(74,222,128,0.06)' : PLUM_DIM,
            border: `0.5px solid ${enrolled ? 'rgba(74,222,128,0.2)' : PLUM_BORDER}`,
            borderRadius: 10, padding: '10px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Fingerprint size={16} color={enrolled ? '#4ADE80' : PLUM} />
              <span style={{ fontSize: 11, fontFamily: '"DM Mono", monospace', color: enrolled ? '#4ADE80' : PLUM, letterSpacing: '0.08em' }}>
                {enrolled ? 'BIOMETRICS ENROLLED' : 'ENROL FACE ID / FINGERPRINT'}
              </span>
            </div>
            {enrolled ? (
              <button onClick={() => removeBio()} style={{ background: 'rgba(239,68,68,0.12)', border: '0.5px solid rgba(239,68,68,0.3)', color: '#EF4444', borderRadius: 10, padding: '10px 16px', fontFamily: '"DM Mono", monospace', fontSize: 12, cursor: 'pointer', letterSpacing: '0.08em', minHeight: 44, touchAction: 'manipulation' }}>
                REMOVE
              </button>
            ) : (
              <button
                onClick={handleEnrolBio}
                disabled={bioStatus === 'loading'}
                style={{ background: PLUM_DIM, border: `0.5px solid ${PLUM_BORDER}`, color: PLUM, borderRadius: 10, padding: '10px 16px', fontFamily: '"DM Mono", monospace', fontSize: 12, cursor: 'pointer', letterSpacing: '0.08em', minHeight: 44, touchAction: 'manipulation' }}>
                {bioStatus === 'loading' ? '…' : bioStatus === 'ok' ? '✓' : bioStatus === 'fail' ? '✕' : 'ENROL'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Entries */}
      <div style={{ padding: '0 16px' }}>
        {entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <ShieldCheck size={36} color={PLUM} style={{ opacity: 0.4, margin: '0 auto 12px' }} />
            <p style={{ fontSize: 12, color: '#7A7068', fontFamily: '"DM Mono", monospace', lineHeight: 1.6 }}>
              Vault is empty. Tap + to add a password,<br />PIN, gate code, Wi-Fi password, or account.
            </p>
          </div>
        ) : (
          entries.map((e, i) => (
            <EntryCard key={e.id} entry={e} index={i} onEdit={() => setModal(e)} />
          ))
        )}
      </div>

      {/* Modals */}
      {(modal === 'add' || (modal && modal.id)) && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setModal(null)}>
          <div
            style={{ background: '#111009', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 500, height: '80dvh', overflow: 'hidden', marginBottom: 56 }}
            onClick={e => e.stopPropagation()}>
            <EntryForm
              entry={modal === 'add' ? {} : modal}
              onSave={handleSave}
              onDelete={handleDelete}
              onClose={() => setModal(null)}
            />
          </div>
        </div>
      )}

      {modal === 'changePin' && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setModal(null)}>
          <div
            style={{ background: '#111009', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', padding: '20px 20px calc(env(safe-area-inset-bottom) + 20px)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: '"DM Mono", monospace', fontSize: 13, letterSpacing: '0.12em', color: PLUM }}>CHANGE VAULT PIN</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: '#B8B0A8', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <ChangePinModal vault={vault} onClose={() => setModal(null)} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Vault Section ───────────────────────────────────────
export default function Vault() {
  const vault = useVault()
  const navigate = useNavigate()
  const [confirmReset, setConfirmReset] = useState(false)

  // Re-render when tick changes (setup/bio state changes)
  const { isSetup, isUnlocked, tick } = vault

  const setup    = isSetup()
  const unlocked = isUnlocked()

  function handleReset() { setConfirmReset(true) }
  function doReset() { vault.resetVault(); setConfirmReset(false) }

  return (
    <SectionShell accent="#C084FC" bgImage={bgImg}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: '12px 20px 14px',
        background: 'linear-gradient(to bottom, rgba(8,7,6,0.99), rgba(13,12,11,0.95))',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '0.5px solid rgba(192,132,252,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 32px rgba(0,0,0,0.55)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/hub')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', letterSpacing: '0.14em',
              color: 'rgba(192,132,252,0.6)', background: 'rgba(192,132,252,0.08)',
              border: '0.5px solid rgba(192,132,252,0.28)', borderRadius: 6,
              padding: '5px 9px', cursor: 'pointer', textTransform: 'uppercase', flexShrink: 0,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#C084FC'; e.currentTarget.style.borderColor = 'rgba(192,132,252,0.6)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(192,132,252,0.6)'; e.currentTarget.style.borderColor = 'rgba(192,132,252,0.28)' }}
          >
            <LayoutGrid size={11} strokeWidth={1.5} />
            HUB
          </button>
          <div>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.38rem', color: 'rgba(192,132,252,0.5)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 2 }}>
              ■ SECURE VAULT
            </div>
            <h1 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: '1.1rem', color: '#C084FC', margin: 0, textShadow: '0 0 20px rgba(192,132,252,0.4)', letterSpacing: '-0.01em' }}>Vault</h1>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {unlocked
              ? <span style={{ color: '#4ADE80', textShadow: '0 0 8px rgba(74,222,128,0.5)' }}>⬛ UNLOCKED</span>
              : <span style={{ color: PLUM, opacity: 0.7 }}>{setup ? '■ LOCKED' : '■ NEW'}</span>}
          </span>
        </div>
      </div>

      {confirmReset && (
        <ConfirmDialog
          message="Reset vault? This permanently deletes ALL vault entries and your PIN. Your other app data is NOT affected."
          onConfirm={doReset}
          onCancel={() => setConfirmReset(false)}
        />
      )}

      <div style={{ maxWidth: 560 }}>
        {!setup && <SetupScreen vault={vault} />}
        {setup && !unlocked && <LockScreen vault={vault} onReset={handleReset} />}
        {setup && unlocked && <VaultScreen vault={vault} />}
      </div>
    </SectionShell>
  )
}
