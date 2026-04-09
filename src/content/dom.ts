// DOM selector utilities for ProtonMail
// Uses multiple fallback selectors since Proton's React DOM isn't stable

export function isInputFocused(): boolean {
  const active = document.activeElement
  if (!active) return false

  const tagName = active.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea') return true
  if ((active as HTMLElement).contentEditable === 'true' || (active as HTMLElement).isContentEditable) return true

  let parent = active.parentElement
  while (parent && parent !== document.body) {
    if ((parent as HTMLElement).contentEditable === 'true' || (parent as HTMLElement).isContentEditable) return true
    parent = parent.parentElement
  }
  return false
}

export function isMessageOpen(): boolean {
  const indicators = [
    '[class*="message-view"]',
    '[class*="message-detail"]',
    '[class*="conversation-view"]',
    '[data-testid*="message-view"]',
    '[data-testid*="conversation-view"]',
    '[role="article"]',
  ]
  for (const selector of indicators) {
    const view = document.querySelector(selector)
    if (view && (view as HTMLElement).offsetParent !== null) {
      const rect = view.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) return true
    }
  }
  return false
}

export function isInInbox(): boolean {
  if (window.location.href.includes('/inbox')) return true
  const inboxSelectors = [
    'a[href*="inbox" i][class*="active"]',
    'a[href*="inbox" i][aria-current="page"]',
    '[data-testid*="inbox" i][class*="active"]',
    'button[title*="Inbox" i][class*="active"]',
    '[aria-label*="Inbox" i][class*="active"]',
  ]
  for (const selector of inboxSelectors) {
    const el = document.querySelector(selector)
    if (el && (el as HTMLElement).offsetParent !== null) return true
  }
  return false
}

export function getMessageItems(): Element[] {
  const selectors = [
    '[data-shortcut-target="item-container"]',
    '[data-testid*="message"]',
    '[data-testid*="conversation"]',
    '[role="listitem"]',
    '[class*="conversation-item"]',
    '[class*="message-item"]',
    '[class*="item-container"]',
  ]
  for (const selector of selectors) {
    const items = Array.from(document.querySelectorAll(selector)).filter((item) => {
      const text = item.textContent ?? ''
      return text.trim().length > 0 && (item as HTMLElement).offsetHeight > 0
    })
    if (items.length > 0) return items
  }
  return []
}

export function getSelectedMessages(): Element[] {
  return getMessageItems().filter((item) => {
    const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement | null
    if (checkbox?.checked) return true

    let parent = item.parentElement
    for (let i = 0; i < 2 && parent; i++) {
      const parentCheckbox = parent.querySelector('input[type="checkbox"]') as HTMLInputElement | null
      if (parentCheckbox?.checked) return true
      parent = parent.parentElement
    }

    return (
      item.classList.contains('selected') ||
      item.getAttribute('aria-selected') === 'true' ||
      item.getAttribute('aria-checked') === 'true'
    )
  })
}

export function findToolbarButton(keywords: string[]): HTMLButtonElement | null {
  const toolbarSelectors = [
    '[class*="toolbar"]',
    '[class*="action-bar"]',
    '[class*="actions"]',
    '[role="toolbar"]',
  ]

  // Try toolbar-scoped search first
  for (const toolbarSel of toolbarSelectors) {
    const toolbar = document.querySelector(toolbarSel)
    if (!toolbar) continue

    const buttons = Array.from(toolbar.querySelectorAll('button')) as HTMLButtonElement[]
    for (const btn of buttons) {
      if ((btn as HTMLElement).offsetParent === null || btn.disabled) continue
      const attrs = [
        btn.title,
        btn.getAttribute('aria-label') ?? '',
        btn.getAttribute('data-testid') ?? '',
        btn.textContent ?? '',
      ].map((s) => s.toLowerCase())

      if (keywords.some((kw) => attrs.some((a) => a.includes(kw)))) return btn
    }
  }

  // Global fallback
  const allButtons = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
  for (const btn of allButtons) {
    if ((btn as HTMLElement).offsetParent === null || btn.disabled) continue
    const attrs = [
      btn.title,
      btn.getAttribute('aria-label') ?? '',
      btn.getAttribute('data-testid') ?? '',
    ].map((s) => s.toLowerCase())

    if (keywords.some((kw) => attrs.some((a) => a.includes(kw)))) return btn
  }

  return null
}

export function refreshInbox(): void {
  const spinnerEl = document.querySelector('.reload-spinner')
  if (spinnerEl) {
    const btn = spinnerEl.closest('button') as HTMLButtonElement | null
    if (btn && (btn as HTMLElement).offsetParent !== null && !btn.disabled) { btn.click(); return }
  }
  const btn = findToolbarButton(['refresh', 'reload'])
  if (btn) { btn.click(); return }
  const inboxSelectors = ['a[href*="inbox" i]', '[data-testid*="inbox" i]', '[aria-label*="Inbox" i]']
  for (const sel of inboxSelectors) {
    const el = document.querySelector(sel) as HTMLElement | null
    if (el && el.offsetParent !== null) { el.click(); return }
  }
  window.location.reload()
}

export function closeMessage(): void {
  const closeSelectors = [
    'button[title*="Close" i]',
    'button[aria-label*="Close" i]',
    'button[title*="Back" i]',
    'button[aria-label*="Back" i]',
    '[data-testid*="close"]',
    '[data-testid*="back"]',
  ]
  for (const sel of closeSelectors) {
    const btn = document.querySelector(sel) as HTMLButtonElement | null
    if (btn && (btn as HTMLElement).offsetParent !== null && !btn.disabled) { btn.click(); return }
  }
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }))
}

export function clickButton(btn: HTMLButtonElement): void {
  const rect = btn.getBoundingClientRect()
  const isVisible =
    rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth

  if (!isVisible) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

  btn.focus()
  btn.click()

  const mouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, button: 0 })
  const mouseUp = new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, button: 0 })
  const click = new MouseEvent('click', { bubbles: true, cancelable: true, view: window, button: 0, detail: 1 })
  btn.dispatchEvent(mouseDown)
  setTimeout(() => {
    btn.dispatchEvent(mouseUp)
    btn.dispatchEvent(click)
  }, 5)
}
