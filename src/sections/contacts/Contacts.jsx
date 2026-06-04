import { useState } from 'react'
import { Mail, Phone, Globe, Trash2, Plus, Search } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { CATEGORIES } from '../../lib/constants'
import CategoryBadge from '../../components/CategoryBadge'
import SectionShell from '../../components/SectionShell'
import bgImg from '../../assets/art-portrait.jpg'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import { Users } from 'lucide-react'

function ContactForm({ initial = {}, onSave, onClose }) {
  const [form, setForm] = useState({ name:'', role:'', category:'personal', email:'', phone:'', website:'', note:'', address:'', ...initial })
  const f = k => e => setForm(s => ({ ...s, [k]: e.target.value }))

  return (
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
        <label className="text-text-secondary text-xs mb-1 block">Role</label>
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
  )
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
}

function ContactCard({ contact, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const cat = CATEGORIES[contact.category]

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <button onClick={() => setOpen(s=>!s)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
          style={{ backgroundColor: cat?.color }}>
          {initials(contact.name)}
        </button>
        <div className="flex-1 min-w-0" onClick={() => setOpen(s=>!s)}>
          <p className="text-text-primary text-sm font-medium">{contact.name}</p>
          {contact.role && <p className="text-text-tertiary text-xs truncate">{contact.role}</p>}
        </div>
        <CategoryBadge category={contact.category} size="xs" />
        <button onClick={() => onEdit(contact)} className="p-1 text-text-tertiary hover:text-text-secondary text-xs">Edit</button>
        <button onClick={() => onDelete(contact.id)} className="p-1 text-text-tertiary hover:text-red-400">
          <Trash2 size={14}/>
        </button>
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-xs text-app hover:underline">
              <Mail size={12}/> {contact.email}
            </a>
          )}
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-xs text-writing hover:underline">
              <Phone size={12}/> {contact.phone}
            </a>
          )}
          {contact.website && (
            <a href={contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-personal hover:underline">
              <Globe size={12}/> {contact.website}
            </a>
          )}
          {contact.note && <p className="text-text-secondary text-xs whitespace-pre-wrap">{contact.note}</p>}
        </div>
      )}
    </div>
  )
}

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
    <SectionShell accent="#9A9088" bgImage={bgImg}>
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">Contacts</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16}/> Add</button>
      </div>

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
            {filtered.map(c => (
              <ContactCard key={c.id} contact={c}
                onEdit={(c) => setEditContact(c)}
                onDelete={(id) => setDeleteId(id)} />
            ))}
          </div>
      }

      {(showModal || editContact) && (
        <Modal title={editContact ? 'Edit Contact' : 'Add Contact'} onClose={() => { setShowModal(false); setEditContact(null) }}>
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
