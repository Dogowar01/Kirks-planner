import { useState, useRef } from 'react'
import { Mail, Phone, Globe, Trash2, Plus, Search, Camera, Loader2, ScanLine, X, Pin, PinOff, MessageSquare } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { CATEGORIES } from '../../lib/constants'
import CategoryBadge from '../../components/CategoryBadge'
import SectionShell from '../../components/SectionShell'
import PageHeader from '../../components/PageHeader'
import bgImg from '../../assets/art-portrait.jpg'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import { Users } from 'lucide-react'

// ─── OCR + parser ────────────────────────────────────────────────────────────

async function runOCR(imageFile) {
  // Dynamically import Tesseract so it only loads when actually used
  // v7 API: createWorker(langs) — paths are resolved automatically from CDN
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng')
  const { data: { text } } = await worker.recognize(imageFile)
  await worker.terminate()
  return text
}

function parseCard(raw) {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)

  // Email
  const emailMatch = raw.match(/[\w.+\-]+@[\w\-]+\.[\w.]{2,}/i)
  const email = emailMatch ? emailMatch[0].toLowerCase() : ''

  // Phone — Aus/intl formats
  const phoneMatch = raw.match(/(\+?[\d\s\-().]{7,20})/)
  let phone = phoneMatch ? phoneMatch[0].replace(/\s+/g, ' ').trim() : ''
  // Basic sanity: must have at least 7 digits
  if ((phone.match(/\d/g) || []).length < 7) phone = ''

  // Website
  const webMatch = raw.match(/(?:https?:\/\/|www\.)[^\s,]+/i)
  const website = webMatch ? (webMatch[0].startsWith('http') ? webMatch[0] : 'https://' + webMatch[0]) : ''

  // Strip found tokens from lines to help find name/role
  const usedTokens = [email, phone.replace(/\s/g,''), website].filter(Boolean)
  const cleanLines = lines.filter(l => {
    const lc = l.toLowerCase()
    return !usedTokens.some(t => lc.includes(t.toLowerCase().slice(0, 10)))
      && l.length > 1
      && l.length < 60
      && !/^[\d\s\-+().]+$/.test(l) // skip pure phone-number lines
  })

  // Heuristic: longest capitalised line is probably the name
  const nameLine = [...cleanLines].sort((a, b) => {
    const aScore = (a.match(/[A-Z]/g) || []).length
    const bScore = (b.match(/[A-Z]/g) || []).length
    return bScore - aScore || b.length - a.length
  })[0] || ''

  // Role is the next substantive line after name
  const nameIdx = cleanLines.indexOf(nameLine)
  const role = cleanLines[nameIdx + 1] || cleanLines.find((l, i) => i !== nameIdx) || ''

  return {
    name: nameLine,
    role,
    email,
    phone,
    website,
    category: 'personal',
    note: '',
    address: '',
  }
}

// ─── Card Scanner component ───────────────────────────────────────────────────

