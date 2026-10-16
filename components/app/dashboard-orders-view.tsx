'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/components/app/status-badge'
import { formatMoney } from '@/lib/money'
import { formatDate, formatDateTime, formatRelativeTime } from '@/lib/time'
import type { OrderStatus } from '@/lib/order-machine'
import { Search, ChevronRight, Inbox } from 'lucide-react'
import { cn } from 'cn'

export interface DashboardOrder {
  id: string
  order_number: string
  status: string
  total_cents: number
  due_at: string | null
  created_at: string
  updated_at: string
  customer: unknown
  items?: { service_name: string; quantity: number }[] | null
}

function customerName(customer: unknown): string {
  if (Array.isArray(customer)) return customer[0]?.full_name ?? 'Walk-in'
  if (customer && typeof customer === 'object' && 'full_name' in customer) {
    return String((customer as { full_name: unknown }).full_name ?? 'Walk-in')
  }
  return 'Walk-in'
}

function itemsSummary(items: { service_name: string; quantity: number }[] | null | undefined): string | null {
  if (!items || items.length === 0) return null
  const totalQty = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)
  const first = items[0].service_name
  if (items.length === 1) return `${totalQty} × ${first}`
  return `${totalQty} items · ${first} +${items.length - 1}`
}

function isOverdue(order: { due_at: string | null; status: string }, now: number): boolean {
  return (
    order.due_at != null &&
    !['COMPLETED', 'CANCELLED'].includes(order.status) &&
    new Date(order.due_at).getTime() < now
  )
}

type FilterTab = 'ALL' | 'READY' | 'ACTIVE' | 'RECEIVED' | 'COMPLETED'

export function DashboardOrdersView({
  orders,
}: {
  orders: DashboardOrder[]
}) {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL')
  const [search, setSearch] = useState('')
  const now = useMemo(() => Date.now(), [])

  const counts = useMemo(() => {
    return {
      ALL: orders.length,
      READY: orders.filter(o => o.status === 'READY').length,
      ACTIVE: orders.filter(o => ['WASHING', 'DRYING', 'FOLDING'].includes(o.status)).length,
      RECEIVED: orders.filter(o => o.status === 'RECEIVED').length,
      COMPLETED: orders.filter(o => o.status === 'COMPLETED').length,
    }
  }, [orders])

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Tab filter
      if (activeTab === 'READY' && order.status !== 'READY') return false
      if (activeTab === 'ACTIVE' && !['WASHING', 'DRYING', 'FOLDING'].includes(order.status)) return false
      if (activeTab === 'RECEIVED' && order.status !== 'RECEIVED') return false
      if (activeTab === 'COMPLETED' && order.status !== 'COMPLETED') return false

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim()
        const matchNum = order.order_number.toLowerCase().includes(q)
        const matchCust = customerName(order.customer).toLowerCase().includes(q)
        if (!matchNum && !matchCust) return false
      }

      return true
    })
  }, [orders, activeTab, search])

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'ALL', label: 'All', count: counts.ALL },
    { key: 'READY', label: 'Ready for pickup', count: counts.READY },
    { key: 'ACTIVE', label: 'In Wash & Dry', count: counts.ACTIVE },
    { key: 'RECEIVED', label: 'Intake / Queue', count: counts.RECEIVED },
    { key: 'COMPLETED', label: 'Completed', count: counts.COMPLETED },
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
      {/* Header controls — Apple-style segmented tabs and search */}
      <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        {/* Segmented Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5" role="tablist">
          {tabs.map(tab => {
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all outline-none',
                  active
                    ? 'bg-foreground text-background shadow-xs'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'tnum rounded-md px-1.5 py-0.2 text-[10px] font-semibold',
                    active ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Minimal Search Input */}
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Filter orders or customer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-border/70 bg-muted/30 pl-8 pr-3 text-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:bg-background"
          />
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <Inbox className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-xs font-medium text-foreground">No orders matching this view</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {search ? 'Try clearing your search keyword' : 'Switch filters to see active shop activity'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {filteredOrders.map(order => {
            const overdue = isOverdue(order, now)
            const summary = itemsSummary(order.items)
            const isReady = order.status === 'READY'

            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30 outline-none focus-visible:bg-muted/40"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="font-mono text-xs font-semibold text-foreground group-hover:text-primary transition-colors shrink-0">
                    {order.order_number}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-medium text-foreground">
                        {customerName(order.customer)}
                      </span>
                      {overdue && (
                        <span className="shrink-0 text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                          Overdue
                        </span>
                      )}
                    </div>
                    {summary && (
                      <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                        {summary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <StatusBadge status={order.status as OrderStatus} size="sm" />
                  <div className="tnum text-right min-w-[70px]">
                    <span className="text-xs font-semibold text-foreground">
                      {formatMoney(order.total_cents)}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      {formatRelativeTime(order.updated_at)}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors hidden sm:block" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
