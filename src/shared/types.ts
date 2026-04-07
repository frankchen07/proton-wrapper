export type ActionName =
  | 'nextMessage'
  | 'prevMessage'
  | 'toggleSelect'
  | 'archive'
  | 'delete'
  | 'reply'
  | 'replyAll'
  | 'forward'
  | 'star'
  | 'markRead'
  | 'markUnread'
  | 'compose'
  | 'search'
  | 'label'
  | 'goInbox'
  | 'goStarred'
  | 'goDrafts'
  | 'goAllMail'
  | 'goSent'

export interface ProtonFlowSettings {
  enabled: boolean
  bindings: Partial<Record<ActionName, string>>
  focusRestoreDelay: number
  showCursor: boolean
  debug: boolean
}

export interface ShortcutDef {
  action: ActionName
  defaultKey: string
  label: string
  description: string
  context: 'any' | 'list' | 'thread' | 'selected'
}

export interface HealthCheckResult {
  name: string
  ok: boolean
  selector: string
}

export interface HealthStatus {
  checks: HealthCheckResult[]
  checkedAt: number
}

export type ExtensionStatus = 'active' | 'degraded' | 'inactive' | 'unknown'

export const DEFAULT_SETTINGS: ProtonFlowSettings = {
  enabled: true,
  bindings: {},
  focusRestoreDelay: 300,
  showCursor: true,
  debug: false,
}

export const SHORTCUT_DEFS: ShortcutDef[] = [
  { action: 'nextMessage', defaultKey: 'j', label: 'Next message', description: 'Move cursor down', context: 'list' },
  { action: 'prevMessage', defaultKey: 'k', label: 'Previous message', description: 'Move cursor up', context: 'list' },
  { action: 'toggleSelect', defaultKey: 'x', label: 'Select thread', description: 'Toggle message selection', context: 'list' },
  { action: 'archive', defaultKey: 'e', label: 'Archive', description: 'Archive selected messages', context: 'selected' },
  { action: 'delete', defaultKey: 'Shift+3', label: 'Delete', description: 'Move to trash', context: 'selected' },
  { action: 'reply', defaultKey: 'r', label: 'Reply', description: 'Reply to current message', context: 'thread' },
  { action: 'replyAll', defaultKey: 'a', label: 'Reply all', description: 'Reply all to current message', context: 'thread' },
  { action: 'forward', defaultKey: 'f', label: 'Forward', description: 'Forward current message', context: 'thread' },
  { action: 'star', defaultKey: '8', label: 'Star', description: 'Toggle star', context: 'any' },
  { action: 'markRead', defaultKey: 'Shift+I', label: 'Mark read', description: 'Mark as read', context: 'selected' },
  { action: 'markUnread', defaultKey: 'Shift+U', label: 'Mark unread', description: 'Mark as unread', context: 'selected' },
  { action: 'compose', defaultKey: 'c', label: 'Compose', description: 'Open compose window', context: 'any' },
  { action: 'search', defaultKey: '/', label: 'Search', description: 'Focus search input', context: 'any' },
  { action: 'label', defaultKey: 'l', label: 'Label', description: 'Open label dialog (requires selection)', context: 'selected' },
  { action: 'goInbox', defaultKey: 'g i', label: 'Go to inbox', description: 'Navigate to inbox (or refresh)', context: 'any' },
  { action: 'goStarred', defaultKey: 'g s', label: 'Go to starred', description: 'Navigate to starred', context: 'any' },
  { action: 'goDrafts', defaultKey: 'g d', label: 'Go to drafts', description: 'Navigate to drafts', context: 'any' },
  { action: 'goAllMail', defaultKey: 'g a', label: 'Go to all mail', description: 'Navigate to all mail', context: 'any' },
  { action: 'goSent', defaultKey: 'g t', label: 'Go to sent', description: 'Navigate to sent', context: 'any' },
]

export type MessageType =
  | { type: 'settingsChanged'; settings: ProtonFlowSettings }
  | { type: 'runHealthChecks' }
  | { type: 'healthResults'; results: HealthCheckResult[] }
