'use client'

import { useEffect, useRef } from 'react'
import { Plus, Search, Waves, Wind, Sparkles, ShoppingBag, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATS = [
  { label: 'Active Loads', value: '18', sub: 'In washers & dryers', dot: 'bg-primary' },
  { label: 'Ready for Pickup', value: '7', sub: 'Waiting at counter', dot: 'bg-emerald-500' },
  { label: "Today's Intake", value: '₱12,450', sub: 'Walk-in revenue' },
  { label: 'Avg Turnaround', value: '2.8 hrs', sub: 'Intake to ready' },
]

const STATIONS = [
  { label: 'Received', count: 4, dot: 'bg-blue-500', bar: 'bg-blue-500' },
  { label: 'Washing', count: 5, dot: 'bg-sky-500', bar: 'bg-sky-500' },
  { label: 'Drying', count: 4, dot: 'bg-amber-500', bar: 'bg-amber-500' },
  { label: 'Folding', count: 2, dot: 'bg-purple-500', bar: 'bg-purple-500' },
  { label: 'Ready', count: 7, dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
]

const RECENT_ORDERS = [
  { id: 'LF-1048', customer: 'Maria Santos · Wash & Fold 6.0 kg', status: 'Washing', color: 'bg-sky-500/10 text-sky-700 dark:text-sky-300', dot: 'bg-sky-500', total: '₱330', time: '8m ago' },
  { id: 'LF-1047', customer: 'Carlo Mendoza · Comforter Heavy', status: 'Drying', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', total: '₱450', time: '22m ago' },
  { id: 'LF-1046', customer: 'Elena Gomez · Dry Clean 2 pcs', status: 'Ready', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', total: '₱280', time: '45m ago' },
  { id: 'LF-1045', customer: 'Joshua Tan · Wash, Dry & Fold 8.5 kg', status: 'Folding', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300', dot: 'bg-purple-500', total: '₱490', time: '1h ago' },
]

export function HeroVisual() {
  const wrapRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={wrapRef} className="relative mx-auto max-w-5xl px-2 sm:px-4">
      {/* Modern Card Frame with subtle 21st century elevation */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-300/40 dark:border-border dark:bg-card dark:shadow-none">
        {/* Workspace App Bar */}
        <div className="flex items-center justify-between border-b border-border/80 bg-slate-50/90 px-4 py-3 dark:bg-muted/40 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
            </div>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border/70 text-xs font-semibold text-foreground">
              <span>Main Branch</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                Shop Live
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 py-1 text-xs text-muted-foreground shadow-2xs">
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search orders or slip code...</span>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ New Walk-in</span>
            </button>
          </div>
        </div>

        {/* Top KPIs Row */}
        <div className="grid grid-cols-2 divide-x divide-y sm:divide-y-0 divide-border/70 border-b border-border/80 bg-white dark:bg-card sm:grid-cols-4">
          {STATS.map(stat => (
            <div key={stat.label} className="p-4 sm:p-5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {stat.value}
                </span>
                {stat.dot && <span className={cn('h-2 w-2 rounded-full', stat.dot)} />}
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Live Stations Progress Row */}
        <div className="border-b border-border/80 bg-slate-50/50 p-4 sm:px-6 dark:bg-muted/20">
          <div className="flex items-center justify-between mb-3 text-xs font-semibold">
            <span className="text-foreground">Live Machine Stations</span>
            <span className="text-muted-foreground font-mono">22 Total In-Progress</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {STATIONS.map(st => (
              <div key={st.label} className="rounded-xl border border-border/80 bg-card p-2.5 text-center shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground">
                  <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
                  <span className="truncate">{st.label}</span>
                </div>
                <p className="mt-1 font-mono text-base font-bold text-foreground">{st.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Orders Table Preview */}
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Recent Counter Walk-ins
            </h4>
            <span className="text-[11px] text-primary font-medium">Real-time sync</span>
          </div>

          <div className="divide-y divide-border/60 rounded-xl border border-border/80 overflow-hidden">
            {RECENT_ORDERS.map(row => (
              <div key={row.id} className="flex items-center justify-between p-3 text-xs hover:bg-slate-50/80 dark:hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-foreground">{row.id}</span>
                  <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-xs">
                    {row.customer}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', row.color)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', row.dot)} />
                    {row.status}
                  </span>
                  <span className="font-mono font-semibold text-foreground hidden sm:inline">{row.total}</span>
                  <span className="text-muted-foreground text-[11px] hidden sm:inline">{row.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
