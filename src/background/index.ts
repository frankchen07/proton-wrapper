import { getSettings, saveSettings } from '../shared/storage'
import { DEFAULT_SETTINGS } from '../shared/types'
import type { ProtonFlowSettings, MessageType } from '../shared/types'

// Initialize defaults on install
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await getSettings()
  if (!existing || Object.keys(existing).length === 0) {
    await saveSettings(DEFAULT_SETTINGS)
  }
})

// Broadcast settings changes to all Proton Mail content scripts
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'sync' || !changes.settings) return

  const newSettings = changes.settings.newValue as ProtonFlowSettings
  const tabs = await chrome.tabs.query({ url: 'https://mail.proton.me/*' })

  for (const tab of tabs) {
    if (tab.id === undefined) continue
    try {
      const message: MessageType = { type: 'settingsChanged', settings: newSettings }
      await chrome.tabs.sendMessage(tab.id, message)
    } catch {
      // Tab may not have content script loaded yet — safe to ignore
    }
  }
})

// Handle health check requests from options page
chrome.runtime.onMessage.addListener((message: MessageType, _sender, sendResponse) => {
  if (message.type !== 'runHealthChecks') return

  chrome.tabs.query({ url: 'https://mail.proton.me/*' }).then(async (tabs) => {
    const tab = tabs[0]
    if (!tab?.id) {
      sendResponse({ type: 'healthResults', results: [] })
      return
    }
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'runHealthChecks' } as MessageType)
      sendResponse(response)
    } catch {
      sendResponse({ type: 'healthResults', results: [] })
    }
  })

  return true // async response
})
