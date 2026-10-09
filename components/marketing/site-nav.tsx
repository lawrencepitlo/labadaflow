'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Droplets, Menu, X } from 'lucide-react'
import { cn } from 'cn'

const LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Tracking', href: '/track' },
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
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled || open
          ? 'border-b border-white/[0.06] bg-[#060708]/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="LabadaFlow home">
          <span className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-white">
            <Droplets className="h-3 w-3 text-black" aria-hidden="true" />
          </span>
          <span className="text-[14px] font-semibold tracking-tight text-white">LabadaFlow</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-[13px] text-zinc-400 transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <Link
            href="/sign-in"
            className="rounded-md px-3 py-1.5 text-[13px] text-zinc-400 transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/sign-in"
            className="ml-1 inline-flex h-8 items-center gap-1.5 rounded-md bg-white px-3.5 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-300 hover:bg-white/5 md:hidden"
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/[0.06] bg-[#060708]/95 px-5 pb-5 pt-3 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col" aria-label="Primary mobile">
            {LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2.5 text-[14px] text-zinc-300 hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex gap-2">
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-white/10 text-[13px] font-medium text-white"
            >
              Sign in
            </Link>
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-white text-[13px] font-medium text-black"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
