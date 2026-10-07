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
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0B0D0E]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500">LF-1042 · Wash & Fold</p>
              <p className="mt-0.5 text-[15px] font-semibold tracking-tight text-white" role="status">
                {stage.label}
              </p>
            </div>
            <span
              key={stage.status}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[12px] font-medium text-zinc-100"
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', stage.dot)} aria-hidden="true" />
              {stage.label}
            </span>
          </div>

          <div className="px-5 py-4">
            <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500">
              <span>
                Stage {active + 1} of {STAGES.length}
              </span>
              <span className="tnum">{Math.round(progress)}%</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.07]" aria-hidden="true">
              <div
                className="h-full rounded-full bg-white/70 transition-all duration-500 ease-out motion-reduce:transition-none"
                style={{ width: `${Math.max(4, progress)}%` }}
              />
            </div>

            <ol className="mt-4 space-y-0.5" aria-hidden="true">
              {STAGES.map((s, i) => {
                const done = i < active
                const current = i === active
                return (
                  <li key={s.status} className="flex items-center gap-3 py-1.5">
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full border text-[11px] transition-colors duration-300 motion-reduce:transition-none',
                        current && 'border-white/40 bg-white/[0.06] font-semibold text-white',
                        done && 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
                        !current && !done && 'border-white/[0.08] text-zinc-600'
                      )}
                    >
                      {done ? <Check className="h-3 w-3" aria-hidden="true" /> : <s.icon className="h-3 w-3" aria-hidden="true" />}
                    </span>
                    <span
                      className={cn(
                        'text-[13px] transition-colors duration-300 motion-reduce:transition-none',
                        current ? 'font-medium text-white' : done ? 'text-zinc-400' : 'text-zinc-600'
                      )}
                    >
                      {s.label}
                    </span>
                    {current && (
                      <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">now</span>
                    )}
                  </li>
                )
              })}
            </ol>
          </div>

          <div className="border-t border-white/[0.06] bg-white/[0.015] px-5 py-3.5">
            <p className="text-[12px] text-zinc-500">
              Customer sees: <span className="font-medium text-zinc-200">{stage.customer}</span>
            </p>
          </div>
        </div>
      </div>

      {/* narrative */}
      <ol className="space-y-3">
        {STAGES.map((s, i) => (
          <li key={s.status}>
            <article
              ref={el => {
                refs.current[i] = el
              }}
              data-index={i}
              aria-current={i === active ? 'true' : undefined}
              className={cn(
                'rounded-xl border p-6 transition-all duration-500 ease-out motion-reduce:transition-none sm:p-7',
                i === active
                  ? 'border-white/[0.14] bg-white/[0.03]'
                  : i < active
                    ? 'border-white/[0.06] bg-transparent opacity-60'
                    : 'border-white/[0.06] bg-transparent opacity-45'
              )}
            >
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg border transition-colors duration-500 motion-reduce:transition-none',
                    i === active ? 'border-white/15 bg-white/[0.05] text-white' : 'border-white/[0.07] bg-white/[0.02] text-zinc-500'
                  )}
                >
                  <s.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-600">
                    Stage {i + 1} — {s.status}
                  </p>
                  <h3
                    className={cn(
                      'mt-0.5 text-[20px] font-semibold tracking-tight transition-colors duration-500 motion-reduce:transition-none',
                      i === active ? 'text-white' : 'text-zinc-400'
                    )}
                  >
                    {s.label}
                  </h3>
                </div>
              </div>
              <p className={cn('mt-4 text-[14px] leading-relaxed', i === active ? 'text-zinc-300' : 'text-zinc-500')}>{s.staff}</p>
            </article>
          </li>
        ))}
      </ol>
    </div>
  )
}
