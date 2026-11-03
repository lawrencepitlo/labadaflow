'use client'

import { cn } from '@/lib/utils'
import { STATUS_CONFIG, type OrderStatus } from '@/lib/order-machine'

export const STATUS_DOT_CLASS: Record<OrderStatus, string> = {
  RECEIVED: 'bg-blue-500',
  WASHING: 'bg-sky-500',
  DRYING: 'bg-amber-500',
  FOLDING: 'bg-purple-500',
  READY: 'bg-emerald-500',
  COMPLETED: 'bg-slate-500',
  CANCELLED: 'bg-rose-500',
}

const STATUS_PILL_STYLES: Record<OrderStatus, string> = {
  RECEIVED: 'bg-blue-50/80 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
  WASHING: 'bg-sky-50/80 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
  DRYING: 'bg-amber-50/80 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
  FOLDING: 'bg-purple-50/80 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
  READY: 'bg-emerald-50/90 text-emerald-700 border-emerald-200/90 font-semibold dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/70',
  COMPLETED: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-muted dark:text-slate-300 dark:border-border',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
}

interface StatusBadgeProps {
  status: OrderStatus
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export function StatusBadge({
  status,
  size = 'md',
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  const sizeClasses = {
    sm: 'h-5 px-2 text-[11px] gap-1.5 rounded-full',
    md: 'h-6 px-2.5 text-xs gap-1.5 rounded-full font-medium',
    lg: 'h-7 px-3 text-xs gap-2 rounded-full font-semibold',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center border shadow-2xs whitespace-nowrap',
        STATUS_PILL_STYLES[status],
        sizeClasses[size],
        className
      )}
      aria-label={`Status: ${config.label}`}
    >
      {showIcon && (
        <span
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_DOT_CLASS[status])}
          aria-hidden="true"
        />
      )}
      {config.label}
    </span>
  )
}