function CardScanner({ onParsed, onClose }) {
  const [status, setStatus] = useState('idle') // idle | scanning | done | error
  const [preview, setPreview] = useState(null)
  const [scanText, setScanText] = useState('')
  const [errMsg, setErrMsg] = useState('')
  const fileRef = useRef(null)

  async function handleFile(file) {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setStatus('scanning')
    setScanText('Loading OCR engine…')

    try {
      setScanText('Loading OCR engine…')
      const text = await runOCR(file)
      setScanText('Parsing details…')
      const parsed = parseCard(text)
      setStatus('done')
      onParsed(parsed)
    } catch (err) {
      console.error('OCR error:', err)
      setErrMsg(err?.message || 'Unknown error')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-4">
      {/* Preview area */}
      <div
        className="relative flex items-center justify-center rounded-xl overflow-hidden cursor-pointer"
        style={{
          minHeight: 180,
          background: '#111009',
          border: '1px dashed rgba(255,255,255,0.12)',
        }}
        onClick={() => status === 'idle' && fileRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Card" className="w-full object-contain" style={{ maxHeight: 240 }} />
        ) : (
          <div className="flex flex-col items-center gap-3 py-8" style={{ color: '#A09890' }}>
            <ScanLine size={32} strokeWidth={1.2} />
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.12em' }}>
              TAP TO PHOTOGRAPH / SELECT IMAGE
            </p>
          </div>
        )}

        {/* Scanning overlay */}
        {status === 'scanning' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: 'rgba(13,12,11,0.82)', backdropFilter: 'blur(4px)' }}>
            {/* Animated scan line */}
            <div style={{ position: 'relative', width: 180, height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 1, overflow: 'visible' }}>
              <div style={{
                position: 'absolute', top: -1, left: 0, width: '40%', height: 4,
                background: 'linear-gradient(90deg, transparent, #C4522A, transparent)',
                borderRadius: 2,
                animation: 'scanline 1.4s ease-in-out infinite',
              }} />
            </div>
            <Loader2 size={22} style={{ color: '#C4522A', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#C8BFB5', letterSpacing: '0.1em' }}>
              {scanText}
            </p>
          </div>
        )}
      </div>

      {/* Hidden file input — accept images, prefer camera on mobile */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files?.[0])}
      />

      {status === 'idle' && (
        <div className="flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-primary flex-1">
            <Camera size={15}/> Take Photo / Choose Image
          </button>
          <button onClick={onClose} className="btn-ghost"><X size={15}/></button>
        </div>
      )}

      {status === 'scanning' && (
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#A09890', textAlign: 'center', letterSpacing: '0.1em' }}>
          This takes 5–15 seconds the first time while the OCR engine loads…
        </p>
      )}

      {status === 'error' && (
        <div className="space-y-2">
          <p style={{ color: '#f87171', fontSize: '0.8rem', textAlign: 'center' }}>
            Couldn't read the card — try a clearer photo with good lighting.
          </p>
          {errMsg && (
            <p style={{ color: '#7A7470', fontSize: '0.65rem', fontFamily: '"DM Mono", monospace', textAlign: 'center', wordBreak: 'break-all' }}>
              {errMsg}
            </p>
          )}
          <button onClick={() => { setStatus('idle'); setPreview(null); setErrMsg('') }} className="btn-ghost w-full">
            Try Again
          </button>
        </div>
      )}

      <style>{`
        @keyframes scanline { 0%,100% { left: 0 } 50% { left: 60% } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

// ─── Contact form ─────────────────────────────────────────────────────────────

function ContactForm({ initial = {}, onSave, onClose }) {
  const [showScanner, setShowScanner] = useState(false)
  const [form, setForm] = useState({
    name: '', role: '', category: 'personal',
    email: '', phone: '', website: '', note: '', address: '',
    ...initial
  })
  const f = k => e => setForm(s => ({ ...s, [k]: e.target.value }))

  function handleParsed(data) {
    setForm(s => ({
      ...s,
      name:    data.name    || s.name,
      role:    data.role    || s.role,
      email:   data.email   || s.email,
      phone:   data.phone   || s.phone,
      website: data.website || s.website,
    }))
    setShowScanner(false)
  }

  return (
    <div className="space-y-4">
      {/* Scan card button — only for new contacts */}
      {!initial?.name && (
        <button
          type="button"
          onClick={() => setShowScanner(s => !s)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-colors"
          style={{
            background: showScanner ? 'rgba(196,82,42,0.12)' : 'rgba(255,255,255,0.03)',
            border: `0.5px solid ${showScanner ? 'rgba(196,82,42,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: showScanner ? '#C4522A' : '#C8BFB5',
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.65rem',
            letterSpacing: '0.12em',
          }}>
          <ScanLine size={14} />
          {showScanner ? 'HIDE SCANNER' : 'SCAN BUSINESS CARD'}
        </button>
      )}

      {showScanner && (
        <CardScanner onParsed={handleParsed} onClose={() => setShowScanner(false)} />
      )}

      {/* Form fields */}
      <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-text-secondary text-xs mb-1 block">Name *</label>
            <input required className="input" value={form.name} onChange={f('name')} />
          </div>
          <div>
            <label className="text-text-secondary text-xs mb-1 block">Category</label>
            <select className="input" value={form.category} onChange={f('category')}>
              {Object.entries(CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Role / Company</label>
          <input className="input" value={form.role} onChange={f('role')} placeholder="e.g. Fine art printer" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-text-secondary text-xs mb-1 block">Email</label>
            <input type="email" className="input" value={form.email} onChange={f('email')} />
          </div>
          <div>
            <label className="text-text-secondary text-xs mb-1 block">Phone</label>
            <input type="tel" className="input" value={form.phone} onChange={f('phone')} />
          </div>
        </div>
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Website</label>
          <input type="url" className="input" value={form.website} onChange={f('website')} placeholder="https://" />
        </div>
        <div>
          <label className="text-text-secondary text-xs mb-1 block">Note</label>
          <textarea className="input h-20 resize-none" value={form.note} onChange={f('note')} placeholder="Context, history, notes..." />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" className="btn-primary">Save Contact</button>
        </div>
      </form>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
}

// ─── Contact card ─────────────────────────────────────────────────────────────

function ContactCard({ contact, onEdit, onDelete, onPin, index = 0 }) {
  const [open, setOpen] = useState(false)
  const cat = CATEGORIES[contact.category]
  const color = cat?.color || '#E06840'
  const anim = index % 2 === 0
    ? `phase-in-left 1.1s cubic-bezier(0.22,1,0.36,1) ${0.2 + index * 0.08}s both`
    : `phase-in-right 1.1s cubic-bezier(0.22,1,0.36,1) ${0.2 + index * 0.08}s both`

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', animation: anim }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{ width: 3, flexShrink: 0, background: color, boxShadow: `0 0 8px ${color}80` }} />
        <div style={{ flex: 1, padding: '12px 14px' }}>
      {/* Header row */}
      <div className="flex items-center gap-3">
        <button onClick={() => setOpen(s=>!s)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
          style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}60` }}>
          {initials(contact.name)}
        </button>
        <div className="flex-1 min-w-0" onClick={() => setOpen(s=>!s)}>
          <p className="text-text-primary text-sm font-medium">{contact.name}</p>
          {contact.role && <p className="text-text-tertiary text-xs truncate">{contact.role}</p>}
        </div>
        <button onClick={() => onEdit(contact)} className="p-1 text-text-tertiary hover:text-text-secondary text-xs">Edit</button>
        <button onClick={() => onDelete(contact.id)} className="p-1 text-text-tertiary hover:text-red-400">
          <Trash2 size={14}/>
        </button>
      </div>

      {/* Quick action row — always visible */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
        {contact.phone && (
          <a href={`tel:${contact.phone}`}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', letterSpacing: '0.08em', color: '#3EC88A', background: 'rgba(62,200,138,0.1)', border: '0.5px solid rgba(62,200,138,0.35)', borderRadius: 6, padding: '5px 9px', textDecoration: 'none' }}>
            <Phone size={11} /> CALL
          </a>
        )}
        {contact.phone && (
          <a href={`sms:${contact.phone}`}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', letterSpacing: '0.08em', color: '#00C8FF', background: 'rgba(0,200,255,0.08)', border: '0.5px solid rgba(0,200,255,0.3)', borderRadius: 6, padding: '5px 9px', textDecoration: 'none' }}>
            <MessageSquare size={11} /> TEXT
          </a>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', letterSpacing: '0.08em', color: '#A09890', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 9px', textDecoration: 'none' }}>
            <Mail size={11} /> EMAIL
          </a>
        )}
        <div style={{ flex: 1 }} />
        {/* Pin button — prominent */}
        <button onClick={() => onPin(contact)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontFamily: '"DM Mono", monospace', fontSize: '0.46rem', letterSpacing: '0.1em',
            color: contact.pinned ? '#00C8FF' : '#4A4540',
            background: contact.pinned ? 'rgba(0,200,255,0.1)' : 'rgba(255,255,255,0.03)',
            border: `0.5px solid ${contact.pinned ? 'rgba(0,200,255,0.45)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 6, padding: '5px 10px', cursor: 'pointer', transition: 'all 0.2s',
          }}>
          {contact.pinned ? <PinOff size={11} /> : <Pin size={11} />}
          {contact.pinned ? 'PINNED' : 'PIN'}
        </button>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: `${color}25` }}>
          {contact.phone && <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.58rem', color: '#6A6258' }}>{contact.phone}</p>}
          {contact.email && <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.58rem', color: '#6A6258' }}>{contact.email}</p>}
          {contact.website && (
            <a href={contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs hover:underline" style={{ color: '#00FF9D' }}>
              <Globe size={12}/> {contact.website}
            </a>
          )}
          {contact.note && <p className="text-text-secondary text-xs whitespace-pre-wrap">{contact.note}</p>}
        </div>
      )}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Contacts() {
  const { contacts, addContact, updateContact, deleteContact } = useStore()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editContact, setEditContact] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const filtered = contacts.filter(c => {
    if (filter !== 'all' && c.category !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.role?.toLowerCase().includes(q) || c.note?.toLowerCase().includes(q)
    }
    return true
  }).sort((a,b) => a.name.localeCompare(b.name))

  return (
    <SectionShell accent="#E06840" bgImage={bgImg}>
      <PageHeader subtitle="CONTACTS" title="Contacts" accent="#E06840" showBack>
        <button onClick={() => setShowModal(true)} style={{
          background: 'rgba(224,104,64,0.12)', border: '0.5px solid rgba(224,104,64,0.5)',
          color: '#E06840', borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.12em',
        }}><Plus size={14} strokeWidth={2} /> ADD</button>
      </PageHeader>
    <div className="p-4 md:p-6 max-w-2xl">

      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input className="input pl-8" placeholder="Search contacts…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="flex gap-1.5 flex-wrap mb-4">
        {['all', ...Object.keys(CATEGORIES)].map(k => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === k ? 'bg-signal9 text-white' : 'bg-bg-elevated text-text-secondary hover:text-text-primary'}`}>
            {k === 'all' ? 'All' : CATEGORIES[k]?.label}
          </button>
        ))}
      </div>

      {filtered.length === 0
        ? <EmptyState icon={Users} title="No contacts" description="Add contacts to keep track of people across your work." />
        : <div className="space-y-2">
            {filtered.map((c, i) => (
              <ContactCard key={c.id} contact={c} index={i}
                onEdit={(c) => setEditContact(c)}
                onDelete={(id) => setDeleteId(id)}
                onPin={(c) => updateContact(c.id, { pinned: !c.pinned })} />
            ))}
          </div>
      }

      {(showModal || editContact) && (
        <Modal title={editContact ? 'Edit Contact' : 'Add Contact'} onClose={() => { setShowModal(false); setEditContact(null) }} size="lg">
          <ContactForm initial={editContact || {}}
            onSave={(data) => {
              if (editContact) updateContact(editContact.id, data)
              else addContact(data)
              setShowModal(false); setEditContact(null)
            }}
            onClose={() => { setShowModal(false); setEditContact(null) }} />
        </Modal>
      )}

      {deleteId && (
        <ConfirmDialog title="Delete Contact" message="Delete this contact?"
          onConfirm={() => { deleteContact(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)} />
      )}
    </div>
    </SectionShell>
  )
}
