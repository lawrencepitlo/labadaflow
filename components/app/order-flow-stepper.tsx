'use client'

import { cn } from 'cn'
import { ORDER_STATUS_FLOW, STATUS_CONFIG, type OrderStatus } from '@/lib/order-machine'
import { Check, X } from 'lucide-react'

interface OrderFlowStepperProps {
  currentStatus: OrderStatus
  className?: string
}

const WORKFLOW_STEPS = ORDER_STATUS_FLOW.filter(s => s !== 'COMPLETED')

const TERMINAL_STATUS_CONFIG: Record<'COMPLETED' | 'CANCELLED', { bg: string; text: string; border: string }> = {
  COMPLETED: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20 dark:border-emerald-500/20',
  },
  CANCELLED: {
    bg: 'bg-red-500/10 dark:bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/20 dark:border-red-500/20',
  },
}

export function OrderFlowStepper({ currentStatus, className }: OrderFlowStepperProps) {
  const isCancelled = currentStatus === 'CANCELLED'
  const isCompleted = currentStatus === 'COMPLETED'
  const currentIndex = WORKFLOW_STEPS.indexOf(currentStatus as (typeof WORKFLOW_STEPS)[number])

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop horizontal stepper */}
      <div className="hidden md:flex items-center justify-between" role="list" aria-label="Order progress">
        {WORKFLOW_STEPS.map((status, index) => {
          const config = STATUS_CONFIG[status]
          const isActive = status === currentStatus
          const isPast = isCompleted || (!isCancelled && currentIndex > index)
          const isFuture = !isCancelled && !isCompleted && currentIndex < index

          return (
            <div key={status} className="flex items-center flex-1 last:flex-none" role="listitem">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300',
                    isActive && !isCancelled && 'border-primary bg-primary/10 text-primary scale-110 shadow-sm',
                    isPast && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                    isFuture && 'border-border bg-background text-muted-foreground/50',
                    isCancelled && 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isPast ? (
                    <Check className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center',
                    isActive && !isCancelled && 'text-foreground font-semibold',
                    isPast && 'text-emerald-600 dark:text-emerald-400',
                    isFuture && 'text-muted-foreground/50',
                    isCancelled && 'text-red-600 dark:text-red-400'
                  )}
                >
                  {config.label}
                </span>
              </div>
              {index < WORKFLOW_STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 mt-[-1.25rem] transition-all duration-300',
                    isPast ? 'bg-emerald-500/30' : 'bg-border',
                    isCancelled && 'bg-red-500/30'
                  )}
                  aria-hidden="true"
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile vertical stepper */}
      <div className="md:hidden space-y-3" role="list" aria-label="Order progress">
        {WORKFLOW_STEPS.map((status, index) => {
          const config = STATUS_CONFIG[status]
          const isActive = status === currentStatus
          const isPast = isCompleted || (!isCancelled && currentIndex > index)

          return (
            <div key={status} className="flex items-center gap-3" role="listitem">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0',
                  isActive && !isCancelled && 'border-primary bg-primary/10 text-primary',
                  isPast && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                  !isActive && !isPast && 'border-border text-muted-foreground/50',
                  isCancelled && 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {isPast ? (
                  <Check className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-sm',
                  isActive && !isCancelled && 'font-semibold text-foreground',
                  isPast && 'text-emerald-600 dark:text-emerald-400',
                  !isActive && !isPast && 'text-muted-foreground/50'
                )}
              >
                {config.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Terminal status indicators */}
      {isCompleted && (
        <div className="mt-4 p-3 rounded-lg border flex items-center gap-2" style={{ ...TERMINAL_STATUS_CONFIG.COMPLETED }} role="status">
          <Check className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span className="font-semibold">Order Completed & Paid</span>
        </div>
      )}
      {isCancelled && (
        <div className="mt-4 p-3 rounded-lg border flex items-center gap-2" style={{ ...TERMINAL_STATUS_CONFIG.CANCELLED }} role="status">
          <X className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span className="font-semibold">Order Cancelled</span>
        </div>
      )}
    </div>
  )
}
