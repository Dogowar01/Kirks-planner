import { useState, useRef } from 'react'
import { useStore } from '../../hooks/useStore'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function Settings() {
  const { settings, updateSettings, exportData, importData, clearAllData } = useStore()
  const [showClear, setShowClear] = useState(false)
  const [clearInput, setClearInput] = useState('')
  const [importMsg, setImportMsg] = useState('')
  const fileRef = useRef()
  const s = settings || {}

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const ok = importData(ev.target.result)
      setImportMsg(ok ? 'Import successful!' : 'Import failed — invalid file.')
      setTimeout(() => setImportMsg(''), 3000)
    }
    reader.readAsText(file)
  }

  return (
    <div className="p-4 md:p-6 max-w-xl">
      <h1 className="section-title mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Display */}
        <section className="card space-y-4">
          <h2 className="text-text-secondary text-xs font-medium uppercase tracking-wide">Display</h2>
          <div>
            <label className="text-text-secondary text-xs mb-1 block">Display Name</label>
            <input className="input" value={s.displayName || 'Kirk'}
              onChange={e => updateSettings({ displayName: e.target.value })} />
          </div>
        </section>

        {/* Writing */}
        <section className="card space-y-4">
          <h2 className="text-text-secondary text-xs font-medium uppercase tracking-wide">Writing</h2>
          <div>
            <label className="text-text-secondary text-xs mb-1 block">Default Daily Word Goal</label>
            <input type="number" min="100" step="100" className="input"
              value={s.dailyWordGoal || 1000}
              onChange={e => updateSettings({ dailyWordGoal: Number(e.target.value) })} />
          </div>
        </section>

        {/* Data */}
        <section className="card space-y-4">
          <h2 className="text-text-secondary text-xs font-medium uppercase tracking-wide">Data</h2>
          <div className="flex flex-col gap-3">
            <button onClick={exportData} className="btn-ghost w-full justify-center">
              Export all data as JSON
            </button>
            <button onClick={() => fileRef.current.click()} className="btn-ghost w-full justify-center">
              Import from JSON backup
            </button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            {importMsg && <p className="text-writing text-sm text-center">{importMsg}</p>}
          </div>
        </section>

        {/* Danger zone */}
        <section className="card space-y-4" style={{ borderColor: 'rgba(220,38,38,0.2)' }}>
          <h2 className="text-red-400 text-xs font-medium uppercase tracking-wide">Danger Zone</h2>
          <button onClick={() => setShowClear(true)} className="btn-danger w-full justify-center">
            Clear all data
          </button>
        </section>

        <p className="text-text-tertiary text-xs text-center">Signal9 Life Planner · All data stored locally on this device</p>
      </div>

      {showClear && (
        <ConfirmDialog
          title="Clear All Data"
          message="This will delete all your data and reload seed data. Type DELETE to confirm."
          onConfirm={() => { clearAllData(); setShowClear(false) }}
          onCancel={() => { setShowClear(false); setClearInput('') }} />
      )}
    </div>
  )
}
