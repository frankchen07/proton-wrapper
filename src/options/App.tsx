import React, { useEffect, useState } from 'react'
import { getSettings, saveSettings, getHealthStatus } from '../shared/storage'
import type { ProtonFlowSettings, HealthStatus } from '../shared/types'
import { DEFAULT_SETTINGS } from '../shared/types'
import ShortcutsPanel from './components/ShortcutsPanel'
import SettingsPanel from './components/SettingsPanel'
import HealthPanel from './components/HealthPanel'

type Tab = 'shortcuts' | 'settings' | 'health'

export default function App() {
  const [settings, setSettings] = useState<ProtonFlowSettings>(DEFAULT_SETTINGS)
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [tab, setTab] = useState<Tab>('shortcuts')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getSettings(), getHealthStatus()]).then(([s, h]) => {
      setSettings(s)
      setHealth(h)
      setLoading(false)
    })
  }, [])

  async function handleChange(next: ProtonFlowSettings) {
    setSettings(next)
    setSaving(true)
    setSaved(false)
    await saveSettings(next)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'shortcuts', label: 'Shortcuts' },
    { key: 'settings', label: 'Settings' },
    { key: 'health', label: 'Health' },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-primary flex-shrink-0">
              <path d="M3 6h16M3 11h16M3 16h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div>
              <h1 className="text-[17px] font-semibold tracking-tight text-slate-900">ProtonFlow</h1>
              <p className="text-xs text-slate-400">Use ProtonMail like Gmail</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {saving && <span className="text-slate-400">Saving…</span>}
            {saved && <span className="text-green-600 font-medium">Saved</span>}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-white border border-slate-200 rounded-xl p-1 w-fit">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    tab === key
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {label}
                  {key === 'health' && health && (
                    <span className={`ml-1.5 inline-block w-1.5 h-1.5 rounded-full ${
                      health.checks.every((c) => c.ok) ? 'bg-green-400' : 'bg-yellow-400'
                    } ${tab === 'health' ? 'opacity-70' : ''}`} />
                  )}
                </button>
              ))}
            </div>

            {/* Panel */}
            {tab === 'shortcuts' && (
              <ShortcutsPanel settings={settings} onChange={handleChange} />
            )}
            {tab === 'settings' && (
              <SettingsPanel settings={settings} onChange={handleChange} />
            )}
            {tab === 'health' && (
              <HealthPanel health={health} onRefresh={setHealth} />
            )}
          </>
        )}
      </main>
    </div>
  )
}
