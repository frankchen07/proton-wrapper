import React from 'react'
import type { ProtonFlowSettings } from '../../shared/types'

interface Props {
  settings: ProtonFlowSettings
  onChange: (settings: ProtonFlowSettings) => void
}

interface ToggleRowProps {
  label: string
  description: string
  checked: boolean
  onChange: (val: boolean) => void
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
      <div>
        <div className="text-sm font-medium text-slate-800">{label}</div>
        <div className="text-xs text-slate-400 mt-0.5">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          checked ? 'bg-primary' : 'bg-slate-200'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

export default function SettingsPanel({ settings, onChange }: Props) {
  return (
    <div className="space-y-6">
      {/* Toggle settings */}
      <div className="bg-white rounded-xl border border-slate-200 px-4">
        <ToggleRow
          label="Gmail-compatible mode"
          description="Master switch for all ProtonFlow shortcuts"
          checked={settings.enabled}
          onChange={(val) => onChange({ ...settings, enabled: val })}
        />
        <ToggleRow
          label="Cursor highlight"
          description="Show a blue indicator on the currently focused message"
          checked={settings.showCursor}
          onChange={(val) => onChange({ ...settings, showCursor: val })}
        />
        <ToggleRow
          label="Debug logging"
          description="Log shortcut events to the browser console"
          checked={settings.debug}
          onChange={(val) => onChange({ ...settings, debug: val })}
        />
      </div>

      {/* Focus restore delay */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-medium text-slate-800">Focus restore delay</div>
            <div className="text-xs text-slate-400 mt-0.5">How long to wait before restoring keyboard focus after returning from a message</div>
          </div>
          <span className="text-sm font-mono font-medium text-primary bg-primary/8 px-2 py-0.5 rounded">
            {settings.focusRestoreDelay}ms
          </span>
        </div>
        <input
          type="range"
          min={100}
          max={1000}
          step={50}
          value={settings.focusRestoreDelay}
          onChange={(e) => onChange({ ...settings, focusRestoreDelay: Number(e.target.value) })}
          className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
          <span>100ms (fastest)</span>
          <span>1000ms (safest)</span>
        </div>
      </div>
    </div>
  )
}
