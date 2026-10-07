'use client'

import { useEffect, useRef } from 'react'
import { Plus, Search } from 'lucide-react'
import { cn } from 'cn'

const STATS = [
  { label: 'Active orders', value: '24', sub: 'Across all stages' },
  { label: 'Ready for pickup', value: '6', sub: 'Notify to collect', dot: 'bg-emerald-400' },
  { label: "Today's revenue", value: '₱8,420', sub: 'Completed today' },
  { label: 'Customers', value: '312', sub: 'Registered accounts' },
]

const PIPELINE = [
  { label: 'Received', count: 5, dot: 'bg-sky-400', fill: '18%', bar: 'bg-white/40' },
  { label: 'Washing', count: 4, dot: 'bg-cyan-400', fill: '14%', bar: 'bg-white/40' },
  { label: 'Drying', count: 6, dot: 'bg-amber-400', fill: '22%', bar: 'bg-white/40' },
  { label: 'Folding', count: 3, dot: 'bg-violet-400', fill: '11%', bar: 'bg-white/40' },
  { label: 'Ready', count: 6, dot: 'bg-emerald-400', fill: '64%', bar: 'bg-emerald-400/80' },
  { label: 'Completed', count: 128, dot: 'bg-zinc-500', fill: '100%', bar: 'bg-white/25' },
]

const ROWS = [
  { id: 'LF-1042', customer: 'Mara Santos · Wash & Fold 6.5 kg', status: 'Drying', dot: 'bg-amber-400', total: '₱420', time: '12m ago' },
  { id: 'LF-1041', customer: 'Jose Reyes · Wash & Fold 4.0 kg', status: 'Folding', dot: 'bg-violet-400', total: '₱310', time: '38m ago' },
  { id: 'LF-1040', customer: 'Walk-in · Dry Clean 2 pcs', status: 'Ready', dot: 'bg-emerald-400', total: '₱260', time: '1h ago' },
  { id: 'LF-1039', customer: 'Ana Lim · Wash & Fold 8.0 kg', status: 'Washing', dot: 'bg-cyan-400', total: '₱520', time: '2h ago' },
]

/**
 * Hero product visual — the LabadaFlow dashboard emerging from the dark page.
 * Depth comes from layered light (ambient glow, top-edge reflection, one slow
 * perimeter beam, cursor-reactive glare), never from heavy shadows.
 */
