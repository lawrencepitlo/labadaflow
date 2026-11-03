'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Check,
  FoldVertical,
  Package,
  ShoppingBag,
  WashingMachine,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import { cn } from 'cn'

type Stage = {
  status: string
  label: string
  icon: LucideIcon
  staff: string
  customer: string
  dot: string
}

const STAGES: Stage[] = [
  {
    status: 'RECEIVED',
    label: 'Received',
    icon: Package,
    staff: 'Logged at the counter with services and weight. A tracking code is issued.',
    customer: 'Order confirmed.',
    dot: 'bg-sky-400',
  },
  {
    status: 'WASHING',
    label: 'Washing',
    icon: WashingMachine,
    staff: 'The load enters the wash cycle. The move is timestamped.',
    customer: 'Being washed.',
    dot: 'bg-cyan-400',
  },
  {
    status: 'DRYING',
    label: 'Drying',
    icon: Wind,
    staff: 'Transferred to dryers. History records who moved it.',
    customer: 'Being dried.',
    dot: 'bg-amber-400',
  },
  {
    status: 'FOLDING',
    label: 'Folding',
    icon: FoldVertical,
    staff: 'Folded and packed. Backward moves need a note.',
    customer: 'Almost ready.',
    dot: 'bg-violet-400',
  },
  {
    status: 'READY',
    label: 'Ready',
    icon: ShoppingBag,
    staff: 'On the shelf awaiting pickup. Visible to the customer.',
    customer: 'Ready for pickup.',
    dot: 'bg-emerald-400',
  },
  {
    status: 'COMPLETED',
    label: 'Completed',
    icon: Check,
    staff: 'Picked up and closed. The record stays for reports.',
    customer: 'Picked up.',
    dot: 'bg-zinc-300',
  },
]

/**
 * Scroll-driven telling of the six-stage lifecycle. The sticky ticket on the
 * left transforms as each stage on the right becomes active.
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
      { rootMargin: '-42% 0px -42% 0px', threshold: 0 }
    )
    refs.current.forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const stage = STAGES[active]
  const progress = (active / (STAGES.length - 1)) * 100

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      {/* sticky ticket */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-card shadow-sm dark:border-border">
          <div className="flex items-center justify-between border-b border-border/70 bg-slate-50/80 px-5 py-3.5 dark:bg-muted/40">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">LF-1042 · Walk-in Intake</p>
              <p className="mt-0.5 text-[15px] font-bold tracking-tight text-foreground" role="status">
                {stage.label}
              </p>
            </div>
            <span
              key={stage.status}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 py-1 text-xs font-semibold text-foreground shadow-2xs"
            >
              <span className={cn('h-2 w-2 rounded-full', stage.dot)} aria-hidden="true" />
              {stage.label}
            </span>
          </div>

          <div className="px-5 py-4">
            <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
              <span>
                Stage {active + 1} of {STAGES.length}
              </span>
              <span className="font-bold text-primary">{Math.round(progress)}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-muted" aria-hidden="true">
              <div
                className="h-full rounded-full bg-linear-to-r from-blue-600 to-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${Math.max(4, progress)}%` }}
              />
            </div>

            <ol className="mt-4 space-y-1" aria-hidden="true">
              {STAGES.map((s, i) => {
                const done = i < active
                const current = i === active
                return (
                  <li key={s.status} className="flex items-center gap-3 py-1.5">
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full border text-[11px] transition-colors',
                        current && 'border-primary bg-primary/10 font-bold text-primary',
                        done && 'border-emerald-500/40 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
                        !current && !done && 'border-border text-muted-foreground/60'
                      )}
                    >
                      {done ? <Check className="h-3 w-3" aria-hidden="true" /> : <s.icon className="h-3 w-3" aria-hidden="true" />}
                    </span>
                    <span
                      className={cn(
                        'text-xs transition-colors',
                        current ? 'font-bold text-foreground' : done ? 'font-medium text-muted-foreground' : 'text-muted-foreground/50'
                      )}
                    >
                      {s.label}
                    </span>
                    {current && (
                      <span className="ml-auto font-mono text-[10px] font-bold uppercase tracking-wider text-primary">now</span>
                    )}
                  </li>
                )
              })}
            </ol>
          </div>

          <div className="border-t border-border/70 bg-slate-50/50 px-5 py-3 dark:bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Customer status: <span className="font-semibold text-foreground">{stage.customer}</span>
            </p>
          </div>
        </div>
      </div>

      {/* narrative */}
      <ol className="space-y-3.5">
        {STAGES.map((s, i) => (
          <li key={s.status}>
            <article
              ref={el => {
                refs.current[i] = el
              }}
              data-index={i}
              aria-current={i === active ? 'true' : undefined}
              className={cn(
                'rounded-2xl border p-6 transition-all duration-300 sm:p-7',
                i === active
                  ? 'border-primary/40 bg-card shadow-md shadow-slate-200/40 dark:border-primary/50 dark:bg-card dark:shadow-none'
                  : i < active
                    ? 'border-border/70 bg-card/60 opacity-80'
                    : 'border-border/50 bg-card/30 opacity-60'
              )}
            >
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl border transition-colors',
                    i === active ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-muted/60 text-muted-foreground'
                  )}
                >
                  <s.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Stage {i + 1} — {s.status}
                  </p>
                  <h3
                    className={cn(
                      'mt-0.5 text-lg font-bold tracking-tight',
                      i === active ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {s.label}
                  </h3>
                </div>
              </div>
              <p className={cn('mt-3 text-sm leading-relaxed', i === active ? 'text-foreground' : 'text-muted-foreground')}>
                {s.staff}
              </p>
            </article>
          </li>
        ))}
      </ol>
    </div>
  )
}
