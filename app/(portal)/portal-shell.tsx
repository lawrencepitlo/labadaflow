'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from 'cn'
import { UserButton } from '@clerk/nextjs'
import { Droplets, ClipboardList, User, QrCode } from 'lucide-react'
import { ThemeToggle } from '@/components/app/theme-toggle'

const NAV = [
  { href: '/portal/orders', label: 'My Orders', icon: ClipboardList },
  { href: '/portal/pass', label: 'Walk-in Pass', icon: QrCode },
  { href: '/portal/profile', label: 'Profile', icon: User },
]

export function PortalShell({
  customerName,
  children,
}: {
  customerName: string
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60 dark:bg-background">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4 sm:px-6">
          <Link href="/portal/orders" className="flex items-center gap-2.5 transition-transform hover:scale-105 mr-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Droplets className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-bold tracking-tight text-foreground">LabadaFlow</span>
          </Link>

          <nav className="flex items-center gap-1" aria-label="Customer portal">
            {NAV.map(item => {
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium outline-none transition-all duration-100 focus-visible:ring-2 focus-visible:ring-ring/40',
                    active
                      ? 'bg-primary/10 font-semibold text-primary'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs font-medium text-muted-foreground md:inline">
              Hi, {customerName}
            </span>
            <ThemeToggle />
            <UserButton appearance={{ elements: { avatarBox: 'h-7 w-7' } }} />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>
    </div>
  )
}
