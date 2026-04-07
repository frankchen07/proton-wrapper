import React, { useState } from 'react'
import type { HealthStatus, MessageType } from '../../shared/types'
import { getHealthStatus } from '../../shared/storage'

interface Props {
  health: HealthStatus | null
  onRefresh: (health: HealthStatus) => void
}

export default function HealthPanel({ health, onRefresh }: Props) {
  const [checking, setChecking] = useState(false)
  const [noTab, setNoTab] = useState(false)

  async function runChecks() {
    setChecking(true)
    setNoTab(false)

    try {
      const message: MessageType = { type: 'runHealthChecks' }
      const response = await chrome.runtime.sendMessage(message)
      if (response?.results?.length) {
        const updated = await getHealthStatus()
        if (updated) onRefresh(updated)
      } else {
        setNoTab(true)
      }
    } catch {
      setNoTab(true)
    } finally {
      setChecking(false)
    }
  }

  const allOk = health?.checks.every((c) => c.ok)
  const checkedAgo = health ? formatAge(health.checkedAt) : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          {checkedAgo && (
            <p className="text-xs text-slate-400">Last checked {checkedAgo} ago</p>
          )}
          {!health && (
            <p className="text-sm text-slate-500">Open ProtonMail first, then run checks.</p>
          )}
        </div>
        <button
          onClick={runChecks}
          disabled={checking}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
        >
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            className={checking ? 'animate-spin' : ''}
          >
            <path
              d="M7 1v2.5M7 10.5V13M1 7h2.5M10.5 7H13M2.9 2.9l1.77 1.77M9.33 9.33l1.77 1.77M2.9 11.1l1.77-1.77M9.33 4.67l1.77-1.77"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            />
          </svg>
          {checking ? 'Checking...' : 'Re-run checks'}
        </button>
      </div>

      {noTab && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <span>⚠</span>
          ProtonMail tab not found. Open{' '}
          <a
            href="https://mail.proton.me"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline"
          >
            mail.proton.me
          </a>{' '}
          and re-run checks.
        </div>
      )}

      {health && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Summary banner */}
          <div className={`px-4 py-3 border-b border-slate-100 flex items-center gap-2 ${allOk ? 'bg-green-50/50' : 'bg-yellow-50/50'}`}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${allOk ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-sm font-medium">
              {allOk
                ? 'All checks passing — selectors are healthy'
                : `${health.checks.filter((c) => !c.ok).length} check(s) failing — Proton may have updated their DOM`}
            </span>
          </div>

          {/* Check rows */}
          <div className="divide-y divide-slate-100">
            {health.checks.map((check) => (
              <div key={check.name} className="flex items-start gap-3 px-4 py-3">
                <span className={`mt-0.5 flex-shrink-0 text-base ${check.ok ? 'text-green-600' : 'text-red-500'}`}>
                  {check.ok ? '✓' : '✗'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800">{check.name}</div>
                  {!check.ok && (
                    <div className="text-xs text-slate-400 mt-0.5 font-mono truncate" title={check.selector}>
                      {check.selector}
                    </div>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  check.ok
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {check.ok ? 'OK' : 'Fail'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatAge(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000)
  if (secs < 60) return `${secs}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}m`
  return `${Math.floor(secs / 3600)}h`
}
