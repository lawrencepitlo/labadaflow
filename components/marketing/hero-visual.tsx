'use client'

import { useEffect, useRef, useState } from 'react'
import { ORDER_STATUS_FLOW, STATUS_CONFIG, type OrderStatus } from '@/lib/order-machine'
import { StatusBadge } from '@/components/app/status-badge'
import { OrderFlowStepper } from '@/components/app/order-flow-stepper'
import { cn } from 'cn'

const DEMO_STAGES = ORDER_STATUS_FLOW.filter(s => s !== 'CANCELLED') as OrderStatus[]

const STAGE_NOTE: Record<OrderStatus, string> = {
  RECEIVED: 'Logged at the counter · tracking code issued',
  WASHING: 'Moved forward by staff · recorded in history',
  DRYING: 'Moved forward by staff · recorded in history',
  FOLDING: 'Folded and packed · almost there',
  READY: 'Waiting on the shelf · ready for pickup',
  COMPLETED: 'Picked up · flow complete',
  CANCELLED: 'Cancelled',
}

/**
 * Hero centerpiece: a live-feeling order ticket that walks through the real
 * six-stage workflow using the actual StatusBadge + OrderFlowStepper.
 * Auto-advance pauses for prefers-reduced-motion and on hover/focus.
 */
export function HeroVisual() {
  const [index, setIndex] = useState(1)
  const [paused, setPaused] = useState(false)
  const reduceMotion = useRef(false)

  useEffect(() => {
    reduceMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion.current) setIndex(1)
  }, [])

  useEffect(() => {
    if (paused || reduceMotion.current) return
    const id = window.setInterval(() => {
      setIndex(i => (i + 1) % DEMO_STAGES.length)
    }, 2600)
    return () => window.clearInterval(id)
  }, [paused])

  const status = DEMO_STAGES[index]

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* soft accent wash behind the product */}
      <div
        className="absolute -inset-8 -z-10 rounded-[2rem] bg-[radial-gradient(60%_60%_at_50%_20%,var(--color-muted)_0%,transparent_70%)] dark:bg-[radial-gradient(60%_60%_at_50%_20%,oklch(1_0_0/6%)_0%,transparent_70%)]"
        aria-hidden="true"
      />
      <div className="overflow-hidden rounded-2xl border-2 bg-card shadow-2xl shadow-primary/5">
        {/* browser bar */}
        <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3" aria-hidden="true">
          <span className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-400/80" />
            <span className="h-3 w-3 rounded-full bg-amber-400/80" />
            <span className="h-3 w-3 rounded-full bg-green-400/80" />
          </span>
          <span className="flex flex-1 justify-center">
            <span className="rounded-md border bg-background px-4 py-1 font-mono text-xs text-muted-foreground">
              labadaflow · orders/LF-1042
            </span>
          </span>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Example order · LF-1042
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                Wash &amp; Fold · 6.5 kg
              </p>
              <p className="mt-1 text-sm text-muted-foreground" role="status">
                {STAGE_NOTE[status]}
              </p>
            </div>
            <StatusBadge status={status} size="lg" />
          </div>

          <div className="mt-6">
            <OrderFlowStepper currentStatus={status} />
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t pt-4">
            <p className="font-mono text-xs text-muted-foreground sm:text-sm">
              Track: <span className="font-semibold text-foreground">LF1042-X7Q2</span>
            </p>
            <div className="flex gap-1.5" role="group" aria-label="Preview workflow stage">
              {DEMO_STAGES.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={i === index}
                  aria-label={`Show stage ${STATUS_CONFIG[s].label}`}
                  onClick={() => setIndex(i)}
                  className={cn(
                    'h-2 rounded-full outline-none transition-all motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-ring/40',
                    i === index ? 'w-6 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground/40'
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* floating tracking chip */}
      <div className="absolute -bottom-5 left-4 flex items-center gap-2.5 rounded-xl border bg-card px-4 py-3 shadow-lg sm:left-8">
        <span className={cn('h-2.5 w-2.5 rounded-full', status === 'READY' ? 'bg-green-500' : 'bg-cyan-500')} aria-hidden="true" />
        <p className="text-sm">
          <span className="text-muted-foreground">Customer sees: </span>
          <span className="font-semibold">{STATUS_CONFIG[status].label}</span>
        </p>
      </div>
    </div>
  )
}
