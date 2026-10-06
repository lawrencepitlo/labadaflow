/**
 * Time utilities — stored in UTC, displayed in Asia/Manila.
 */

const TIMEZONE = 'Asia/Manila'

/**
 * Format a date for display in Asia/Manila timezone.
 * Returns: "Oct 6, 2026, 10:30 PM"
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-PH', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format a date only (no time) in Asia/Manila timezone.
 * Returns: "Oct 6, 2026"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-PH', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format time only in Asia/Manila timezone.
 * Returns: "10:30 PM"
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-PH', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago").
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(d)
}

/**
 * Get the start of today in Asia/Manila as a UTC Date.
 */
export function startOfTodayManila(): Date {
  const now = new Date()
  const manilaStr = now.toLocaleDateString('en-CA', { timeZone: TIMEZONE })
  return new Date(manilaStr + 'T00:00:00+08:00')
}

/**
 * Format an ISO date for use in date inputs (YYYY-MM-DD).
 */
export function toDateInputValue(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-CA', { timeZone: TIMEZONE })
}

/**
 * Format an ISO datetime for use in datetime-local inputs.
 */
export function toDateTimeInputValue(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}
