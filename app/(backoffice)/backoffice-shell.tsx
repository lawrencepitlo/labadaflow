'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from 'cn'
import { UserButton } from '@clerk/nextjs'
import type { Actor } from '@/lib/auth'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Wrench,
  UsersRound,
  BarChart3,
  Settings,
  Menu,
  X,
  Droplets,
  Search,
  Plus,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { useEffect, useState } from 'react'
import { ThemeToggle } from '@/components/app/theme-toggle'
import { CommandPalette } from '@/components/app/command-palette'

const NAV_SECTIONS = [
  {
    label: 'Workspace',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'STAFF'] },
      { href: '/orders', label: 'Orders', icon: ClipboardList, roles: ['ADMIN', 'STAFF'] },
      { href: '/customers', label: 'Customers', icon: Users, roles: ['ADMIN', 'STAFF'] },
    ],
  },
  {
    label: 'Manage',
    items: [
      { href: '/services', label: 'Services', icon: Wrench, roles: ['ADMIN'] },
      { href: '/team', label: 'Team', icon: UsersRound, roles: ['ADMIN'] },
      { href: '/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN', 'STAFF'] },
      { href: '/settings', label: 'Settings', icon: Settings, roles: ['ADMIN'] },
    ],
  },
] as const

function sectionLabel(pathname: string): string {
  if (pathname.startsWith('/orders/new')) return 'New order'
  if (pathname.startsWith('/orders/')) return 'Order'
  if (pathname.startsWith('/customers/')) return 'Customer'
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(item.href + '/')) return item.label
    }
  }
  return 'LabadaFlow'
}

interface BackofficeShellProps {
  actor: Actor
  children: React.ReactNode
}

export function BackofficeShell({ actor, children }: BackofficeShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(open => !open)
      }
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Close the mobile drawer on navigation
  const closeMobile = () => setMobileOpen(false)

  const sections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item => (item.roles as readonly string[]).includes(actor.role)),
  })).filter(section => section.items.length > 0)

  const current = sectionLabel(pathname)

  function navList() {
    return (
      <div className="flex flex-col gap-4">
        {sections.map(section => (
          <div key={section.label}>
            <p className="px-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground">
              {section.label}
            </p>
            <ul className="flex flex-col gap-px">
              {section.items.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={closeMobile}
                      className={cn(
                        'flex h-7 items-center gap-2 rounded-md px-2 text-[13px] transition-colors duration-100 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 motion-reduce:transition-none',
                        isActive
                          ? 'bg-accent font-medium text-foreground'
                          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                      )}
                    >
                      <item.icon
                        className={cn('h-4 w-4 shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground/70')}
                        aria-hidden="true"
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {isActive && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" aria-hidden="true" />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-[240px] shrink-0 flex-col border-r bg-sidebar lg:flex">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
            <Droplets className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13px] font-semibold">LabadaFlow</span>
            <span className="block truncate text-[11px] text-muted-foreground">Laundry operations</span>
          </span>
        </div>

        <div className="px-2 pt-2">
          <Button render={<Link href="/orders/new" />} className="w-full justify-start">
            <Plus aria-hidden="true" />
            New order
          </Button>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="mt-1 flex h-7 w-full items-center gap-2 rounded-md px-2 text-[13px] text-muted-foreground transition-colors duration-100 outline-none hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 motion-reduce:transition-none"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="flex-1 text-left">Search</span>
            <Kbd>⌘K</Kbd>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Main navigation">
          {navList()}
        </nav>

        <div className="shrink-0 border-t p-2">
          <div className="flex items-center gap-2 rounded-md px-1 py-1">
            <UserButton
              appearance={{ elements: { avatarBox: 'h-6 w-6' } }}
            />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-medium">{actor.full_name}</p>
              <p className="truncate text-[11px] capitalize text-muted-foreground">{actor.role.toLowerCase()}</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-12 shrink-0 items-center gap-1 border-b bg-background/80 px-2 backdrop-blur lg:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileOpen(open => !open)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
            <Droplets className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="text-[13px] font-semibold">LabadaFlow</span>
          <span className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => setPaletteOpen(true)} aria-label="Search">
              <Search aria-hidden="true" />
            </Button>
            <ThemeToggle />
            <UserButton appearance={{ elements: { avatarBox: 'h-6 w-6' } }} />
          </span>
        </header>

        {/* Desktop context bar */}
        <header className="hidden h-11 shrink-0 items-center gap-2 border-b bg-background/80 px-6 backdrop-blur lg:flex">
          <nav className="flex min-w-0 items-center gap-1.5 text-[13px]" aria-label="Breadcrumb">
            <span className="shrink-0 text-muted-foreground">LabadaFlow</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
            <span className="truncate font-medium">{current}</span>
          </nav>
          <span className="ml-auto">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="flex h-7 w-52 items-center gap-2 rounded-md border bg-muted/40 px-2 text-xs text-muted-foreground transition-colors duration-100 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 motion-reduce:transition-none"
            >
              <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="flex-1 truncate text-left">Search or jump to…</span>
              <Kbd>⌘K</Kbd>
            </button>
          </span>
        </header>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute inset-y-0 left-0 flex w-[280px] flex-col border-r bg-sidebar shadow-xl">
              <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
                  <Droplets className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[13px] font-semibold">LabadaFlow</span>
                  <span className="block truncate text-[11px] text-muted-foreground">Laundry operations</span>
                </span>
                <Button variant="ghost" size="icon-sm" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <X aria-hidden="true" />
                </Button>
              </div>
              <div className="px-2 pt-2">
                <Button render={<Link href="/orders/new" />} className="w-full justify-start">
                  <Plus aria-hidden="true" />
                  New order
                </Button>
              </div>
              <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Mobile navigation">
                {navList()}
              </nav>
              <div className="shrink-0 border-t p-2">
                <div className="flex items-center gap-2 rounded-md px-1 py-1">
                  <UserButton appearance={{ elements: { avatarBox: 'h-6 w-6' } }} />
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-[13px] font-medium">{actor.full_name}</p>
                    <p className="truncate text-[11px] capitalize text-muted-foreground">{actor.role.toLowerCase()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1040px] px-4 py-5 sm:px-6 sm:py-6">
            {children}
          </div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} role={actor.role} />
    </div>
  )
}
