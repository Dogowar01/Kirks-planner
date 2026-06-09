import { useState, useEffect, useCallback } from 'react'
import { Lock, Unlock, Plus, Eye, EyeOff, Copy, Check, Trash2, Pencil, X, ShieldCheck, Fingerprint, KeyRound, RefreshCw } from 'lucide-react'
import { useVault, VAULT_TYPES } from '../../hooks/useVault'
import SectionShell from '../../components/SectionShell'
import ConfirmDialog from '../../components/ConfirmDialog'
import bgImg from '../../assets/art-vintage-woman.jpg'

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
      gap: 10, maxWidth: 240, margin: '0 auto',
    }}>
      {KEYS.map(k => (
        <button
          key={k}
          disabled={disabled}
          onClick={() => onKey(String(k))}
          style={{
            height: 56, borderRadius: 10,
            background: k === '✓' ? PLUM : 'rgba(255,255,255,0.06)',
            border: k === '✓' ? 'none' : '0.5px solid rgba(255,255,255,0.1)',
            color: k === '✓' ? '#000' : '#EDE8E0',
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: k === '⌫' ? 20 : 22,
            fontWeight: k === '✓' ? 700 : 400,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.1s ease',
            boxShadow: k === '✓' ? `0 0 16px rgba(192,132,252,0.5)` : 'none',
          }}>
          {k}
        </button>
      ))}
    </div>
  )
}

// ─── Setup Screen ────────────────────────────────────────────
function SetupScreen({ vault }) {
  const [pinA, setPinA] = useState('')
  const [pinB, setPinB] = useState('')
  const [step, setStep]   = useState('first') // 'first' | 'confirm'
  const [error, setError] = useState('')
  const [busy, setBusy]   = useState(false)

  const showError = (msg) => {
    setError(msg)
    setTimeout(() => setError(''), 2500)
  }

  async function handleKey(k) {
    if (busy) return
    const current = step === 'confirm' ? pinB : pinA
    const setter  = step === 'confirm' ? setPinB : setPinA

    if (k === '⌫') { setter(current.slice(0, -1)); return }

    if (k === '✓') {
      if (current.length < 4) { showError('Enter at least 4 digits'); return }
      if (step === 'first') {
        setStep('confirm'); setPinB(''); return
      }
      // Confirm step
      if (pinA !== pinB) {
        showError("PINs didn't match — try again")
        setTimeout(() => { setStep('first'); setPinA(''); setPinB('') }, 1800)
        return
      }
      setBusy(true)
      await vault.setupPin(pinA)
      setBusy(false)
      return
    }

    if (current.length < 6) {
      const next = current + k
      setter(next)
      // Auto-submit at 6 digits
      if (next.length === 6) {
        setTimeout(() => handleKey('✓'), 80)
      }
    }
  }

  const currentVal = step === 'confirm' ? pinB : pinA

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
        {step === 'first' ? 'ENTER NEW PIN' : 'CONFIRM PIN'}
      </p>

      <PinDots value={currentVal} />

      {error && (
        <p style={{ fontSize: 12, color: '#E53E3E', margin: '0 0 12px', fontFamily: '"DM Mono", monospace' }}>{error}</p>
      )}

      <PinPad onKey={handleKey} disabled={busy} />
    </div>
  )
}

// ─── Lock Screen ─────────────────────────────────────────────
function LockScreen({ vault, onReset }) {
  const [pin, setPin]         = useState('')
  const [error, setError]     = useState('')
  const [busy, setBusy]       = useState(false)
  const [bioAvail, setBioAvail] = useState(false)
  const bioEnrolled = vault.isBioEnrolled()

  useEffect(() => {
    vault.bioAvailable().then(setBioAvail)
  }, [vault])

  const showError = (msg) => {
    setError(msg)
    setTimeout(() => setError(''), 2500)
  }

  async function handleKey(k) {
    if (busy) return
    if (k === '⌫') { setPin(p => p.slice(0, -1)); return }
    if (k === '✓') {
      if (pin.length < 4) { showError('Enter at least 4 digits'); return }
      setBusy(true)
      const ok = await vault.unlockPin(pin)
      setBusy(false)
      if (!ok) { setPin(''); showError('Incorrect PIN — try again') }
      return
    }
    if (pin.length < 6) {
      const next = pin + k
      setPin(next)
      if (next.length === 6) setTimeout(() => handleKey('✓'), 80)
    }
  }

  async function handleBio() {
    setBusy(true)
    const ok = await vault.unlockBio()
    setBusy(false)
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

      <PinDots value={pin} />

      {error && (
        <p style={{ fontSize: 12, color: '#E53E3E', margin: '0 0 12px', fontFamily: '"DM Mono", monospace' }}>{error}</p>
      )}

      <PinPad onKey={handleKey} disabled={busy} />

      {bioAvail && bioEnrolled && (
        <button
          onClick={handleBio}
          disabled={busy}
          style={{
            marginTop: 20, display: 'flex', alignItems: 'center', gap: 8,
            background: PLUM_DIM, border: `1px solid ${PLUM_BORDER}`,
            color: PLUM, borderRadius: 10, padding: '10px 20px',
            fontFamily: '"DM Mono", monospace', fontSize: 12, letterSpacing: '0.1em',
            cursor: 'pointer',
          }}>
          <Fingerprint size={16} />
          USE FACE / FINGERPRINT
        </button>
      )}

      <button
        onClick={onReset}
        style={{
          marginTop: 16, background: 'none', border: 'none',
          color: '#666', fontSize: 11, cursor: 'pointer',
          fontFamily: '"DM Mono", monospace', textDecoration: 'underline',
        }}>
        Forgot PIN / Reset Vault
      </button>
    </div>
  )
}

