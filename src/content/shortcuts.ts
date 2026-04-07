import { isInputFocused, getSelectedMessages } from './dom'
import { navigateCursor, toggleSelection, getCursorIndex } from './cursor'
import {
  archiveAction,
  deleteAction,
  replyAction,
  replyAllAction,
  forwardAction,
  starAction,
  markReadAction,
  markUnreadAction,
  labelAction,
  composeAction,
  focusSearchAction,
  handleGNavigation,
  performAction,
} from './actions'
import type { ProtonFlowSettings } from '../shared/types'

let settings: ProtonFlowSettings
let gKeyPressed = false
let gKeyTimeout: ReturnType<typeof setTimeout> | null = null

export function initShortcuts(initialSettings: ProtonFlowSettings) {
  settings = initialSettings
  document.addEventListener('keydown', handleKeyDown, true)
}

export function updateShortcutSettings(newSettings: ProtonFlowSettings) {
  settings = newSettings
}

function handleKeyDown(e: KeyboardEvent): boolean | void {
  if (!settings.enabled) return
  if (isInputFocused()) return

  const key = e.key.toLowerCase()
  const isShift = e.shiftKey

  // g key: start sequence
  if (key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey && !isShift) {
    if (!gKeyPressed) {
      e.preventDefault()
      e.stopPropagation()
      gKeyPressed = true
      if (gKeyTimeout) clearTimeout(gKeyTimeout)
      gKeyTimeout = setTimeout(() => { gKeyPressed = false }, 1000)
      return false
    }
  }

  // g+key navigation sequence
  if (gKeyPressed && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault()
    e.stopPropagation()
    gKeyPressed = false
    if (gKeyTimeout) clearTimeout(gKeyTimeout)
    handleGNavigation(key)
    return false
  }

  // Block non-specific modifier combos
  if (e.ctrlKey || e.metaKey || e.altKey) {
    if (!isShift || (key !== '3' && key !== 'u' && key !== 'i')) return
  }

  let handled = false

  switch (key) {
    case 'j':
      e.preventDefault()
      e.stopPropagation()
      navigateCursor('next')
      handled = true
      break

    case 'k':
      e.preventDefault()
      e.stopPropagation()
      navigateCursor('prev')
      handled = true
      break

    case ']':
    case '}':
      e.preventDefault()
      navigateCursor('next')
      handled = true
      break

    case '[':
    case '{':
      e.preventDefault()
      navigateCursor('prev')
      handled = true
      break

    case 'x':
      e.preventDefault()
      e.stopPropagation()
      toggleSelection()
      handled = true
      break

    case 'e':
      e.preventDefault()
      e.stopPropagation()
      performAction(archiveAction)
      handled = true
      break

    case '#':
    case '3':
      if (key === '#' || (key === '3' && isShift)) {
        e.preventDefault()
        e.stopPropagation()
        performAction(deleteAction)
        handled = true
      }
      break

    case 'r':
      e.preventDefault()
      replyAction()
      handled = true
      break

    case 'a':
      e.preventDefault()
      replyAllAction()
      handled = true
      break

    case 'f':
      e.preventDefault()
      forwardAction()
      handled = true
      break

    case '*':
    case '8':
      if ((isShift && key === '*') || (key === '8' && !isShift)) {
        e.preventDefault()
        starAction()
        handled = true
      }
      break

    case 'u':
      if (isShift) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        performAction(markUnreadAction)
        handled = true
      }
      break

    case 'i':
      if (isShift) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        performAction(markReadAction)
        handled = true
      }
      break

    case 'c':
      e.preventDefault()
      composeAction()
      handled = true
      break

    case '/':
      e.preventDefault()
      focusSearchAction()
      handled = true
      break

    case 'l': {
      const selected = getSelectedMessages()
      if (selected.length > 0) {
        e.preventDefault()
        e.stopPropagation()
        performAction(labelAction)
        handled = true
      }
      break
    }
  }

  if (handled) return false
}
