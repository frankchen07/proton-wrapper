import React, { useState } from 'react'
import { SHORTCUT_DEFS } from '../../shared/types'
import type { ProtonFlowSettings, ActionName } from '../../shared/types'

interface Props {
  settings: ProtonFlowSettings
  onChange: (settings: ProtonFlowSettings) => void
}

const CONTEXT_LABELS: Record<string, string> = {
  any: 'Anywhere',
  list: 'List view',
  thread: 'Thread view',
  selected: 'Requires selection',
}

export default function ShortcutsPanel({ settings, onChange }: Props) {
  const [editing, setEditing] = useState<ActionName | null>(null)
  const [pendingKey, setPendingKey] = useState('')

  function getKey(action: ActionName): string {
    return settings.bindings[action] ?? SHORTCUT_DEFS.find((d) => d.action === action)?.defaultKey ?? ''
  }

  function startEdit(action: ActionName) {
    setEditing(action)
    setPendingKey('')
  }

  function handleKeyCapture(e: React.KeyboardEvent, action: ActionName) {
    e.preventDefault()
    e.stopPropagation()

    if (e.key === 'Escape') { setEditing(null); return }
    if (e.key === 'Enter') {
      if (pendingKey) commitKey(action, pendingKey)
      setEditing(null)
      return
    }
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return

    const parts: string[] = []
    if (e.shiftKey) parts.push('Shift')
    if (e.ctrlKey) parts.push('Ctrl')
    if (e.altKey) parts.push('Alt')
    parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key)
    const combo = parts.join('+')
    setPendingKey(combo)
    commitKey(action, combo)
    setEditing(null)
  }

  function commitKey(action: ActionName, key: string) {
    const def = SHORTCUT_DEFS.find((d) => d.action === action)
    const newBindings = { ...settings.bindings }
    if (key === def?.defaultKey) {
      delete newBindings[action]
    } else {
      newBindings[action] = key
    }
    onChange({ ...settings, bindings: newBindings })
  }

  function resetAll() {
    onChange({ ...settings, bindings: {} })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">Click a key to rebind. Press the new key to save, Esc to cancel.</p>
        <button
          onClick={resetAll}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Reset all
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="text-left py-2.5 px-4 font-medium text-slate-500 text-xs uppercase tracking-wide">Action</th>
              <th className="text-left py-2.5 px-4 font-medium text-slate-500 text-xs uppercase tracking-wide">Context</th>
              <th className="text-left py-2.5 px-4 font-medium text-slate-500 text-xs uppercase tracking-wide">Key</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {SHORTCUT_DEFS.map((def) => {
              const currentKey = getKey(def.action)
              const isCustom = !!settings.bindings[def.action]
              const isEditingThis = editing === def.action

              return (
                <tr key={def.action} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-4">
                    <div className="font-medium text-slate-800">{def.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{def.description}</div>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-xs text-slate-400">{CONTEXT_LABELS[def.context]}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    {isEditingThis ? (
                      <kbd
                        className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 bg-primary/10 text-primary border-2 border-primary rounded text-xs font-mono animate-pulse outline-none cursor-text"
                        tabIndex={0}
                        autoFocus
                        onKeyDown={(e) => handleKeyCapture(e, def.action)}
                        onBlur={() => setEditing(null)}
                      >
                        {pendingKey || '...'}
                      </kbd>
                    ) : (
                      <button
                        onClick={() => startEdit(def.action)}
                        className="group inline-flex items-center gap-1.5"
                      >
                        <kbd className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 border rounded text-xs font-mono transition-colors ${
                          isCustom
                            ? 'bg-accent/10 text-accent border-accent/30'
                            : 'bg-slate-100 text-slate-600 border-slate-200 group-hover:border-primary/40 group-hover:text-primary'
                        }`}>
                          {currentKey}
                        </kbd>
                        {isCustom && (
                          <span
                            className="text-[10px] text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); commitKey(def.action, SHORTCUT_DEFS.find((d) => d.action === def.action)!.defaultKey) }}
                          >
                            reset
                          </span>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
