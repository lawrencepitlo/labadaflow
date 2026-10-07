'use client'

import { cn } from 'cn'
import { STATUS_CONFIG, type OrderStatus } from '@/lib/order-machine'

/**
 * Single source of truth for the restrained status dot.
 * Color carries meaning (workflow stage) — never decoration.
 */
export const STATUS_DOT_CLASS: Record<OrderStatus, string> = {
  RECEIVED: 'bg-sky-500',
  WASHING: 'bg-cyan-500',
  DRYING: 'bg-amber-500',
  FOLDING: 'bg-violet-500',
  READY: 'bg-green-500',
  COMPLETED: 'bg-emerald-500',
  CANCELLED: 'bg-red-500',
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
    sm: 'h-5 px-1.5 text-[11px] gap-1.5',
    md: 'h-[22px] px-2 text-xs gap-1.5',
    lg: 'h-6 px-2.5 text-xs gap-2',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border bg-muted/40 font-medium whitespace-nowrap text-foreground',
        sizeClasses[size],
        className
      )}
      role="status"
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
