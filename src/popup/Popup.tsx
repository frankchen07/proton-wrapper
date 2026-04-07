import React, { useEffect, useState } from 'react'
import { getSettings, saveSettings, getHealthStatus } from '../shared/storage'
import type { ProtonFlowSettings, HealthStatus, ExtensionStatus } from '../shared/types'
import { DEFAULT_SETTINGS } from '../shared/types'

function deriveStatus(settings: ProtonFlowSettings, health: HealthStatus | null): ExtensionStatus {
  if (!settings.enabled) return 'inactive'
  if (!health) return 'unknown'
  const allOk = health.checks.every((c) => c.ok)
  const anyOk = health.checks.some((c) => c.ok)
  if (allOk) return 'active'
  if (anyOk) return 'degraded'
  return 'degraded'
}

const STATUS_CONFIG: Record<ExtensionStatus, { dot: string; label: string; text: string }> = {
  active:   { dot: 'bg-green-500',  label: 'Active',   text: 'All shortcuts working' },
  degraded: { dot: 'bg-yellow-500', label: 'Degraded', text: 'Some selectors may be broken' },
  inactive: { dot: 'bg-slate-400',  label: 'Inactive', text: 'Shortcuts disabled' },
  unknown:  { dot: 'bg-slate-300',  label: 'Unknown',  text: 'Open ProtonMail to check' },
}

export default function Popup() {
  const [settings, setSettings] = useState<ProtonFlowSettings>(DEFAULT_SETTINGS)
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getSettings(), getHealthStatus()]).then(([s, h]) => {
      setSettings(s)
      setHealth(h)
      setLoading(false)
    })
  }, [])

  async function toggleEnabled() {
    const next = { ...settings, enabled: !settings.enabled }
    setSettings(next)
    await saveSettings(next)
  }

  function openOptions() {
    chrome.runtime.openOptionsPage()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[180px]">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const status = deriveStatus(settings, health)
  const sc = STATUS_CONFIG[status]

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-primary">
            <path d="M3 5h14M3 10h14M3 15h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="font-semibold text-[15px] tracking-tight">ProtonFlow</span>
        </div>

        {/* Toggle */}
        <button
          onClick={toggleEnabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
            settings.enabled ? 'bg-primary' : 'bg-slate-300'
          }`}
          role="switch"
          aria-checked={settings.enabled}
          aria-label="Enable ProtonFlow"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              settings.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-100">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium leading-tight">{sc.label}</div>
          <div className="text-[11px] text-slate-400 leading-tight mt-0.5">{sc.text}</div>
        </div>
      </div>

      {/* Last checked */}
      {health && (
        <div className="text-[11px] text-slate-400 text-center">
          Checked {formatAge(health.checkedAt)} ago
        </div>
      )}

      {/* Open settings */}
      <button
        onClick={openOptions}
        className="w-full text-[13px] font-medium text-primary hover:text-primary/80 py-1.5 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
      >
        Open settings →
      </button>
    </div>
  )
}

function formatAge(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000)
  if (secs < 60) return `${secs}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}m`
  return `${Math.floor(secs / 3600)}h`
}
