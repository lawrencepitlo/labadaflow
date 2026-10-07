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
    return <EmptyState title="Access Denied" description="You do not have permission to view this page." />
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

      {/* Overview — one quiet strip, no decorative cards */}
      <section aria-label="Overview">
        <div className="grid grid-cols-2 overflow-hidden rounded-lg border bg-card lg:grid-cols-4">
          {overview.map(item => (
            <Link
              key={item.label}
              href={item.href}
              className="tnum block p-4 outline-none transition-colors duration-100 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 motion-reduce:transition-none odd:border-r lg:odd:border-r-0 lg:[&:not(:first-child)]:border-l [&:nth-child(n+3)]:border-t lg:[&:nth-child(n+3)]:border-t-0"
              aria-label={`${item.label}: ${item.value}`}
            >
              <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {item.dot && (
                  <span className={cn('h-1.5 w-1.5 rounded-full', item.dot)} aria-hidden="true" />
                )}
                {item.label}
              </p>
              <p className="mt-1 text-xl font-semibold tracking-tight">{item.value}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Needs attention */}
      <Card className="mt-4 gap-0 overflow-hidden py-0">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-[13px]">Needs attention</CardTitle>
          <CardDescription>Orders waiting on staff action</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!needsAttention ? (
            <p className="border-t px-4 py-4 text-[13px] text-muted-foreground">
              All clear — nothing is waiting on staff right now.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border border-t sm:flex-row sm:divide-x sm:divide-y-0">
              <Link
                href="/orders?status=READY"
                aria-label={`${readyForPickup} orders ready for pickup`}
                className="flex flex-1 items-center gap-2.5 px-4 py-3 outline-none transition-colors duration-100 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 motion-reduce:transition-none"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" aria-hidden="true" />
                <span className="tnum min-w-0 flex-1 text-[13px]">
                  <span className="font-semibold">{readyForPickup} ready for pickup</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    Notify customers to collect
                  </span>
                </span>
                {readyForPickup > 0 && (
                  <span className="shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    Action needed
                  </span>
                )}
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />
              </Link>
              <Link
                href="/orders?status=RECEIVED"
                aria-label={`${receivedCount} orders awaiting processing`}
                className="flex flex-1 items-center gap-2.5 px-4 py-3 outline-none transition-colors duration-100 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 motion-reduce:transition-none"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" aria-hidden="true" />
                <span className="tnum min-w-0 flex-1 text-[13px]">
                  <span className="font-semibold">{receivedCount} awaiting processing</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    Received orders not yet in wash
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order pipeline */}
      <Card className="mt-4 gap-0 py-0">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-[13px]">Order pipeline</CardTitle>
          <CardDescription>Live count per stage — select a stage to filter orders.</CardDescription>
          <CardAction>
            <span className="tnum text-xs text-muted-foreground">{totalOrders} total</span>
          </CardAction>
        </CardHeader>
        <CardContent className="px-2 pb-2">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-3 xl:grid-cols-6">
            {flow.map(({ status, count }) => {
              const share = totalOrders > 0 ? Math.min(100, (count / totalOrders) * 100) : 0
              return (
                <Link
                  key={status}
                  href={`/orders?status=${status}`}
                  aria-label={`${status}: ${count} orders`}
                  className="tnum bg-card p-3 outline-none transition-colors duration-100 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 motion-reduce:transition-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_DOT_CLASS[status])} aria-hidden="true" />
                    <span className="truncate text-xs font-medium text-muted-foreground">
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </span>
                    <span className="ml-auto text-[15px] font-semibold tracking-tight">{count}</span>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">{FLOW_DESCRIPTION[status]}</p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <div
                      className={cn('h-full rounded-full', status === 'READY' && count > 0 ? 'bg-green-500' : 'bg-foreground/30')}
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
      <Card className="mt-4 gap-0 overflow-hidden py-0">
        <CardHeader className="px-4 py-3">
          <div>
            <CardTitle className="text-[13px]">Recent orders</CardTitle>
            <CardDescription>Latest activity across the shop</CardDescription>
          </div>
          <CardAction>
            <Button variant="ghost" size="sm" render={<Link href="/orders" />}>
              View all
              <ArrowRight aria-hidden="true" />
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
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-9 pl-4 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Order</TableHead>
                    <TableHead className="h-9 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Customer</TableHead>
                    <TableHead className="h-9 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Status</TableHead>
                    <TableHead className="h-9 text-right text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Total</TableHead>
                    <TableHead className="h-9 pr-4 text-right text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Updated</TableHead>
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
