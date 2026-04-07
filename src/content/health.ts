import { getMessageItems } from './dom'
import type { HealthCheckResult, HealthStatus } from '../shared/types'

interface HealthCheck {
  name: string
  selector: string
  check: () => boolean
}

const CHECKS: HealthCheck[] = [
  {
    name: 'Message list',
    selector: '[data-shortcut-target="item-container"], [role="listitem"]',
    check: () => getMessageItems().length > 0,
  },
  {
    name: 'Compose button',
    selector: 'button[title*="Compose" i], button[aria-label*="Compose" i], [data-testid*="compose" i]',
    check: () => {
      const selectors = ['button[title*="Compose" i]', 'button[aria-label*="Compose" i]', '[data-testid*="compose" i]']
      return selectors.some((sel) => {
        const el = document.querySelector(sel) as HTMLElement | null
        return el !== null && el.offsetParent !== null
      })
    },
  },
  {
    name: 'Toolbar (action bar)',
    selector: '[class*="toolbar"], [class*="action-bar"], [role="toolbar"]',
    check: () => {
      const selectors = ['[class*="toolbar"]', '[class*="action-bar"]', '[role="toolbar"]']
      return selectors.some((sel) => document.querySelector(sel) !== null)
    },
  },
  {
    name: 'Navigation sidebar',
    selector: 'a[href*="inbox" i], [data-testid*="inbox" i], [aria-label*="Inbox" i]',
    check: () => {
      const selectors = ['a[href*="inbox" i]', '[data-testid*="inbox" i]', '[aria-label*="Inbox" i]']
      return selectors.some((sel) => {
        const el = document.querySelector(sel) as HTMLElement | null
        return el !== null && el.offsetParent !== null
      })
    },
  },
  {
    name: 'Search input',
    selector: 'input[placeholder*="Search" i], input[type="search"]',
    check: () => {
      return (
        document.querySelector('input[placeholder*="Search" i]') !== null ||
        document.querySelector('input[type="search"]') !== null
      )
    },
  },
]

export function runHealthChecks(): HealthCheckResult[] {
  return CHECKS.map((check) => ({
    name: check.name,
    selector: check.selector,
    ok: (() => {
      try { return check.check() } catch { return false }
    })(),
  }))
}

export async function saveHealthStatus(results: HealthCheckResult[]): Promise<void> {
  const status: HealthStatus = { checks: results, checkedAt: Date.now() }
  await chrome.storage.local.set({ healthStatus: status })
}
