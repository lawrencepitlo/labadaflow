'use client'

import { cn } from '@/lib/utils'
import { ORDER_STATUS_FLOW, STATUS_CONFIG, type OrderStatus } from '@/lib/order-machine'
import { Check, Waves, Wind, Sparkles, ShoppingBag, PackageCheck } from 'lucide-react'

interface OrderFlowStepperProps {
  currentStatus: OrderStatus
  className?: string
}

const WORKFLOW_STEPS = ORDER_STATUS_FLOW.filter(s => s !== 'COMPLETED')

const STEP_ICONS = {
  RECEIVED: PackageCheck,
  WASHING: Waves,
  DRYING: Wind,
  FOLDING: Sparkles,
  READY: ShoppingBag,
}

export function OrderFlowStepper({ currentStatus, className }: OrderFlowStepperProps) {
  const isCancelled = currentStatus === 'CANCELLED'
  const isCompleted = currentStatus === 'COMPLETED'
  const currentIndex = WORKFLOW_STEPS.indexOf(currentStatus as (typeof WORKFLOW_STEPS)[number])

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop horizontal stepper */}
      <div className="hidden items-center md:flex" role="list" aria-label="Order progress">
        {WORKFLOW_STEPS.map((status, index) => {
          const isActive = status === currentStatus
          const isPast = isCompleted || (!isCancelled && currentIndex > index)
          const Icon = STEP_ICONS[status as keyof typeof STEP_ICONS] || PackageCheck

          return (
            <div key={status} className="flex flex-1 items-center last:flex-none" role="listitem">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all',
                    isCancelled && 'bg-rose-500/20 text-rose-600',
                    !isCancelled && isPast && 'bg-emerald-500 text-white shadow-xs',
                    !isCancelled && isActive && 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-xs',
                    !isCancelled && !isPast && !isActive && 'border border-border bg-muted/60 text-muted-foreground/60'
                  )}
                  aria-hidden="true"
                >
                  {isPast ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <span
                  className={cn(
                    'text-center text-xs whitespace-nowrap',
                    isActive && !isCancelled && 'font-bold text-foreground',
                    isPast && !isActive && 'font-medium text-foreground',
                    !isPast && !isActive && 'text-muted-foreground',
                    isCancelled && 'text-muted-foreground/60'
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {STATUS_CONFIG[status].label}
                </span>
              </div>
              {index < WORKFLOW_STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-2 -mt-5 h-1 min-w-6 flex-1 rounded-full transition-all',
                    isPast ? 'bg-emerald-500/70' : 'bg-muted'
                  )}
                  aria-hidden="true"
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile vertical stepper */}
      <div className="space-y-3 md:hidden" role="list" aria-label="Order progress">
        {WORKFLOW_STEPS.map((status, index) => {
          const isActive = status === currentStatus
          const isPast = isCompleted || (!isCancelled && currentIndex > index)
          const Icon = STEP_ICONS[status as keyof typeof STEP_ICONS] || PackageCheck

          return (
            <div key={status} className="flex items-center gap-3" role="listitem">
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  isCancelled && 'bg-rose-500/20 text-rose-600',
                  !isCancelled && isPast && 'bg-emerald-500 text-white',
                  !isCancelled && isActive && 'bg-primary text-primary-foreground ring-3 ring-primary/20',
                  !isCancelled && !isPast && !isActive && 'border border-border bg-muted text-muted-foreground/60'
                )}
                aria-hidden="true"
              >
                {isPast ? <Check className="h-3 w-3 stroke-[2.5]" /> : <Icon className="h-3 w-3" />}
              </div>
              <span
                className={cn(
                  'text-xs',
                  isActive && !isCancelled ? 'font-bold text-foreground' : isPast ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {STATUS_CONFIG[status].label}
              </span>
              {isActive && !isCancelled && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  Active Now
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
