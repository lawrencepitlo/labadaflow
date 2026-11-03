'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Droplets, Menu, X, Search } from 'lucide-react'
import { ThemeToggle } from '@/components/app/theme-toggle'
import { cn } from '@/lib/utils'

const LINKS = [
  { label: 'Walk-in Intake', href: '#features' },
  { label: 'Live Stages', href: '#workflow' },
  { label: 'Customer Tracking', href: '/track' },
]

export function SiteNav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 12))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-200',
        scrolled || open
          ? 'border-b border-slate-200/80 bg-white/85 shadow-xs backdrop-blur-md dark:border-border/80 dark:bg-background/85'
          : 'border-b border-transparent bg-transparent'
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-105" aria-label="LabadaFlow home">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Droplets className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-bold tracking-tight text-foreground">LabadaFlow</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/track"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-2xs transition-colors hover:bg-muted/70"
          >
            <Search className="h-3.5 w-3.5 text-primary" />
            Track an Order
          </Link>
          <Link
            href="/sign-in"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
          >
            Launch Shop
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground hover:bg-muted"
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/80 bg-background/95 px-5 pb-5 pt-3 shadow-lg backdrop-blur-xl md:hidden">
          <nav className="flex flex-col space-y-1" aria-label="Primary mobile">
            {LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4">
            <Link
              href="/track"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border text-xs font-semibold text-foreground"
            >
              <Search className="h-3.5 w-3.5 text-primary" />
              Track with Slip Code
            </Link>
            <div className="flex gap-2">
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-border text-xs font-semibold text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-primary text-xs font-semibold text-primary-foreground"
              >
                Launch Shop
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
