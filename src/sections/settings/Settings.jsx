import { useState, useRef } from 'react'
import { useStore } from '../../hooks/useStore'
import { useNotifications } from '../../hooks/useNotifications'
import ConfirmDialog from '../../components/ConfirmDialog'
import SectionShell from '../../components/SectionShell'
import PageHeader from '../../components/PageHeader'
import bgImg from '../../assets/art-ethereal.jpg'

export default function Settings() {
  const { settings, updateSettings, exportData, importData, clearAllData } = useStore()
  const { permission, enabled, requestPermission, disable } = useNotifications()
  const [notifMsg, setNotifMsg] = useState('')
  const [showClear, setShowClear] = useState(false)
  const [importMsg, setImportMsg] = useState('')
  const fileRef = useRef()
  const s = settings || {}

  async function handleNotifToggle() {
    if (enabled) {
      disable()
      setNotifMsg('Notifications disabled.')
    } else {
      const result = await requestPermission()
      if (result === 'granted') setNotifMsg('Notifications enabled!')
      else if (result === 'denied') setNotifMsg('Permission denied — please allow notifications in your browser settings.')
      else if (result === 'unsupported') setNotifMsg('Notifications not supported on this device.')
      else setNotifMsg('Permission not granted.')
    }
    setTimeout(() => setNotifMsg(''), 4000)
  }

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
    <SectionShell accent="#A09890" bgImage={bgImg}>
      <PageHeader subtitle="CONFIGURATION" title="Settings" accent="#A09890" />
    <div className="p-4 md:p-6 max-w-xl">

      <div className="space-y-6">
        <section className="card space-y-4">
          <h2 className="section-label">[ Display ]</h2>
          <div>
            <label className="text-text-secondary text-xs mb-1 block">Display Name</label>
            <input className="input" value={s.displayName || 'Kirk'}
              onChange={e => updateSettings({ displayName: e.target.value })} />
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="section-label">[ Writing ]</h2>
          <div>
            <label className="text-text-secondary text-xs mb-1 block">Default Daily Word Goal</label>
            <input type="number" min="100" step="100" className="input"
              value={s.dailyWordGoal || 1000}
              onChange={e => updateSettings({ dailyWordGoal: Number(e.target.value) })} />
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="section-label">[ Notifications ]</h2>
          <p style={{ fontSize: '0.8rem', color: '#B8B0A8' }}>
            Get reminded for tasks and events that have a reminder set. Notifications are local — no account needed.
          </p>
          <button
            onClick={handleNotifToggle}
            className={enabled ? 'btn-danger w-full justify-center' : 'btn-primary w-full justify-center'}
          >
            {enabled ? '🔕 Disable Notifications' : '🔔 Enable Notifications'}
          </button>
          {permission === 'denied' && (
            <p style={{ fontSize: '0.75rem', color: '#f87171' }}>
              Notifications are blocked. Open your browser / OS settings and allow notifications for this site, then try again.
            </p>
          )}
          {notifMsg && <p style={{ fontSize: '0.8rem', color: '#7C3AED', textAlign: 'center' }}>{notifMsg}</p>}
        </section>

        <section className="card space-y-4">
          <h2 className="section-label">[ Data ]</h2>
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

        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#A09890', textAlign: 'center', letterSpacing: '0.08em' }}>
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