// ─── Entry Card ──────────────────────────────────────────────
function EntryCard({ entry, onEdit }) {
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

  return (
    <div
      onClick={() => onEdit(entry)}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: '14px 16px',
        cursor: 'pointer', transition: 'border-color 0.15s',
        marginBottom: 10,
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = PLUM_BORDER}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 13, color: '#EDE8E0', fontWeight: 500 }}>
          {entry.label}
        </span>
        <span style={{
          fontSize: 9, fontFamily: '"DM Mono", monospace', letterSpacing: '0.12em',
          padding: '2px 6px', borderRadius: 4,
          background: `${TYPE_COLORS[entry.type] || PLUM}22`,
          color: TYPE_COLORS[entry.type] || PLUM,
          border: `0.5px solid ${TYPE_COLORS[entry.type] || PLUM}44`,
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
        <div style={{ display: 'flex', gap: 6, marginLeft: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setRevealed(r => !r)}
            style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 8px', color: '#B8B0A8', cursor: 'pointer', fontSize: 10, fontFamily: '"DM Mono", monospace', letterSpacing: '0.08em' }}>
            {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
          <button
            onClick={handleCopy}
            style={{ background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)', border: `0.5px solid ${copied ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, padding: '4px 8px', color: copied ? '#4ADE80' : '#B8B0A8', cursor: 'pointer', fontSize: 10, fontFamily: '"DM Mono", monospace', letterSpacing: '0.08em' }}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      {entry.notes && (
        <p style={{ fontSize: 11, color: '#7A7068', fontFamily: '"DM Mono", monospace', marginTop: 8, lineHeight: 1.5 }}>
          {entry.notes}
        </p>
      )}
    </div>
  )
}

// ─── Entry Form (Add / Edit) ─────────────────────────────────
function EntryForm({ entry = {}, onSave, onDelete, onClose }) {
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
    color: '#EDE8E0', fontSize: 13,
    fontFamily: '"DM Mono", monospace',
    outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle = { fontSize: 10, fontFamily: '"DM Mono", monospace', letterSpacing: '0.12em', color: '#B8B0A8', display: 'block', marginBottom: 6 }

  return (
    <div>
      {confirm && (
        <ConfirmDialog
          message={`Delete "${entry.label}"? This cannot be undone.`}
          onConfirm={() => { setConfirm(false); onDelete(entry.id) }}
          onCancel={() => setConfirm(false)}
        />
      )}

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
            style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '0 12px', color: '#B8B0A8', cursor: 'pointer', flexShrink: 0 }}>
            {showSec ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>NOTES</label>
        <textarea
          style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="URL, hints, anything else…"
          maxLength={300}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        {entry.id && (
          <button
            onClick={() => setConfirm(true)}
            style={{ background: 'rgba(239,68,68,0.12)', border: '0.5px solid rgba(239,68,68,0.3)', color: '#EF4444', borderRadius: 8, padding: '8px 14px', fontFamily: '"DM Mono", monospace', fontSize: 11, cursor: 'pointer', letterSpacing: '0.08em' }}>
            <Trash2 size={13} />
          </button>
        )}
        <button
          onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)', color: '#B8B0A8', borderRadius: 8, padding: '8px 16px', fontFamily: '"DM Mono", monospace', fontSize: 11, cursor: 'pointer', letterSpacing: '0.08em' }}>
          CANCEL
        </button>
        <button
          onClick={handleSave}
          style={{ background: PLUM, border: 'none', color: '#000', borderRadius: 8, padding: '8px 18px', fontFamily: '"DM Mono", monospace', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em', boxShadow: `0 0 12px rgba(192,132,252,0.4)` }}>
          SAVE
        </button>
      </div>
    </div>
  )
}

// ─── Change PIN Modal ─────────────────────────────────────────
function ChangePinModal({ vault, onClose }) {
  const [pinA, setPinA]   = useState('')
  const [pinB, setPinB]   = useState('')
  const [step, setStep]   = useState('first')
  const [error, setError] = useState('')
  const [busy, setBusy]   = useState(false)
  const [done, setDone]   = useState(false)

  const showError = (msg) => { setError(msg); setTimeout(() => setError(''), 2500) }

  async function handleKey(k) {
    if (busy) return
    const current = step === 'confirm' ? pinB : pinA
    const setter  = step === 'confirm' ? setPinB : setPinA
    if (k === '⌫') { setter(current.slice(0, -1)); return }
    if (k === '✓') {
      if (current.length < 4) { showError('Enter at least 4 digits'); return }
      if (step === 'first') { setStep('confirm'); setPinB(''); return }
      if (pinA !== pinB) {
        showError("PINs didn't match")
        setTimeout(() => { setStep('first'); setPinA(''); setPinB('') }, 1800)
        return
      }
      setBusy(true)
      await vault.changePin(pinA)
      setBusy(false)
      setDone(true)
      setTimeout(onClose, 1200)
      return
    }
    if (current.length < 6) {
      const next = current + k
      setter(next)
      if (next.length === 6) setTimeout(() => handleKey('✓'), 80)
    }
  }

  const currentVal = step === 'confirm' ? pinB : pinA

  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      {done ? (
        <p style={{ color: '#4ADE80', fontFamily: '"DM Mono", monospace', fontSize: 13, padding: 20 }}>✓ PIN changed — re-encrypted</p>
      ) : (
        <>
          <p style={{ fontSize: 11, color: PLUM, fontFamily: '"DM Mono", monospace', letterSpacing: '0.1em', marginBottom: 4 }}>
            {step === 'first' ? 'ENTER NEW PIN' : 'CONFIRM PIN'}
          </p>
          <PinDots value={currentVal} />
          {error && <p style={{ fontSize: 12, color: '#E53E3E', marginBottom: 12 }}>{error}</p>}
          <PinPad onKey={handleKey} disabled={busy} />
        </>
      )}
    </div>
  )
}

