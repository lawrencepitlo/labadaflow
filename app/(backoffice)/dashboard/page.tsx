import Link from 'next/link'
import { getDashboardStats } from '@/lib/data/orders'
import { PageHeader } from '@/components/app/page-header'
import { StatusBadge, STATUS_DOT_CLASS } from '@/components/app/status-badge'
import { EmptyState } from '@/components/app/empty-state'
import { formatMoney } from '@/lib/money'
import { formatDate, formatDateTime, formatRelativeTime } from '@/lib/time'
import { ArrowRight, Plus, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ORDER_STATUS_FLOW } from '@/lib/order-machine'
import type { OrderStatus } from '@/lib/order-machine'
import { cn } from 'cn'
import { DashboardRevenueChart } from '@/components/app/dashboard-charts'

const FLOW_DESCRIPTION: Record<OrderStatus, string> = {
  RECEIVED: 'Awaiting processing',
  WASHING: 'In wash cycle',
  DRYING: 'In dryers',
  FOLDING: 'Folding & packing',
  READY: 'Awaiting pickup',
  COMPLETED: 'Picked up & paid',
  CANCELLED: 'Cancelled',
}

type RecentOrder = {
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

import { DashboardOrdersView, type DashboardOrder } from '@/components/app/dashboard-orders-view'

// Workflow descriptions kept minimal and compact
const STATIONS = [
  { status: 'RECEIVED', label: 'Received', dot: 'bg-blue-500' },
  { status: 'WASHING', label: 'Washing', dot: 'bg-sky-500' },
  { status: 'DRYING', label: 'Drying', dot: 'bg-amber-500' },
  { status: 'FOLDING', label: 'Folding', dot: 'bg-purple-500' },
  { status: 'READY', label: 'Ready', dot: 'bg-emerald-500' },
] as const

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  if (!stats) {
    return (
      <EmptyState
        title="Unable to load dashboard"
        description="We encountered an issue retrieving dashboard statistics. Please refresh the page."
      />
    )
  }

  const counts = stats.statusCounts ?? {}
  const receivedCount = counts.RECEIVED ?? 0
  const readyForPickup = counts.READY ?? 0
  const activeOrders = stats.activeOrders
  const totalOrders = stats.totalOrders
  // eslint-disable-next-line react-hooks/purity
  const todayLabel = formatDate(new Date())

  const overview = [
    {
      label: 'Active orders',
      value: activeOrders.toLocaleString(),
      sub: 'In shop processing',
      href: '/orders',
    },
    {
      label: 'Ready for pickup',
      value: readyForPickup.toLocaleString(),
      sub: readyForPickup > 0 ? 'Awaiting collection' : 'None waiting',
      href: '/orders?status=READY',
      dot: readyForPickup > 0 ? 'bg-emerald-500' : null,
    },
    {
      label: "Today's revenue",
      value: formatMoney(stats.todayRevenue),
      sub: 'Completed today',
      href: '/reports',
    },
    {
      label: 'Customers',
      value: stats.customerCount.toLocaleString(),
      sub: 'Registered',
      href: '/customers',
    },
  ]

  const recentOrders = (stats.recentOrders ?? []) as DashboardOrder[]

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${todayLabel} · ${activeOrders} active in shop`}
      >
        <Button render={<Link href="/orders/new" />}>
          <Plus aria-hidden="true" />
          New order
        </Button>
      </PageHeader>

      {/* KPI Cards — Minimal, Apple-style */}
      <section aria-label="Overview" className="mt-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {overview.map(item => (
            <Link
              key={item.label}
              href={item.href}
              className="tnum group block rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-border hover:shadow-sm"
              aria-label={`${item.label}: ${item.value}`}
            >
              <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                {item.dot && (
                  <span className={cn('h-2 w-2 rounded-full ring-2 ring-emerald-500/20', item.dot)} aria-hidden="true" />
                )}
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">{item.value}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{item.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Live Pipeline Strip — Replaces redundant stacked cards */}
      <div className="mt-6 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Shop Workflow Stations</span>
          </div>
          <Link href="/board" className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors">
            Open Kanban Board
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {STATIONS.map((station, idx) => {
            const count = counts[station.status] ?? 0
            return (
              <Link
                key={station.status}
                href={`/orders?status=${station.status}`}
                className="group flex flex-col rounded-xl border border-border/60 bg-muted/20 p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground group-hover:text-foreground">
                    <span className={cn('h-1.5 w-1.5 rounded-full', station.dot)} />
                    {station.label}
                  </span>
                  <span className="tnum font-mono text-sm font-bold text-foreground">{count}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Visual Revenue Trend */}
      <div className="mt-6">
        <DashboardRevenueChart dailyTrend={stats.dailyTrend} />
      </div>

      {/* Interactive Filterable Recent Orders */}
      <div className="mt-6 mb-12">
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Recent Orders</h2>
            <p className="text-xs text-muted-foreground">Narrow by stage or search instantly</p>
          </div>
          <Button variant="ghost" size="sm" render={<Link href="/orders" />} className="h-8 text-xs font-medium gap-1 hover:bg-muted">
            All orders
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
        <DashboardOrdersView orders={recentOrders} />
      </div>
    </>
  )
}
