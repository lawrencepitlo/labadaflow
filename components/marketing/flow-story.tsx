'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Package,
  WashingMachine,
  Wind,
  FoldVertical,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react'
import { STATUS_CONFIG, type OrderStatus } from '@/lib/order-machine'
import { cn } from 'cn'

const STAGES: { status: OrderStatus; icon: React.ElementType; staff: string }[] = [
  { status: 'RECEIVED', icon: Package, staff: 'Staff logs services, weight, and due date. A tracking code is issued.' },
  { status: 'WASHING', icon: WashingMachine, staff: 'The load enters the wash cycle. The move is timestamped.' },
  { status: 'DRYING', icon: Wind, staff: 'Transferred to dryers. History records who moved it.' },
  { status: 'FOLDING', icon: FoldVertical, staff: 'Folded and packed. Backward moves need a note.' },
  { status: 'READY', icon: ShoppingBag, staff: 'On the shelf awaiting pickup. Visible to the customer.' },
  { status: 'COMPLETED', icon: CheckCircle2, staff: 'Picked up. The flow closes with a complete record.' },
]

/**
 * Scroll-driven telling of the six-stage lifecycle. A sticky rail shows
 * progress; every stage's text is fully readable with animation disabled
 * or before any intersection fires.
 */
export function FlowStory() {
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.index)
            if (!Number.isNaN(i)) setActive(i)
          }
        }
      },
      { rootMargin: '-40% 0px -45% 0px', threshold: 0 }
    )
    refs.current.forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      {/* sticky progress rail */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border bg-card p-5 sm:p-6" aria-hidden="true">
          <ol className="relative space-y-0">
            <span className="absolute bottom-5 left-[19px] top-5 w-0.5 rounded bg-border" />
            <span
              className="absolute left-[19px] top-5 w-0.5 rounded bg-primary transition-[height] duration-500 motion-reduce:transition-none"
              style={{ height: `calc(${(active / (STAGES.length - 1)) * 100}% * 0.92)` }}
            />
            {STAGES.map((s, i) => {
              const done = i < active
              const current = i === active
              return (
                <li key={s.status} className="relative flex items-center gap-3 py-2.5">
                  <span
                    className={cn(
                      'z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-card transition-colors motion-reduce:transition-none',
                      current && 'border-primary text-primary',
                      done && 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400',
                      !current && !done && 'border-border text-muted-foreground/50'
                    )}
                  >
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span
                    className={cn(
                      'text-sm',
                      current ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'
                    )}
                  >
                    {STATUS_CONFIG[s.status].label}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      </div>

      {/* stage narrative */}
      <div>
        <ol className="space-y-4 lg:space-y-6">
          {STAGES.map((s, i) => (
            <li key={s.status}>
              <article
                ref={el => {
                  refs.current[i] = el
                }}
                data-index={i}
                aria-current={i === active ? 'true' : undefined}
                className={cn(
                  'rounded-2xl border p-6 transition-colors motion-reduce:transition-none sm:p-8',
                  i === active
                    ? 'border-primary/30 bg-card shadow-lg shadow-primary/5'
                    : 'bg-card/50'
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <s.icon className="h-6 w-6 text-foreground" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">Stage {i + 1} of 6</p>
                    <h3 className="text-xl font-bold tracking-tight sm:text-2xl">
                      {STATUS_CONFIG[s.status].label}
                    </h3>
                  </div>
                </div>
                <p className="mt-4 leading-relaxed text-muted-foreground">{s.staff}</p>
                <p className="mt-2 text-sm font-medium">{STATUS_CONFIG[s.status].description}.</p>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
