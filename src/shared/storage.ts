import { DEFAULT_SETTINGS, type ProtonFlowSettings, type HealthStatus } from './types'

export async function getSettings(): Promise<ProtonFlowSettings> {
  const result = await chrome.storage.local.get('settings')
  if (!result.settings) return { ...DEFAULT_SETTINGS }
  return { ...DEFAULT_SETTINGS, ...result.settings }
}

export async function saveSettings(settings: ProtonFlowSettings): Promise<void> {
  await chrome.storage.local.set({ settings })
}

export async function getHealthStatus(): Promise<HealthStatus | null> {
  const result = await chrome.storage.local.get('healthStatus')
  return result.healthStatus ?? null
}

export async function saveHealthStatus(status: HealthStatus): Promise<void> {
  await chrome.storage.local.set({ healthStatus: status })
}
