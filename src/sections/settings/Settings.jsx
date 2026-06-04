import { useState, useRef } from 'react'
import { useStore } from '../../hooks/useStore'
import ConfirmDialog from '../../components/ConfirmDialog'
import SectionShell from '../../components/SectionShell'

export default function Settings() {
  const { settings, updateSettings, exportData, importData, clearAllData } = useStore()
  const [showClear, setShowClear] = useState(false)
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
    <SectionShell accent="#5C5650">
    <div className="p-4 md:p-6 max-w-xl">
      <h1 className="section-title mb-6" style={{ color: '#9A9088' }}>Settings</h1>

      <div className="space-y-6">
        <section className="card space-y-4">
          <h2 style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#5C5650', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Display</h2>
          <div>
            <label className="text-text-secondary text-xs mb-1 block">Display Name</label>
            <input className="input" value={s.displayName || 'Kirk'}
              onChange={e => updateSettings({ displayName: e.target.value })} />
          </div>
        </section>

        <section className="card space-y-4">
          <h2 style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#5C5650', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Writing</h2>
          <div>
            <label className="text-text-secondary text-xs mb-1 block">Default Daily Word Goal</label>
            <input type="number" min="100" step="100" className="input"
              value={s.dailyWordGoal || 1000}
              onChange={e => updateSettings({ dailyWordGoal: Number(e.target.value) })} />
          </div>
        </section>

        <section className="card space-y-4">
          <h2 style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#5C5650', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Integrations</h2>
          <div>
            <label className="text-text-secondary text-xs mb-1 block">Eventbrite Private Token</label>
            <input className="input font-mono text-xs" placeholder="Paste your Eventbrite private token"
              value={s.ticketmasterKey || ''}
              onChange={e => updateSettings({ ticketmasterKey: e.target.value })} />
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#5C5650', marginTop: 6 }}>
              Free at eventbrite.com/platform/api · finds markets, craft fairs, community events
            </p>
          </div>
        </section>

        <section className="card space-y-4">
          <h2 style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#5C5650', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Data</h2>
          <div className="flex flex-col gap-3">
            <button onClick={exportData} className="btn-ghost w-full justify-center">Export all data as JSON</button>
            <button onClick={() => fileRef.current.click()} className="btn-ghost w-full justify-center">Import from JSON backup</button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            {importMsg && <p style={{ color: '#7C3AED', fontSize: '0.875rem', textAlign: 'center' }}>{importMsg}</p>}
          </div>
        </section>

        <section className="card space-y-4" style={{ borderColor: 'rgba(220,38,38,0.15)' }}>
          <h2 style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#8B1A1A', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Danger Zone</h2>
          <button onClick={() => setShowClear(true)} className="btn-danger w-full justify-center">Clear all data</button>
        </section>

        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#5C5650', textAlign: 'center', letterSpacing: '0.08em' }}>
          Signal9 Life Planner · data stored locally on this device
        </p>
      </div>

      {showClear && (
        <ConfirmDialog title="Clear All Data"
          message="This will reset to a clean slate (your projects stay, everything else clears)."
          onConfirm={() => { clearAllData(); setShowClear(false) }}
          onCancel={() => setShowClear(false)} />
      )}
    </div>
    </SectionShell>
  )
}
