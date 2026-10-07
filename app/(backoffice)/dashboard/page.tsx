import Link from 'next/link'
import { getDashboardStats } from '@/lib/data/orders'
import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { EmptyState } from '@/components/app/empty-state'
import { formatMoney } from '@/lib/money'
import { formatDate, formatDateTime, formatRelativeTime } from '@/lib/time'
import {
  Users,
  Banknote,
  ClipboardList,
  ArrowRight,
  Plus,
  Package,
  ShoppingBag,
  CheckCircle2,
  WashingMachine,
  Wind,
  FoldVertical,
  Inbox,
  BellRing,
  CalendarClock,
} from 'lucide-react'
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

const STATUS_ICONS: Record<OrderStatus, React.ElementType> = {
  RECEIVED: Package,
  WASHING: WashingMachine,
  DRYING: Wind,
  FOLDING: FoldVertical,
  READY: ShoppingBag,
  COMPLETED: CheckCircle2,
  CANCELLED: Package,
}

const FLOW_META: Record<OrderStatus, { description: string; barClass: string }> = {
  RECEIVED: { description: 'Awaiting processing', barClass: 'bg-blue-500' },
  WASHING: { description: 'In wash cycle', barClass: 'bg-cyan-500' },
  DRYING: { description: 'In dryers', barClass: 'bg-amber-500' },
  FOLDING: { description: 'Folding & packing', barClass: 'bg-purple-500' },
  READY: { description: 'Awaiting pickup', barClass: 'bg-green-600' },
  COMPLETED: { description: 'Picked up & paid', barClass: 'bg-emerald-600' },
  CANCELLED: { description: 'Cancelled', barClass: 'bg-red-500' },
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

  const metrics = [
    {
      title: 'Active orders',
      value: activeOrders.toLocaleString(),
      description: 'Not yet completed or cancelled',
      icon: ClipboardList,
      iconWrap: 'bg-muted',
      iconClass: 'text-muted-foreground',
      href: '/orders?status=ALL',
      accent: false,
    },
    {
      title: 'Ready for pickup',
      value: readyForPickup.toLocaleString(),
      description: readyForPickup > 0 ? 'Awaiting customer collection' : 'Nothing waiting right now',
      icon: ShoppingBag,
      iconWrap: 'bg-green-500/15',
      iconClass: 'text-green-600 dark:text-green-400',
      href: '/orders?status=READY',
      accent: readyForPickup > 0,
    },
    {
      title: "Today's revenue",
      value: formatMoney(stats.todayRevenue),
      description: 'From orders completed today',
      icon: Banknote,
      iconWrap: 'bg-muted',
      iconClass: 'text-muted-foreground',
      href: '/reports',
      accent: false,
    },
    {
      title: 'Customers',
      value: stats.customerCount.toLocaleString(),
      description: 'Registered customer accounts',
      icon: Users,
      iconWrap: 'bg-muted',
      iconClass: 'text-muted-foreground',
      href: '/customers',
      accent: false,
    },
  ]

  const flow = ORDER_STATUS_FLOW.map(status => ({
    status,
    count: counts[status] ?? 0,
  }))

  const recentOrders = (stats.recentOrders ?? []) as RecentOrder[]

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${todayLabel} · received → washing → ready → pickup`}
      >
        <Button render={<Link href="/orders/new" />}>
          <Plus aria-hidden="true" />
          New order
        </Button>
      </PageHeader>

      {/* Operations metrics */}
      <section aria-label="Operations metrics" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map(metric => (
          <Card
            key={metric.title}
            className={cn(
              'gap-0 py-0',
              metric.accent && 'border-green-500/30 bg-green-500/[0.04]'
            )}
          >
            <CardContent className="p-4">
              <Link
                href={metric.href}
                className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                aria-label={`${metric.title}: ${metric.value}`}
              >
                <div className="flex items-center gap-2">
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', metric.iconWrap)}>
                    <metric.icon className={cn('h-4 w-4', metric.iconClass)} aria-hidden="true" />
                  </span>
                  <p className="truncate text-xs font-medium text-muted-foreground">{metric.title}</p>
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums sm:text-[1.75rem]">
                  {metric.value}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{metric.description}</p>
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Needs attention — READY first, visually prioritized */}
      <Card className="mt-4 gap-0 overflow-hidden py-0">
        <CardHeader className="px-4 py-3 sm:px-6">
          <CardTitle className="text-sm">Needs attention</CardTitle>
          <CardDescription>Orders waiting on staff action</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col divide-y divide-border border-t sm:flex-row sm:divide-x sm:divide-y-0">
            <Link
              href="/orders?status=READY"
              aria-label={`${readyForPickup} orders ready for pickup`}
              className={cn(
                'flex flex-1 items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 motion-reduce:transition-none sm:px-6',
                readyForPickup > 0 && 'bg-green-500/[0.06] hover:bg-green-500/[0.09]'
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/15">
                <BellRing className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">
                  <span className="tabular-nums">{readyForPickup}</span> ready for pickup
                  {readyForPickup > 0 && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-green-500/15 px-2 py-0.5 align-middle text-[11px] font-semibold text-green-700 dark:text-green-300">
                      Action needed
                    </span>
                  )}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  Notify customers to collect
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
            <Link
              href="/orders?status=RECEIVED"
              aria-label={`${receivedCount} orders awaiting processing`}
              className="flex flex-1 items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 motion-reduce:transition-none sm:px-6"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Inbox className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">
                  <span className="tabular-nums">{receivedCount}</span> awaiting processing
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  Received orders not yet in wash
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Order pipeline */}
      <Card className="mt-4 gap-0 py-0">
        <CardHeader className="px-4 py-3 sm:px-6">
          <CardTitle className="text-sm">Order pipeline</CardTitle>
          <CardDescription>Live count per stage — select a stage to filter orders.</CardDescription>
          <CardAction>
            <span className="text-xs text-muted-foreground tabular-nums">{totalOrders} total</span>
          </CardAction>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {flow.map(({ status, count }) => {
              const Icon = STATUS_ICONS[status]
              const meta = FLOW_META[status]
              const share = totalOrders > 0 ? Math.min(100, (count / totalOrders) * 100) : 0
              const isReady = status === 'READY'
              return (
                <Link
                  key={status}
                  href={`/orders?status=${status}`}
                  aria-label={`${status}: ${count} orders`}
                  className={cn(
                    'rounded-lg border bg-card p-3 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/40 motion-reduce:transition-none',
                    isReady && count > 0 && 'border-green-500/30 bg-green-500/[0.04] hover:bg-green-500/[0.08]'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        isReady && count > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                      )}
                      aria-hidden="true"
                    />
                    <span className="text-xl font-semibold tracking-tight tabular-nums">{count}</span>
                  </div>
                  <p className="mt-2 text-xs font-semibold">{status.charAt(0) + status.slice(1).toLowerCase()}</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{meta.description}</p>
                  <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <div
                      className={cn('h-full rounded-full', meta.barClass)}
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
        <CardHeader className="px-4 py-3 sm:px-6">
          <div>
            <CardTitle className="text-sm">Recent orders</CardTitle>
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
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table aria-label="Recent orders">
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="pl-6 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Order</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Customer</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total</TableHead>
                    <TableHead className="pr-6 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map(order => {
                    const overdue = isOverdue(order, now)
                    const summary = itemsSummary(order.items)
                    const isReadyRow = order.status === 'READY'
                    return (
                      <TableRow
                        key={order.id}
                        className={cn(
                          'hover:bg-muted/40',
                          isReadyRow && 'bg-green-500/[0.04] hover:bg-green-500/[0.08]'
                        )}
                      >
                        <TableCell className="pl-6">
                          <Link
                            href={`/orders/${order.id}`}
                            className="text-sm font-semibold text-primary hover:underline"
                          >
                            {order.order_number}
                          </Link>
                          {overdue && order.due_at && (
                            <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                              <CalendarClock className="h-3 w-3" aria-hidden="true" />
                              Due {formatDate(order.due_at)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="max-w-[14rem] truncate text-sm font-medium">{customerName(order.customer)}</p>
                          {summary && (
                            <p className="mt-0.5 max-w-[14rem] truncate text-xs text-muted-foreground">{summary}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status as OrderStatus} size="sm" />
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium tabular-nums">
                          {formatMoney(order.total_cents)}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <span
                            className="block text-xs text-muted-foreground"
                            title={formatDateTime(order.updated_at)}
                          >
                            {formatRelativeTime(order.updated_at)}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground/80">
                            {formatDate(order.created_at)}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile compact list */}
            <ul className="space-y-2 p-3 md:hidden">
              {recentOrders.map(order => {
                const overdue = isOverdue(order, now)
                const summary = itemsSummary(order.items)
                const isReadyRow = order.status === 'READY'
                return (
                  <li key={order.id}>
                    <Link
                      href={`/orders/${order.id}`}
                      aria-label={`View order ${order.order_number}`}
                      className={cn(
                        'block rounded-lg border bg-card p-3.5 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/40 motion-reduce:transition-none',
                        isReadyRow && 'border-green-500/30 bg-green-500/[0.04]'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-primary">{order.order_number}</span>
                        <StatusBadge status={order.status as OrderStatus} size="sm" />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium">{customerName(order.customer)}</span>
                        <span className="shrink-0 font-semibold tabular-nums">{formatMoney(order.total_cents)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="truncate">
                          {summary ?? `Updated ${formatRelativeTime(order.updated_at)}`}
                        </span>
                        {overdue && order.due_at ? (
                          <span className="inline-flex shrink-0 items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                            <CalendarClock className="h-3 w-3" aria-hidden="true" />
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