export function HeroVisual() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const windowRef = useRef<HTMLDivElement>(null)
  const glareRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = wrapRef.current
        const inner = innerRef.current
        if (!el || !inner) return
        const rect = el.getBoundingClientRect()
        const viewport = window.innerHeight || 800
        // 0 when fully in view at top, approaches 1 as user scrolls past
        const p = Math.min(1, Math.max(0, 1 - (rect.top + rect.height * 0.55) / viewport))
        inner.style.transform = `translateY(${(p * 28).toFixed(1)}px) scale(${(1 - p * 0.015).toFixed(4)})`
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  // Cursor-reactive glare — fine pointers only, never on touch.
  useEffect(() => {
    const win = windowRef.current
    const glare = glareRef.current
    if (!win || !glare) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const rect = win.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        win.style.setProperty('--mx', `${x.toFixed(1)}%`)
        win.style.setProperty('--my', `${y.toFixed(1)}%`)
      })
    }
    const onEnter = () => {
      glare.style.opacity = '1'
    }
    const onLeave = () => {
      glare.style.opacity = '0'
    }
    win.addEventListener('pointermove', onMove)
    win.addEventListener('pointerenter', onEnter)
    win.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      win.removeEventListener('pointermove', onMove)
      win.removeEventListener('pointerenter', onEnter)
      win.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <div ref={wrapRef} className="landing-perspective relative">
      {/* ambient lighting behind the window */}
      <div className="pointer-events-none absolute -inset-x-8 -top-10 bottom-[-40px]" aria-hidden="true">
        <div className="absolute left-1/2 top-[-40px] h-[300px] w-[640px] -translate-x-1/2 rounded-full bg-white/[0.05] blur-[130px]" />
        <div className="absolute left-1/2 top-10 h-[380px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-500/[0.05] blur-[130px]" />
        <div className="absolute left-[10%] top-32 h-[240px] w-[340px] rounded-full bg-sky-500/[0.045] blur-[110px]" />
        <div className="absolute right-[8%] top-36 h-[220px] w-[320px] rounded-full bg-teal-400/[0.04] blur-[110px]" />
      </div>
      {/* vignette — light guides the eye toward the product */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#060708] to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#060708] to-transparent"
        aria-hidden="true"
      />

      <div className="landing-tilt relative">
        <div ref={innerRef} className="relative will-change-transform">
          {/* top-edge reflection */}
          <div
            className="pointer-events-none absolute -top-px left-[15%] right-[15%] z-10 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
            aria-hidden="true"
          />
          <div
            ref={windowRef}
            className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0B0D0E]/95 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.9),0_0_80px_-40px_rgba(52,211,153,0.12)] backdrop-blur"
          >
            {/* window chrome */}
            <div className="flex h-11 items-center gap-3 border-b border-white/[0.06] px-4" aria-hidden="true">
              <span className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              </span>
              <span className="mx-auto hidden rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-1 font-mono text-[11px] text-zinc-500 sm:block">
                labadaflow · dashboard
              </span>
              <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-zinc-500 sm:ml-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live
              </span>
            </div>

            {/* app bar */}
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
              <div className="flex h-8 flex-1 items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 text-[13px] text-zinc-600">
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="truncate">Search orders, customers…</span>
                <span className="ml-auto hidden rounded border border-white/10 px-1 font-mono text-[10px] text-zinc-600 sm:block">⌘K</span>
              </div>
              <span className="hidden items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-[12px] font-medium text-black sm:inline-flex">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                New order
              </span>
            </div>

            {/* stats */}
            <div className="grid grid-cols-2 divide-white/[0.06] max-sm:divide-y sm:grid-cols-4 sm:divide-x">
              {STATS.map(s => (
                <div key={s.label} className="px-4 py-3.5 sm:px-5">
                  <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                    {s.dot && <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} aria-hidden="true" />}
                    {s.label}
                  </p>
                  <p className="tnum mt-1 text-[20px] font-semibold tracking-tight text-white">{s.value}</p>
                  <p className="mt-0.5 truncate text-[12px] text-zinc-500">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* pipeline */}
            <div className="border-t border-white/[0.06] px-4 py-4 sm:px-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">Order pipeline</p>
                <p className="tnum font-mono text-[11px] text-zinc-600">152 total</p>
              </div>
              <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.04] sm:grid-cols-6">
                {PIPELINE.map(p => (
                  <div key={p.label} className="bg-[#0B0D0E] p-3">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('h-1.5 w-1.5 rounded-full', p.dot)} aria-hidden="true" />
                      <span className="truncate text-[11px] text-zinc-400">{p.label}</span>
                      <span className="tnum ml-auto text-[13px] font-semibold text-white">{p.count}</span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.07]" aria-hidden="true">
                      <div className={cn('h-full rounded-full', p.bar)} style={{ width: p.fill }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* recent orders */}
            <div className="border-t border-white/[0.06]">
              <div className="flex items-center justify-between px-4 py-2.5 sm:px-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">Recent orders</p>
                <p className="text-[12px] text-zinc-500">View all →</p>
              </div>
              <ul className="divide-y divide-white/[0.04]">
                {ROWS.map(r => (
                  <li key={r.id} className="flex items-center gap-3 px-4 py-2.5 sm:gap-4 sm:px-5">
                    <span className="font-mono text-[12px] font-medium text-zinc-200">{r.id}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-zinc-400">{r.customer}</span>
                    <span className="hidden items-center gap-1.5 rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[11px] font-medium text-zinc-200 sm:inline-flex">
                      <span className={cn('h-1.5 w-1.5 rounded-full', r.dot)} aria-hidden="true" />
                      {r.status}
                    </span>
                    <span className="tnum text-[13px] font-medium text-zinc-200">{r.total}</span>
                    <span className="hidden w-16 text-right text-[12px] text-zinc-600 sm:block">{r.time}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* cursor-reactive surface glare */}
            <div ref={glareRef} className="landing-glare" aria-hidden="true" />
            {/* single slow perimeter beam, masked to the border ring */}
            <div className="landing-beam-ring" aria-hidden="true">
              <div className="landing-beam-spin" />
            </div>
          </div>

          {/* bottom fade into page */}
          <div
            className="pointer-events-none absolute inset-x-0 -bottom-px h-24 bg-gradient-to-t from-[#060708] to-transparent"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* floating tracking chip */}
      <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-[#0E1011]/95 py-2 pl-3 pr-4 shadow-xl backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
        <p className="text-[12px] text-zinc-400">
          Customer sees: <span className="font-medium text-white">Drying · LF-1042</span>
        </p>
      </div>
    </div>
  )
}
