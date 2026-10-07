'use client'

import { useRouter } from 'next/navigation'
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Plus,
  Settings,
  Users,
  UsersRound,
  Wrench,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: string
}

const ROUTES = [
  { href: '/dashboard', label: 'Go to Dashboard', keywords: 'home overview today', icon: LayoutDashboard, roles: ['ADMIN', 'STAFF'] },
  { href: '/orders', label: 'Go to Orders', keywords: 'list pipeline workflow stages', icon: ClipboardList, roles: ['ADMIN', 'STAFF'] },
  { href: '/customers', label: 'Go to Customers', keywords: 'clients accounts', icon: Users, roles: ['ADMIN', 'STAFF'] },
  { href: '/reports', label: 'Go to Reports', keywords: 'revenue analytics', icon: BarChart3, roles: ['ADMIN', 'STAFF'] },
  { href: '/services', label: 'Go to Services', keywords: 'price list catalog', icon: Wrench, roles: ['ADMIN'] },
  { href: '/team', label: 'Go to Team', keywords: 'staff members roles', icon: UsersRound, roles: ['ADMIN'] },
  { href: '/settings', label: 'Go to Settings', keywords: 'preferences shop config', icon: Settings, roles: ['ADMIN'] },
] as const

export function CommandPalette({ open, onOpenChange, role }: CommandPaletteProps) {
  const router = useRouter()

  function go(href: string) {
    onOpenChange(false)
    router.push(href)
  }

  const routes = ROUTES.filter(r => (r.roles as readonly string[]).includes(role))

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Jump to…"
      description="Navigate LabadaFlow without touching the mouse."
    >
      <CommandInput placeholder="Jump to orders, customers, reports…" />
      <CommandList>
        <CommandEmpty>No matching pages.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem value="new order create intake" onSelect={() => go('/orders/new')}>
            <Plus aria-hidden="true" />
            New order
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Go to">
          {routes.map(route => (
            <CommandItem
              key={route.href}
              value={`${route.label} ${route.keywords}`}
              onSelect={() => go(route.href)}
            >
              <route.icon aria-hidden="true" />
              {route.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
