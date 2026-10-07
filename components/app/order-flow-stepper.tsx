'use client'

import { cn } from 'cn'
import { ORDER_STATUS_FLOW, STATUS_CONFIG, type OrderStatus } from '@/lib/order-machine'
import { STATUS_DOT_CLASS } from '@/components/app/status-badge'

interface OrderFlowStepperProps {
  currentStatus: OrderStatus
  className?: string
}

const WORKFLOW_STEPS = ORDER_STATUS_FLOW.filter(s => s !== 'COMPLETED')

export function OrderFlowStepper({ currentStatus, className }: OrderFlowStepperProps) {
  const isCancelled = currentStatus === 'CANCELLED'
  const isCompleted = currentStatus === 'COMPLETED'
  const currentIndex = WORKFLOW_STEPS.indexOf(currentStatus as (typeof WORKFLOW_STEPS)[number])

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop horizontal stepper */}
      <div className="hidden items-start md:flex" role="list" aria-label="Order progress">
        {WORKFLOW_STEPS.map((status, index) => {
          const isActive = status === currentStatus
          const isPast = isCompleted || (!isCancelled && currentIndex > index)

          return (
            <div key={status} className="flex flex-1 items-start last:flex-none" role="listitem">
              <div className="flex min-w-0 flex-col items-center gap-1.5">
                <span
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-full',
                    isCancelled && 'bg-red-500/50',
                    !isCancelled && isPast && (isCompleted ? 'bg-emerald-500' : 'bg-foreground/60'),
                    !isCancelled && isActive && 'bg-foreground ring-4 ring-foreground/10',
                    !isCancelled && !isPast && !isActive && 'bg-muted-foreground/25'
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    'text-center text-[11px] leading-tight whitespace-nowrap',
                    isActive && !isCancelled && 'font-semibold text-foreground',
                    !isActive && 'text-muted-foreground',
                    !isPast && !isActive && 'text-muted-foreground/60',
                    isCancelled && 'text-muted-foreground/60'
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {STATUS_CONFIG[status].label}
                </span>
              </div>
              {index < WORKFLOW_STEPS.length - 1 && (
                <span
                  className={cn(
                    'mx-2 mt-1 h-px min-w-4 flex-1',
                    isPast ? (isCompleted ? 'bg-emerald-500/50' : 'bg-foreground/25') : 'bg-border'
                  )}
                  aria-hidden="true"
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile vertical stepper */}
      <div className="space-y-2.5 md:hidden" role="list" aria-label="Order progress">
        {WORKFLOW_STEPS.map((status, index) => {
          const isActive = status === currentStatus
          const isPast = isCompleted || (!isCancelled && currentIndex > index)

          return (
            <div key={status} className="flex items-center gap-2.5" role="listitem">
              <span
                className={cn(
                  'h-2 w-2 shrink-0 rounded-full',
                  isCancelled && 'bg-red-500/50',
                  !isCancelled && isPast && (isCompleted ? 'bg-emerald-500' : 'bg-foreground/60'),
                  !isCancelled && isActive && 'bg-foreground ring-4 ring-foreground/10',
                  !isCancelled && !isPast && !isActive && 'bg-muted-foreground/25'
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  'text-[13px]',
                  isActive && !isCancelled ? 'font-semibold text-foreground' : 'text-muted-foreground'
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {STATUS_CONFIG[status].label}
              </span>
              {isActive && !isCancelled && (
                <span className="text-[11px] text-muted-foreground">— current</span>
              )}
              <span className="sr-only">Step {index + 1} of {WORKFLOW_STEPS.length}</span>
            </div>
          )
        })}
      </div>

      {/* Terminal status note */}
      {(isCompleted || isCancelled) && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              isCompleted ? STATUS_DOT_CLASS.COMPLETED : STATUS_DOT_CLASS.CANCELLED
            )}
            aria-hidden="true"
          />
          {isCompleted ? 'Completed & paid — no further changes possible.' : 'Cancelled — no further changes possible.'}
        </p>
      )}
    </div>
  )
}
