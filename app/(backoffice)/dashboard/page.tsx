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
  // eslint-disable-next-line react-hooks/purity -- server component: evaluated once per request, not a client re-render
  const now = Date.now()
  const todayLabel = formatDate(new Date())

  const overview = [
    {
      label: 'Active orders',
      value: activeOrders.toLocaleString(),
      sub: 'Across all stages',
      href: '/orders',
    },
    {
      label: 'Ready for pickup',
      value: readyForPickup.toLocaleString(),
      sub: readyForPickup > 0 ? 'Notify customers to collect' : 'Nothing waiting right now',
      href: '/orders?status=READY',
      dot: readyForPickup > 0 ? 'bg-green-500' : null,
    },
    {
      label: "Today's revenue",
      value: formatMoney(stats.todayRevenue),
      sub: 'From orders completed today',
      href: '/reports',
    },
    {
      label: 'Customers',
      value: stats.customerCount.toLocaleString(),
      sub: 'Registered accounts',
      href: '/customers',
    },
  ]

  const flow = ORDER_STATUS_FLOW.map(status => ({
    status,
    count: counts[status] ?? 0,
  }))

  const recentOrders = (stats.recentOrders ?? []) as RecentOrder[]
  const needsAttention = readyForPickup > 0 || receivedCount > 0

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${todayLabel} · ${activeOrders} active · ${readyForPickup} ready for pickup`}
      >
        <Button render={<Link href="/orders/new" />}>
          <Plus aria-hidden="true" />
          New order
        </Button>
      </PageHeader>

      {/* Overview — modern KPI cards */}
      <section aria-label="Overview" className="mt-6">
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Visual Revenue & Volume Trend */}
      <div className="mt-6">
        <DashboardRevenueChart dailyTrend={stats.dailyTrend} />
      </div>

      {/* Needs attention */}
      <Card className="mt-6 gap-0 overflow-hidden rounded-2xl border border-border/80 shadow-xs py-0">
        <CardHeader className="px-5 py-4">
          <CardTitle className="text-sm font-semibold">Needs attention</CardTitle>
          <CardDescription className="text-xs">Orders waiting on staff action</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!needsAttention ? (
            <p className="border-t px-5 py-4 text-xs text-muted-foreground">
              All clear — nothing is waiting on staff right now.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border border-t sm:flex-row sm:divide-x sm:divide-y-0">
              <Link
                href="/orders?status=READY"
                aria-label={`${readyForPickup} orders ready for pickup`}
                className="flex flex-1 items-center gap-3 px-5 py-3.5 outline-none transition-colors duration-100 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 motion-reduce:transition-none"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" aria-hidden="true" />
                <span className="tnum min-w-0 flex-1 text-sm">
                  <span className="font-semibold text-foreground">{readyForPickup} ready for pickup</span>
                  <span className="block truncate text-xs text-muted-foreground mt-0.5">
                    Notify customers to collect & collect payment
                  </span>
                </span>
                {readyForPickup > 0 && (
                  <span className="shrink-0 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Ready
                  </span>
                )}
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />
              </Link>
              <Link
                href="/orders?status=RECEIVED"
                aria-label={`${receivedCount} orders awaiting processing`}
                className="flex flex-1 items-center gap-3 px-5 py-3.5 outline-none transition-colors duration-100 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 motion-reduce:transition-none"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500 ring-2 ring-blue-500/20" aria-hidden="true" />
                <span className="tnum min-w-0 flex-1 text-sm">
                  <span className="font-semibold text-foreground">{receivedCount} awaiting processing</span>
                  <span className="block truncate text-xs text-muted-foreground mt-0.5">
                    Received orders waiting for washer assignment
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order pipeline */}
      <Card className="mt-6 gap-0 overflow-hidden rounded-2xl border border-border/80 shadow-xs py-0">
        <CardHeader className="px-5 py-4">
          <div>
            <CardTitle className="text-sm font-semibold">Order pipeline</CardTitle>
            <CardDescription className="text-xs">Live count per stage — select a stage to view orders.</CardDescription>
          </div>
          <CardAction>
            <span className="tnum font-mono text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md">{totalOrders} total orders</span>
          </CardAction>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-1">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {flow.map(({ status, count }) => {
              const share = totalOrders > 0 ? Math.min(100, (count / totalOrders) * 100) : 0
              return (
                <Link
                  key={status}
                  href={`/orders?status=${status}`}
                  aria-label={`${status}: ${count} orders`}
                  className="tnum group rounded-xl border border-border/70 bg-card p-3.5 outline-none transition-all hover:border-primary/40 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_DOT_CLASS[status])} aria-hidden="true" />
                    <span className="truncate text-xs font-semibold text-foreground">
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </span>
                    <span className="ml-auto font-mono text-sm font-bold tracking-tight text-foreground">{count}</span>
                  </div>
                  <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{FLOW_DESCRIPTION[status]}</p>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <div
                      className={cn('h-full rounded-full transition-all', status === 'READY' && count > 0 ? 'bg-emerald-500' : 'bg-primary/60')}
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent orders */}
      <Card className="mt-6 gap-0 overflow-hidden rounded-2xl border border-border/80 shadow-xs py-0 mb-12">
        <CardHeader className="px-5 py-4">
          <div>
            <CardTitle className="text-sm font-semibold">Recent orders</CardTitle>
            <CardDescription className="text-xs">Latest customer activity across the shop</CardDescription>
          </div>
          <CardAction>
            <Button variant="ghost" size="sm" render={<Link href="/orders" />} className="h-8 text-xs font-medium gap-1 hover:bg-muted">
              View all
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </CardAction>
        </CardHeader>
        {recentOrders.length === 0 ? (
          <CardContent className="p-0">
            <EmptyState
              title="No orders yet"
              description="Create your first order to start the flow: received → washing → ready → pickup."
              actionLabel="Create Order"
              actionHref="/orders/new"
            />
          </CardContent>
        ) : (
          <CardContent className="p-0">
            {/* Desktop — Linear-style compact rows */}
            <div className="hidden border-t md:block">
              <Table aria-label="Recent orders">
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 pl-4 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Order</TableHead>
                    <TableHead className="h-10 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Customer</TableHead>
                    <TableHead className="h-10 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Status</TableHead>
                    <TableHead className="h-10 text-right text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Total</TableHead>
                    <TableHead className="h-10 pr-4 text-right text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map(order => {
                    const overdue = isOverdue(order, now)
                    const summary = itemsSummary(order.items)
                    return (
                      <TableRow key={order.id} className="h-12 hover:bg-muted/40">
                        <TableCell className="pl-4">
                          <Link
                            href={`/orders/${order.id}`}
                            className="font-mono text-xs font-medium text-foreground hover:underline"
                          >
                            {order.order_number}
                          </Link>
                          {overdue && order.due_at && (
                            <span className="mt-0.5 block text-[11px] font-medium text-amber-600 dark:text-amber-400">
                              Due {formatDate(order.due_at)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="max-w-[14rem] truncate text-[13px] font-medium">{customerName(order.customer)}</p>
                          {summary && (
                            <p className="mt-0.5 max-w-[14rem] truncate text-xs text-muted-foreground">{summary}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status as OrderStatus} size="sm" />
                        </TableCell>
                        <TableCell className="tnum text-right text-[13px] font-medium">
                          {formatMoney(order.total_cents)}
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <span
                            className="block text-xs text-muted-foreground"
                            title={formatDateTime(order.updated_at)}
                          >
                            {formatRelativeTime(order.updated_at)}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile compact list */}
            <ul className="space-y-2 border-t p-3 md:hidden">
              {recentOrders.map(order => {
                const overdue = isOverdue(order, now)
                const summary = itemsSummary(order.items)
                return (
                  <li key={order.id}>
                    <Link
                      href={`/orders/${order.id}`}
                      aria-label={`View order ${order.order_number}`}
                      className="block rounded-lg border bg-card p-3 outline-none transition-colors duration-100 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/40 motion-reduce:transition-none"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-medium">{order.order_number}</span>
                        <StatusBadge status={order.status as OrderStatus} size="sm" />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between gap-2 text-[13px]">
                        <span className="truncate font-medium">{customerName(order.customer)}</span>
                        <span className="tnum shrink-0 font-semibold">{formatMoney(order.total_cents)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="truncate">
                          {summary ?? `Updated ${formatRelativeTime(order.updated_at)}`}
                        </span>
                        {overdue && order.due_at ? (
                          <span className="shrink-0 font-medium text-amber-600 dark:text-amber-400">
                            Due {formatDate(order.due_at)}
                          </span>
                        ) : (
                          <span className="shrink-0">{formatRelativeTime(order.updated_at)}</span>
                        )}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        )}
      </Card>
    </>
  )
}
