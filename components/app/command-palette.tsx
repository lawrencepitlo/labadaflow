'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  BarChart3,
  ClipboardList,
  Kanban,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  Users,
  UsersRound,
  Wrench,
  Package,
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
  { href: '/board', label: 'Go to Board', keywords: 'kanban workflow columns staff operations active', icon: Kanban, roles: ['ADMIN', 'STAFF'] },
  { href: '/orders', label: 'Go to Orders', keywords: 'list pipeline workflow stages', icon: ClipboardList, roles: ['ADMIN', 'STAFF'] },
  { href: '/customers', label: 'Go to Customers', keywords: 'clients accounts', icon: Users, roles: ['ADMIN', 'STAFF'] },
  { href: '/reports', label: 'Go to Reports', keywords: 'revenue analytics', icon: BarChart3, roles: ['ADMIN', 'STAFF'] },
  { href: '/services', label: 'Go to Services', keywords: 'price list catalog', icon: Wrench, roles: ['ADMIN'] },
  { href: '/team', label: 'Go to Team', keywords: 'staff members roles', icon: UsersRound, roles: ['ADMIN'] },
  { href: '/settings', label: 'Go to Settings', keywords: 'preferences shop config', icon: Settings, roles: ['ADMIN'] },
] as const

export function CommandPalette({ open, onOpenChange, role }: CommandPaletteProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  function go(href: string) {
    onOpenChange(false)
    setSearch('')
    router.push(href)
  }

  const routes = ROUTES.filter(r => (r.roles as readonly string[]).includes(role))
  const trimmed = search.trim()

  return (
    <CommandDialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val)
        if (!val) setSearch('')
      }}
      title="Quick Search"
      description="Search orders, customers, or jump to any section."
    >
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder="Type order #, customer name, or page…"
      />
      <CommandList>
        <CommandEmpty>No direct matches found.</CommandEmpty>

        {trimmed.length > 0 && (
          <CommandGroup heading="Direct Search">
            <CommandItem
              value={`search orders ${trimmed}`}
              onSelect={() => go(`/orders?search=${encodeURIComponent(trimmed)}`)}
            >
              <Search className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              <span>Search orders for <strong className="font-semibold text-foreground">"{trimmed}"</strong></span>
            </CommandItem>
            <CommandItem
              value={`search customers ${trimmed}`}
              onSelect={() => go(`/customers?search=${encodeURIComponent(trimmed)}`)}
            >
              <Users className="h-4 w-4 text-blue-500" aria-hidden="true" />
              <span>Search customers for <strong className="font-semibold text-foreground">"{trimmed}"</strong></span>
            </CommandItem>
            <CommandItem
              value={`track code ${trimmed}`}
              onSelect={() => go(`/track/${encodeURIComponent(trimmed)}`)}
            >
              <Package className="h-4 w-4 text-purple-500" aria-hidden="true" />
              <span>Track public order <strong className="font-semibold text-foreground">"{trimmed}"</strong></span>
            </CommandItem>
          </CommandGroup>
        )}

        <CommandGroup heading="Quick Actions">
          <CommandItem value="new order create intake walk-in" onSelect={() => go('/orders/new')}>
            <Plus aria-hidden="true" />
            New order
          </CommandItem>
          <CommandItem value="orders list pipeline workflow" onSelect={() => go('/orders')}>
            <ClipboardList aria-hidden="true" />
            All orders
          </CommandItem>
          <CommandItem value="operations board kanban workflow" onSelect={() => go('/board')}>
            <Kanban aria-hidden="true" />
            Operations board
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Navigation">
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
