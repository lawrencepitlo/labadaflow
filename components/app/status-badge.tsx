'use client'

import { cn } from 'cn'
import { STATUS_CONFIG, type OrderStatus } from '@/lib/order-machine'
import {
  Package,
  WashingMachine,
  Wind,
  FoldVertical,
  CheckCircle2,
  XCircle,
  ShoppingBag,
} from 'lucide-react'

const STATUS_ICONS: Record<OrderStatus, React.ElementType> = {
  RECEIVED: Package,
  WASHING: WashingMachine,
  DRYING: Wind,
  FOLDING: FoldVertical,
  READY: ShoppingBag,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
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
  const Icon = STATUS_ICONS[status]

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  }

  const iconSize = {
    sm: 12,
    md: 14,
    lg: 16,
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full whitespace-nowrap',
        config.bgColor,
        config.textColor,
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {showIcon && <Icon size={iconSize[size]} aria-hidden="true" />}
      {config.label}
    </span>
  )
}
