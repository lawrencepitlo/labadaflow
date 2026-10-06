/**
 * Basic system configuration. Read-only environment-driven settings.
 */

export function getShopName(): string {
  return process.env.NEXT_PUBLIC_SHOP_NAME || 'LabadaFlow'
}

export function getDefaultDueWindowDays(): number {
  const raw = process.env.DEFAULT_DUE_WINDOW_DAYS
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3
}

export function getPageSize(): number {
  return 20
}
