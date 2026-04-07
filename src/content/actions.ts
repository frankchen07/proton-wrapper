import {
  isMessageOpen,
  isInInbox,
  getMessageItems,
  getSelectedMessages,
  findToolbarButton,
  clickButton,
  closeMessage,
  refreshInbox,
} from './dom'
import { getCurrentMessage, getCursorIndex, toggleSelection } from './cursor'

let _log: (...args: unknown[]) => void = () => {}
export function setLogger(fn: (...args: unknown[]) => void) {
  _log = fn
}

export { closeMessage, refreshInbox }

export function archiveAction(): boolean {
  _log('Archiving...')
  const btn = findToolbarButton(['archive'])
  if (btn) { clickButton(btn); return true }
  _log('Archive button not found')
  return false
}

export function deleteAction(): boolean {
  _log('Deleting...')
  const btn = findToolbarButton(['delete', 'trash'])
  if (btn) { setTimeout(() => clickButton(btn), 50); return true }
  _log('Delete button not found')
  return false
}

export function replyAction(): void {
  const current = getCurrentMessage()
  if (!current) return
  current.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  setTimeout(() => {
    const selectors = [
      'button[title*="Reply" i]:not([title*="Reply all" i])',
      'button[aria-label*="Reply" i]:not([aria-label*="Reply all" i])',
      '[data-testid*="reply"]:not([data-testid*="reply-all"])',
    ]
    for (const sel of selectors) {
      const btn = document.querySelector(sel) as HTMLButtonElement | null
      if (btn && btn.offsetParent !== null) { btn.click(); return }
    }
  }, 50)
}

export function replyAllAction(): void {
  const selected = getSelectedMessages()
  const target = selected.length > 1 ? selected[0] : getCurrentMessage()
  if (!target) return
  target.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  setTimeout(() => {
    const selectors = [
      'button[title*="Reply all" i]',
      'button[aria-label*="Reply all" i]',
      '[data-testid*="reply-all" i]',
    ]
    for (const sel of selectors) {
      const btn = document.querySelector(sel) as HTMLButtonElement | null
      if (btn && btn.offsetParent !== null) { btn.click(); return }
    }
  }, 50)
}

export function forwardAction(): void {
  const current = getCurrentMessage()
  if (!current) return
  current.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  setTimeout(() => {
    const selectors = ['button[title*="Forward" i]', 'button[aria-label*="Forward" i]', '[data-testid*="forward" i]']
    for (const sel of selectors) {
      const btn = document.querySelector(sel) as HTMLButtonElement | null
      if (btn && btn.offsetParent !== null) { btn.click(); return }
    }
  }, 50)
}

export function starAction(): boolean {
  const current = getCurrentMessage()
  if (!current) return false
  const selectors = ['button[title*="Star" i]', 'button[title*="Unstar" i]', '[data-testid*="star" i]']
  for (const sel of selectors) {
    const btn = current.querySelector(sel) as HTMLButtonElement | null
    if (btn) { btn.click(); return true }
  }
  return false
}

export function markUnreadAction(): boolean {
  _log('Marking as unread...')
  const btn = findToolbarButton(['unread'])
  if (btn) { setTimeout(() => clickButton(btn), 50); return true }
  _log('Mark unread button not found')
  return false
}

export function markReadAction(): boolean {
  _log('Marking as read...')
  const btn = findToolbarButton(['read'])
  if (btn) { setTimeout(() => clickButton(btn), 50); return true }
  _log('Mark read button not found')
  return false
}

export function labelAction(): boolean {
  _log('Opening label dialog...')
  const btn = findToolbarButton(['label', 'tag'])
  if (btn) {
    const rect = btn.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    setTimeout(() => {
      btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, button: 0, clientX: x, clientY: y }))
      setTimeout(() => {
        btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, button: 0, clientX: x, clientY: y }))
        setTimeout(() => {
          btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, button: 0, detail: 1, clientX: x, clientY: y }))
        }, 5)
      }, 5)
    }, 50)
    return true
  }
  _log('Label button not found')
  return false
}

export function composeAction(): boolean {
  const selectors = ['button[title*="Compose" i]', 'button[aria-label*="Compose" i]', '[data-testid*="compose" i]']
  for (const sel of selectors) {
    const btn = document.querySelector(sel) as HTMLButtonElement | null
    if (btn && (btn as HTMLElement).offsetParent !== null) { btn.click(); return true }
  }
  return false
}

export function focusSearchAction(): boolean {
  const selectors = ['input[placeholder*="Search" i]', 'input[type="search"]', '[data-testid*="search" i]']
  for (const sel of selectors) {
    const input = document.querySelector(sel) as HTMLInputElement | null
    if (input) { input.focus(); input.select(); return true }
  }
  return false
}

export function handleGNavigation(key: string): boolean {
  if (key === 'i') {
    if (isMessageOpen()) {
      closeMessage()
      setTimeout(() => navigateToFolder(['inbox']), 100)
      return true
    } else if (isInInbox()) {
      refreshInbox()
      return true
    }
  }

  const navMap: Record<string, string[]> = {
    i: ['inbox'],
    s: ['starred'],
    d: ['drafts'],
    a: ['all'],
    t: ['sent'],
  }

  const terms = navMap[key]
  if (terms) { navigateToFolder(terms); return true }
  return false
}

function navigateToFolder(terms: string[]): void {
  const selectors = terms.flatMap((t) => [
    `a[href*="${t}" i]`,
    `[data-testid*="${t}" i]`,
    `button[title*="${t}" i]`,
    `[aria-label*="${t}" i]`,
  ])
  for (const sel of selectors) {
    const el = document.querySelector(sel) as HTMLElement | null
    if (el && el.offsetParent !== null) { el.click(); return }
  }
}

export function refocusSelection(selected: Element[]): void {
  if (selected.length === 0) return
  const first = selected[0] as HTMLElement
  setTimeout(() => {
    const rect = first.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      first.dispatchEvent(new MouseEvent('click', {
        bubbles: true, cancelable: true, view: window, button: 0,
        clientX: rect.left + rect.width * 0.3,
        clientY: rect.top + rect.height / 2,
      }))
      first.focus()
    }
  }, 50)
}

export function performAction(actionFn: () => void): void {
  const selected = getSelectedMessages()
  const current = getCurrentMessage()
  const idx = getCursorIndex()
  const wasMessageOpen = isMessageOpen()

  _log(`performAction: selected=${selected.length}, hasCurrentMsg=${!!current}, msgOpen=${wasMessageOpen}`)

  if (selected.length > 1 && wasMessageOpen) {
    closeMessage()
    setTimeout(() => {
      refocusSelection(selected)
      setTimeout(() => actionFn(), 100)
    }, 100)
    return
  }

  if (selected.length > 0) {
    if (wasMessageOpen) refocusSelection(selected)
    const delay = (wasMessageOpen ? 50 : 0) + (selected.length > 1 ? 50 : 0)
    setTimeout(() => actionFn(), delay)
  } else if (current || idx >= 0) {
    toggleSelection()
    setTimeout(() => actionFn(), 100)
  }
}
