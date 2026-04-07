import { getSettings } from '../shared/storage'
import type { ProtonFlowSettings, MessageType } from '../shared/types'
import { addCursorStyles, setCursor, getCursorIndex } from './cursor'
import { setLogger } from './actions'
import { initShortcuts, updateShortcutSettings } from './shortcuts'
import { createFocusEngine } from './focus'
import { runHealthChecks, saveHealthStatus } from './health'

let settings: ProtonFlowSettings

function log(...args: unknown[]) {
  if (settings?.debug) console.log('[ProtonFlow]', ...args)
}

async function init() {
  if (!window.location.hostname.includes('proton.me')) return

  settings = await getSettings()
  setLogger(log)

  log('ProtonFlow initialized', settings)

  if (settings.showCursor) addCursorStyles()

  initShortcuts(settings)

  createFocusEngine({
    getCursorIndex,
    setCursor,
    getRestoreDelay: () => settings.focusRestoreDelay,
    log,
  })

  // Run initial health checks
  const results = runHealthChecks()
  await saveHealthStatus(results)
  log('Health checks:', results)

  // Listen for messages from background / options page
  chrome.runtime.onMessage.addListener((message: MessageType, _sender, sendResponse) => {
    if (message.type === 'settingsChanged') {
      settings = message.settings
      setLogger(log)
      updateShortcutSettings(settings)
      if (settings.showCursor) addCursorStyles()
      log('Settings updated', settings)
    } else if (message.type === 'runHealthChecks') {
      const results = runHealthChecks()
      saveHealthStatus(results)
      sendResponse({ type: 'healthResults', results })
    }
    return true
  })

  // Re-run health checks after page settles
  setTimeout(async () => {
    const results = runHealthChecks()
    await saveHealthStatus(results)
    log('Health re-check:', results)
  }, 3000)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  setTimeout(init, 0)
}
