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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'STAFF'] },
  { href: '/orders', label: 'Orders', icon: ClipboardList, roles: ['ADMIN', 'STAFF'] },
  { href: '/customers', label: 'Customers', icon: Users, roles: ['ADMIN', 'STAFF'] },
  { href: '/services', label: 'Services', icon: Wrench, roles: ['ADMIN'] },
  { href: '/team', label: 'Team', icon: UsersRound, roles: ['ADMIN'] },
  { href: '/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN', 'STAFF'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['ADMIN'] },
]

interface BackofficeShellProps {
  actor: Actor
  children: React.ReactNode
}

export function BackofficeShell({ actor, children }: BackofficeShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(actor.role))

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r bg-card">
        <div className="flex items-center gap-2.5 px-6 py-5 border-b">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Droplets className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
          </div>
          <span className="font-bold text-lg tracking-tight">LabadaFlow</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Main navigation">
          <ul className="space-y-1">
            {filteredNav.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <UserButton appearance={{
              elements: {
                avatarBox: 'w-9 h-9',
              },
            }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{actor.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{actor.role.toLowerCase()}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="lg:hidden flex items-center justify-between border-b px-4 py-3 bg-card">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Droplets className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="font-bold">LabadaFlow</span>
          </div>
          <UserButton />
        </header>

        {/* Mobile Nav Overlay */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
            <nav
              className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r shadow-lg p-4 pt-16"
              onClick={e => e.stopPropagation()}
              aria-label="Mobile navigation"
            >
              <ul className="space-y-1">
                {filteredNav.map(item => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent'
                        )}
                        onClick={() => setMobileOpen(false)}
                      >
                        <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
