// Cursor state management for ProtonMail message list
import { getMessageItems, isMessageOpen, closeMessage } from './dom'

const CURSOR_CLASS = 'pf-cursor'
let cursorIndex = -1

export function getCursorIndex(): number {
  return cursorIndex
}

export function getCurrentMessage(): Element | null {
  const items = getMessageItems()
  if (items.length === 0) return null

  if (cursorIndex >= 0 && cursorIndex < items.length) return items[cursorIndex]

  const selected = items.find(
    (item) =>
      item.classList.contains('selected') ||
      item.classList.contains('active') ||
      item.getAttribute('aria-selected') === 'true' ||
      item.querySelector('input[type="checkbox"]:checked') !== null,
  )
  if (selected) {
    cursorIndex = items.indexOf(selected)
    return selected
  }

  cursorIndex = 0
  return items[0]
}

export function clearCursorHighlight(): void {
  document.querySelectorAll(`.${CURSOR_CLASS}`).forEach((el) => el.classList.remove(CURSOR_CLASS))
}

export function setCursor(index: number): void {
  const items = getMessageItems()
  if (items.length === 0) { cursorIndex = -1; return }

  if (index < 0) index = items.length - 1
  if (index >= items.length) index = 0

  cursorIndex = index
  clearCursorHighlight()

  const current = items[cursorIndex] as HTMLElement
  if (current) {
    if (!current.hasAttribute('tabindex')) current.setAttribute('tabindex', '-1')
    current.classList.add(CURSOR_CLASS)
    current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    current.focus()
  }
}

export function navigateCursor(direction: 'next' | 'prev'): void {
  const items = getMessageItems()
  if (items.length === 0) return

  if (isMessageOpen()) {
    closeMessage()
    setTimeout(() => {
      if (cursorIndex < 0) {
        const current = getCurrentMessage()
        cursorIndex = current ? items.indexOf(current) : 0
      }
      const targetIndex = direction === 'next' ? cursorIndex + 1 : cursorIndex - 1
      const clamped = targetIndex < 0 ? items.length - 1 : targetIndex >= items.length ? 0 : targetIndex
      cursorIndex = clamped
      const target = items[cursorIndex] as HTMLElement
      if (target) target.click()
    }, 50)
    return
  }

  if (cursorIndex < 0) {
    const current = getCurrentMessage()
    cursorIndex = current ? items.indexOf(current) : 0
  }
  setCursor(direction === 'next' ? cursorIndex + 1 : cursorIndex - 1)
}

export function toggleSelection(): boolean {
  const current = getCurrentMessage()
  if (!current) return false

  let searchEl: Element | null = current
  for (let i = 0; i < 4 && searchEl; i++) {
    const checkbox = searchEl.querySelector('input[type="checkbox"]') as HTMLInputElement | null
    if (checkbox) {
      const wasChecked = checkbox.checked
      checkbox.click()
      checkbox.checked = !wasChecked
      ;['input', 'change'].forEach((t) =>
        checkbox.dispatchEvent(new Event(t, { bubbles: true, cancelable: true }))
      )
      checkbox.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, view: window, button: 0, detail: 1 }),
      )
      const label = checkbox.closest('label')
      if (label) label.click()

      // Re-focus cursor after selection toggle
      setTimeout(() => {
        const freshItems = getMessageItems()
        if (cursorIndex >= 0 && cursorIndex < freshItems.length) {
          const item = freshItems[cursorIndex] as HTMLElement
          item.focus()
          item.classList.add(CURSOR_CLASS)
        }
      }, 50)
      return true
    }
    searchEl = searchEl.parentElement
  }
  return false
}

export function addCursorStyles(): void {
  if (document.getElementById('pf-cursor-styles')) return
  const style = document.createElement('style')
  style.id = 'pf-cursor-styles'
  style.textContent = `
    .pf-cursor {
      background-color: rgba(31, 111, 235, 0.08) !important;
      outline: 2px solid rgba(31, 111, 235, 0.4) !important;
      outline-offset: -2px !important;
      position: relative !important;
    }
    .pf-cursor::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background-color: #1F6FEB !important;
      z-index: 1000;
    }
  `
  document.head.appendChild(style)
}
