'use client'

import { useState } from 'react'
import {
  Check,
  Copy,
  PackageCheck,
  Waves,
  Wind,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STAGES = [
  {
    name: 'Received',
    desc: 'Counter intake & weighed (5.5 kg)',
    icon: PackageCheck,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800',
    details: 'Checked in at front desk. Sorted into wash bin #3.',
  },
  {
    name: 'Washing',
    desc: 'Washer #2 · Cycle 1/2',
    icon: Waves,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-800',
    details: 'Deep wash & rinse cycle running with fresh softener.',
  },
  {
    name: 'Drying',
    desc: 'Tumble Dryer #4',
    icon: Wind,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    details: 'Tumble drying at 60°C fabric-safe temperature.',
  },
  {
    name: 'Folding',
    desc: 'Folding table & packaging',
    icon: Sparkles,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800',
    details: 'Crisp folding, pairing, and packaging in laundry bags.',
  },
  {
    name: 'Ready',
    desc: 'Shelf #B-12 · Awaiting pickup',
    icon: ShoppingBag,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    details: 'Bagged & tagged! Ready for pickup at the counter.',
  },
]

export function TrackingVisual({ defaultIndex = 2 }: { defaultIndex?: number }) {
  const [index, setIndex] = useState(defaultIndex)
  const [copied, setCopied] = useState(false)

  const active = STAGES[index]
  const progressPercent = ((index + 1) / STAGES.length) * 100

  function copyCode() {
    navigator.clipboard.writeText('WASH-9420')
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 dark:border-border dark:bg-card dark:shadow-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-border/70 bg-slate-50/80 px-5 py-3 dark:bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="font-mono text-[11px] font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
            Live Customer Tracking View
          </span>
        </div>
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 py-1 font-mono text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-muted"
          title="Copy demo code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-600">Copied!</span>
            </>
          ) : (
            <>
              <span>WASH-9420</span>
              <Copy className="h-3 w-3 text-muted-foreground" />
            </>
          )}
        </button>
      </div>

      {/* Main Body */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-mono text-xs font-medium text-muted-foreground">Order LF-1042 · Walk-in</span>
            <h3 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {active.name}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {active.details}
            </p>
          </div>
          <div className="rounded-xl border border-border/80 bg-slate-50 px-3 py-2 text-right dark:bg-muted/40">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Estimated Ready</span>
            <p className="font-mono text-xs font-bold text-foreground">Today, 5:30 PM</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 space-y-1.5">
          <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
            <span>Stage {index + 1} of 5</span>
            <span className="font-semibold text-primary">{Math.round(progressPercent)}% completed</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
            <div
              className="h-full rounded-full bg-linear-to-r from-blue-600 to-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Clickable Interactive Steps */}
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Click any stage to simulate live tracking:
          </p>
          <div className="grid grid-cols-5 gap-2">
            {STAGES.map((s, idx) => {
              const Icon = s.icon
              const isSelected = idx === index
              const isPassed = idx < index

              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setIndex(idx)}
                  className={cn(
                    'group flex flex-col items-center rounded-xl border p-2.5 text-center transition-all',
                    isSelected
                      ? cn('shadow-xs ring-2 ring-primary/30', s.bg, s.border)
                      : isPassed
                        ? 'border-emerald-200/70 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-950/20'
                        : 'border-border/60 bg-background hover:bg-muted/40'
                  )}
                >
                  <div
                    className={cn(
                      'mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg',
                      isSelected
                        ? cn(s.color, 'bg-white shadow-2xs dark:bg-card')
                        : isPassed
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isPassed && !isSelected ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[11px] font-semibold leading-tight',
                      isSelected ? 'text-foreground font-bold' : 'text-muted-foreground'
                    )}
                  >
                    {s.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Receipt & Payment Summary Footer */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-slate-50/70 p-3.5 text-xs dark:bg-muted/30">
          <div>
            <span className="font-medium text-foreground">Wash, Dry & Fold · 5.5 kg</span>
            <p className="text-[11px] text-muted-foreground">₱275.00 · Balance to pay at counter</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            <Clock className="h-3 w-3" />
            Updated 12 mins ago
          </span>
        </div>
      </div>
    </div>
  )
}
