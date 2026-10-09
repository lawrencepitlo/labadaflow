'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from 'cn'
import { UserButton } from '@clerk/nextjs'
import { Droplets, ClipboardList, User } from 'lucide-react'
import { ThemeToggle } from '@/components/app/theme-toggle'

const NAV = [
  { href: '/portal/orders', label: 'My Orders', icon: ClipboardList },
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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-5xl items-center gap-1 px-4 sm:px-6">
          <Link href="/portal" className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
              <Droplets className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="text-[13px] font-semibold">LabadaFlow</span>
          </Link>
          <nav className="ml-3 flex items-center gap-1" aria-label="Customer portal">
            {NAV.map(item => {
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] outline-none transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-ring/40 motion-reduce:transition-none',
                    active
                      ? 'bg-accent font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <span className="hidden text-[13px] text-muted-foreground md:inline">{customerName}</span>
            <ThemeToggle />
            <UserButton appearance={{ elements: { avatarBox: 'h-6 w-6' } }} />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-6">{children}</div>
      </main>
    </div>
  )
}