// ─── Vault Screen (Unlocked) ──────────────────────────────────
function VaultScreen({ vault }) {
  const [modal, setModal]     = useState(null)  // null | 'add' | { entry }
  const [bioAvail, setBioAvail] = useState(false)
  const [bioStatus, setBioStatus] = useState('')
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
      <div style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
        <button
          onClick={() => setModal('add')}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: PLUM, border: 'none', borderRadius: 10, padding: '10px 16px', color: '#000', fontFamily: '"DM Mono", monospace', fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.1em', boxShadow: `0 0 14px rgba(192,132,252,0.35)` }}>
          <Plus size={14} /> ADD ENTRY
        </button>
        <button
          onClick={() => setModal('changePin')}
          title="Change PIN"
          style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', color: '#B8B0A8', cursor: 'pointer' }}>
          <KeyRound size={16} />
        </button>
        <button
          onClick={lock}
          title="Lock Vault"
          style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', color: '#B8B0A8', cursor: 'pointer' }}>
          <Lock size={16} />
        </button>
      </div>

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
              <button onClick={() => removeBio()} style={{ background: 'rgba(239,68,68,0.12)', border: '0.5px solid rgba(239,68,68,0.3)', color: '#EF4444', borderRadius: 6, padding: '4px 10px', fontFamily: '"DM Mono", monospace', fontSize: 10, cursor: 'pointer', letterSpacing: '0.08em' }}>
                REMOVE
              </button>
            ) : (
              <button
                onClick={handleEnrolBio}
                disabled={bioStatus === 'loading'}
                style={{ background: PLUM_DIM, border: `0.5px solid ${PLUM_BORDER}`, color: PLUM, borderRadius: 6, padding: '4px 10px', fontFamily: '"DM Mono", monospace', fontSize: 10, cursor: 'pointer', letterSpacing: '0.08em' }}>
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
          entries.map(e => (
            <EntryCard key={e.id} entry={e} onEdit={() => setModal(e)} />
          ))
        )}
      </div>

      {/* Modals */}
      {(modal === 'add' || (modal && modal.id)) && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setModal(null)}>
          <div
            style={{ background: '#111009', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', padding: '20px 20px calc(env(safe-area-inset-bottom) + 20px)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: '"DM Mono", monospace', fontSize: 13, letterSpacing: '0.12em', color: PLUM }}>
                {modal === 'add' ? 'ADD TO VAULT' : 'EDIT ENTRY'}
              </h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: '#B8B0A8', cursor: 'pointer' }}><X size={18} /></button>
            </div>
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
      <div style={{ padding: '12px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.5rem', color: '#EDE8E0', margin: 0, lineHeight: 1.2 }}>Vault</h1>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 10, letterSpacing: '0.15em', color: '#7A7068', margin: '3px 0 0', textTransform: 'uppercase' }}>
            {unlocked ? 'Unlocked — Locks in 5 min' : setup ? 'Locked' : 'First-time setup'}
          </p>
        </div>
        {unlocked ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Unlock size={14} color="#4ADE80" strokeWidth={1.5} />
            <span style={{ fontSize: 10, fontFamily: '"DM Mono", monospace', color: '#4ADE80', letterSpacing: '0.1em' }}>OPEN</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={14} color={PLUM} strokeWidth={1.5} />
            <span style={{ fontSize: 10, fontFamily: '"DM Mono", monospace', color: PLUM, letterSpacing: '0.1em' }}>{setup ? 'LOCKED' : 'NEW'}</span>
          </div>
        )}
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
