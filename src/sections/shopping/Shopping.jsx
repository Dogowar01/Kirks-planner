import { useState, useMemo } from 'react'
import { Plus, Trash2, ShoppingCart, Check } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import SectionShell from '../../components/SectionShell'
import PageHeader from '../../components/PageHeader'
import ConfirmDialog from '../../components/ConfirmDialog'
import bgImg from '../../assets/art-abstract.webp'

const ACCENT = '#F97316'

const LIST_COLORS = ['#F97316','#3EC88A','#3B82F6','#A855F7','#EC4899','#F5C842','#00C8FF','#FF4D6A']

function ShoppingItem({ item, onToggle, onDelete }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
      <button onClick={() => onToggle(item.id)} style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${item.done ? '#3EC88A' : 'rgba(255,255,255,0.15)'}`, background: item.done ? '#3EC88A20' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
        {item.done && <Check size={12} color="#3EC88A" strokeWidth={2.5} />}
      </button>
      <span style={{ flex: 1, fontFamily: '"DM Mono", monospace', fontSize: '0.82rem', color: item.done ? 'rgba(160,140,120,0.35)' : '#EDE8E0', textDecoration: item.done ? 'line-through' : 'none', transition: 'all 0.2s' }}>
        {item.name}
        {item.qty && item.qty !== '1' && <span style={{ marginLeft: 6, fontSize: '0.65rem', color: 'rgba(160,140,120,0.4)' }}>×{item.qty}</span>}
      </span>
      <button onClick={() => onDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,77,106,0.35)', padding: 4, flexShrink: 0 }}>
        <Trash2 size={13} />
      </button>
    </div>
  )
}

function ListCard({ list, onUpdate, onDeleteList, accent }) {
  const [newItem, setNewItem] = useState('')
  const [newQty, setNewQty] = useState('1')
  const [expanded, setExpanded] = useState(true)

  const done = list.items.filter(i => i.done).length
  const total = list.items.length

  const addItem = () => {
    if (!newItem.trim()) return
    const item = { id: Date.now(), name: newItem.trim(), qty: newQty, done: false }
    onUpdate(list.id, { items: [...list.items, item] })
    setNewItem('')
    setNewQty('1')
  }

  const toggleItem = (itemId) => {
    onUpdate(list.id, { items: list.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i) })
  }

  const deleteItem = (itemId) => {
    onUpdate(list.id, { items: list.items.filter(i => i.id !== itemId) })
  }

  const clearDone = () => {
    onUpdate(list.id, { items: list.items.filter(i => !i.done) })
  }

  return (
    <div style={{ background: 'rgba(14,12,11,0.85)', border: `0.5px solid ${accent}25`, borderRadius: 14, overflow: 'hidden', animation: 'phase-in 0.7s cubic-bezier(0.22,1,0.36,1) both' }}>
      {/* Header */}
      <div onClick={() => setExpanded(e => !e)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', borderBottom: expanded ? '0.5px solid rgba(255,255,255,0.05)' : 'none' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: accent, boxShadow: `0 0 8px ${accent}80`, flexShrink: 0 }} />
        <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: '1.05rem', color: '#EDE8E0', flex: 1 }}>{list.name}</span>
        {total > 0 && (
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', color: done === total && total > 0 ? '#3EC88A' : 'rgba(160,140,120,0.5)', letterSpacing: '0.1em' }}>
            {done}/{total}
          </span>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {done > 0 && <button onClick={e => { e.stopPropagation(); clearDone() }} style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.42rem', color: 'rgba(160,140,120,0.4)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.1em' }}>CLEAR DONE</button>}
          <button onClick={e => { e.stopPropagation(); onDeleteList(list.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,77,106,0.35)', padding: 2 }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '4px 16px 14px' }}>
          {/* Progress bar */}
          {total > 0 && (
            <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, margin: '10px 0 4px' }}>
              <div style={{ height: '100%', width: `${total > 0 ? (done/total)*100 : 0}%`, background: done === total ? '#3EC88A' : accent, borderRadius: 1, transition: 'width 0.3s', boxShadow: `0 0 6px ${done === total ? '#3EC88A' : accent}80` }} />
            </div>
          )}

          {/* Items */}
          <div>
            {list.items.length === 0 && (
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.58rem', color: 'rgba(160,140,120,0.3)', padding: '8px 0', letterSpacing: '0.08em' }}>No items yet</p>
            )}
            {list.items.filter(i => !i.done).map(item => (
              <ShoppingItem key={item.id} item={item} onToggle={toggleItem} onDelete={deleteItem} />
            ))}
            {list.items.filter(i => i.done).map(item => (
              <ShoppingItem key={item.id} item={item} onToggle={toggleItem} onDelete={deleteItem} />
            ))}
          </div>

          {/* Add item row */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input value={newQty} onChange={e => setNewQty(e.target.value)} placeholder="Qty" style={{ width: 44, background: 'rgba(13,12,11,0.9)', border: `1px solid ${accent}25`, borderRadius: 8, color: '#EDE8E0', fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', padding: '7px 8px', outline: 'none', textAlign: 'center' }} />
            <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()} placeholder="Add item…" style={{ flex: 1, background: 'rgba(13,12,11,0.9)', border: `1px solid ${accent}25`, borderRadius: 8, color: '#EDE8E0', fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', padding: '7px 12px', outline: 'none' }} />
            <button onClick={addItem} style={{ background: `${accent}20`, border: `1px solid ${accent}40`, color: accent, borderRadius: 8, padding: '7px 12px', cursor: 'pointer' }}>
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Shopping() {
  const { shopping, addShoppingList, updateShoppingList, deleteShoppingList } = useStore()
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [colorIdx, setColorIdx] = useState(0)
  const [deleteId, setDeleteId] = useState(null)

  const createList = () => {
    if (!newName.trim()) return
    addShoppingList({ name: newName.trim(), color: LIST_COLORS[colorIdx] })
    setNewName('')
    setColorIdx(0)
    setShowNew(false)
  }

  const totalItems = useMemo(() => shopping.reduce((s,l) => s + l.items.length, 0), [shopping])
  const doneItems = useMemo(() => shopping.reduce((s,l) => s + l.items.filter(i=>i.done).length, 0), [shopping])

  return (
    <SectionShell accent={ACCENT} bgImage={bgImg}>
      <PageHeader subtitle="LISTS" title="Shopping" accent={ACCENT} showBack>
        <button onClick={() => setShowNew(v => !v)} style={{ background: `${ACCENT}20`, border: `1px solid ${ACCENT}50`, color: ACCENT, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} />LIST
        </button>
      </PageHeader>

      <div className="p-4 max-w-2xl" style={{ paddingBottom: '3rem' }}>

        {/* New list form */}
        {showNew && (
          <div style={{ background: 'rgba(14,12,11,0.9)', border: `0.5px solid ${ACCENT}30`, borderRadius: 12, padding: '16px', marginBottom: 16, animation: 'phase-in 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', letterSpacing: '0.18em', color: `${ACCENT}80`, marginBottom: 10 }}>NEW LIST</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createList()} placeholder="List name…" autoFocus style={{ flex: 1, background: 'rgba(13,12,11,0.9)', border: `1px solid ${ACCENT}30`, borderRadius: 8, color: '#EDE8E0', fontFamily: '"DM Mono", monospace', fontSize: '0.82rem', padding: '8px 12px', outline: 'none' }} />
              <button onClick={createList} style={{ background: `${ACCENT}25`, border: `1px solid ${ACCENT}50`, color: ACCENT, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.1em' }}>CREATE</button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {LIST_COLORS.map((c, i) => (
                <button key={c} onClick={() => setColorIdx(i)} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: colorIdx === i ? `2px solid white` : '2px solid transparent', cursor: 'pointer', boxShadow: `0 0 8px ${c}80` }} />
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {shopping.length > 0 && totalItems > 0 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'LISTS', value: shopping.length, color: ACCENT },
              { label: 'ITEMS', value: totalItems, color: '#A09890' },
              { label: 'DONE', value: `${doneItems}/${totalItems}`, color: '#3EC88A' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ flex: 1, background: 'rgba(14,12,11,0.8)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.42rem', color: 'rgba(160,140,120,0.5)', letterSpacing: '0.15em', marginBottom: 3 }}>{label}</div>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.95rem', fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {shopping.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: `${ACCENT}40` }}>
            <ShoppingCart size={32} style={{ margin: '0 auto 1rem', display: 'block' }} />
            <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.1rem', marginBottom: '0.5rem', color: `${ACCENT}60` }}>No lists yet</p>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.1em' }}>Create a list to get started</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {shopping.map(list => (
              <ListCard key={list.id} list={list} accent={list.color || ACCENT} onUpdate={updateShoppingList} onDeleteList={setDeleteId} />
            ))}
          </div>
        )}
      </div>

      {deleteId && (
        <ConfirmDialog message="Delete this list and all its items?" onConfirm={() => { deleteShoppingList(deleteId); setDeleteId(null) }} onCancel={() => setDeleteId(null)} />
      )}
    </SectionShell>
  )
}
