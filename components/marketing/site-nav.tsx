'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Droplets, Menu, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from 'cn'

const LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'Flow', href: '#flow' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Track order', href: '/track' },
]

export function SiteNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="LabadaFlow home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary transition-transform group-hover:scale-105 motion-reduce:transition-none">
            <Droplets className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
          </span>
          <span className="text-xl font-bold tracking-tight">LabadaFlow</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Marketing">
          {LINKS.map(l => (
            <Button key={l.href} variant="ghost" size="sm" render={<Link href={l.href} />}>
              {l.label}
            </Button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" render={<Link href="/login" />}>
            Sign in
          </Button>
          <Button size="sm" render={<Link href="/login" />}>
            Start managing
            <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            aria-controls="mobile-marketing-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </Button>
        </div>
      </div>

      <div
        id="mobile-marketing-nav"
        className={cn('border-t px-6 py-4 md:hidden', open ? 'block' : 'hidden')}
      >
        <nav className="flex flex-col gap-1" aria-label="Marketing mobile">
          {LINKS.map(l => (
            <Button
              key={l.href}
              variant="ghost"
              className="justify-start"
              render={<Link href={l.href} onClick={() => setOpen(false)} />}
            >
              {l.label}
            </Button>
          ))}
          <div className="mt-3 flex flex-col gap-2">
            <Button variant="outline" render={<Link href="/login" />}>
              Sign in
            </Button>
            <Button render={<Link href="/login" />}>
              Start managing
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
