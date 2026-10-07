'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from 'cn'

const STEPS = ['Received', 'Washing', 'Drying', 'Folding', 'Ready'] as const

/**
 * Elegant customer tracking preview. Selecting a stage shows what the
 * customer would see — quiet state changes, no decoration.
 */
export function TrackingVisual({ defaultIndex = 3 }: { defaultIndex?: number }) {
  const [index, setIndex] = useState(defaultIndex)

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0B0D0E]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500">Public tracking</p>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 font-mono text-[12px] text-zinc-200 transition-colors hover:bg-white/[0.06]"
          aria-label="Copy tracking code"
        >
          LF1042-X7Q2
          <Copy className="h-3 w-3 text-zinc-500" aria-hidden="true" />
        </button>
      </div>

      <div className="px-6 py-6 text-center sm:px-8">
        <p className="text-[13px] text-zinc-500">Order LF-1042</p>
        <p className="mt-1 text-[28px] font-semibold tracking-tight text-white" role="status">
          {STEPS[index]}
        </p>
        <p className="mt-1 text-[13px] text-zinc-500">
          {index < 4 ? `Step ${index + 1} of 5 · estimated ready Friday` : 'On the shelf · ready for pickup'}
        </p>

        <ol className="mx-auto mt-6 max-w-[280px] space-y-0 text-left" aria-label="Tracking progress">
          {STEPS.map((s, i) => {
            const done = i < index
            const current = i === index
            return (
              <li key={s} className="relative flex gap-3 pb-5 last:pb-0">
                {i < STEPS.length - 1 && (
                  <span
                    className={cn('absolute left-[11px] top-6 h-[calc(100%-20px)] w-px', done || current ? 'bg-emerald-400/30' : 'bg-white/[0.08]')}
                    aria-hidden="true"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-pressed={current}
                  aria-label={`Preview stage ${s}`}
                  className={cn(
                    'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border text-[10px] transition-colors',
                    done && 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
                    current && 'border-white/50 bg-white/10 font-semibold text-white',
                    !done && !current && 'border-white/10 text-zinc-600'
                  )}
                >
                  {done ? <Check className="h-3 w-3" aria-hidden="true" /> : i + 1}
                </button>
                <span className="flex items-baseline justify-between gap-3 pt-[1px]">
                  <span className={cn('text-[13px]', current ? 'font-medium text-white' : done ? 'text-zinc-300' : 'text-zinc-600')}>
                    {s}
                  </span>
                  {current && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-300/80">current</span>
                  )}
                </span>
              </li>
            )
          })}
        </ol>

        <div className="mx-auto mt-6 grid max-w-[320px] grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.05] text-left">
          <div className="bg-[#0B0D0E] px-3.5 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">Received</p>
            <p className="tnum mt-0.5 text-[13px] text-zinc-200">Mon, 9:41 AM</p>
          </div>
          <div className="bg-[#0B0D0E] px-3.5 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">Est. ready</p>
            <p className="tnum mt-0.5 text-[13px] text-zinc-200">Fri, 4:00 PM</p>
          </div>
        </div>
        <p className="mt-4 text-[12px] text-zinc-600">No account needed — the code is enough.</p>
      </div>
    </div>
  )
}
