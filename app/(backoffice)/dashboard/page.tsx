import Link from 'next/link'
import { getDashboardStats } from '@/lib/data/orders'
import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { EmptyState } from '@/components/app/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney } from '@/lib/money'
import { formatRelativeTime } from '@/lib/time'
import {
  Users,
  TrendingUp,
  Activity,
  ArrowRight,
  Plus,
  Package,
  ShoppingBag,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import type { OrderStatus } from '@/lib/order-machine'
import { STATUS_CONFIG } from '@/lib/order-machine'
import { cn } from 'cn'

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  if (!stats) {
    return <EmptyState title="Access Denied" description="You do not have permission to view this page." />
  }

  const readyForPickup = stats.statusCounts?.READY ?? 0
  const inProgress = (stats.statusCounts?.WASHING ?? 0) + (stats.statusCounts?.DRYING ?? 0) + (stats.statusCounts?.FOLDING ?? 0)
  const received = stats.statusCounts?.RECEIVED ?? 0

  const statCards = [
    {
      title: 'Active Orders',
      value: stats.activeOrders.toString(),
      icon: Activity,
      variant: 'primary',
      description: `${inProgress} in progress • ${readyForPickup} ready for pickup`,
    },
    {
      title: "Today's Revenue",
      value: formatMoney(stats.todayRevenue),
      icon: TrendingUp,
      variant: 'success',
      description: 'From completed orders today',
    },
    {
      title: 'Ready for Pickup',
      value: readyForPickup.toString(),
      icon: ShoppingBag,
      variant: 'info',
      description: 'Awaiting customer collection',
    },
    {
      title: 'Total Customers',
      value: stats.customerCount.toLocaleString(),
      icon: Users,
      variant: 'neutral',
      description: 'Active customer accounts',
    },
  ]

  const statusFlow: Array<{ status: OrderStatus; icon: React.ElementType; count: number }> = [
    { status: 'RECEIVED', icon: Package, count: stats.statusCounts?.RECEIVED ?? 0 },
    { status: 'WASHING', icon: RotateCcw, count: stats.statusCounts?.WASHING ?? 0 },
    { status: 'DRYING', icon: RotateCcw, count: stats.statusCounts?.DRYING ?? 0 },
    { status: 'FOLDING', icon: RotateCcw, count: stats.statusCounts?.FOLDING ?? 0 },
    { status: 'READY', icon: ShoppingBag, count: stats.statusCounts?.READY ?? 0 },
    { status: 'COMPLETED', icon: CheckCircle2, count: stats.statusCounts?.COMPLETED ?? 0 },
  ]

  const maxCount = Math.max(...statusFlow.map(s => s.count), 1)

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of your laundry operations">
        <Button render={<Link href="/orders/new" />}>
          <Plus className="w-4 h-4 mr-1.5" />
          New Order
        </Button>
      </PageHeader>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <Card key={card.title} className="transition-shadow hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground truncate">{card.title}</p>
                  <p className="text-3xl font-bold mt-2 tracking-tight">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{card.description}</p>
                </div>
                <div className={cn(
                  'p-3 rounded-xl ring-1 shrink-0',
                  card.variant === 'primary' && 'bg-primary/10 ring-primary/20',
                  card.variant === 'success' && 'bg-green-500/10 ring-green-500/20 dark:bg-green-500/10 dark:ring-green-500/20',
                  card.variant === 'info' && 'bg-blue-500/10 ring-blue-500/20 dark:bg-blue-500/10 dark:ring-blue-500/20',
                  card.variant === 'neutral' && 'bg-muted/50 ring-border'
                )}>
                  <card.icon className={cn(
                    'w-5 h-5 shrink-0',
                    card.variant === 'primary' && 'text-primary',
                    card.variant === 'success' && 'text-green-600 dark:text-green-400',
                    card.variant === 'info' && 'text-blue-600 dark:text-blue-400',
                    card.variant === 'neutral' && 'text-muted-foreground'
                  )} aria-hidden="true" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Status Pipeline */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
            <CardTitle className="text-lg">Order Pipeline</CardTitle>
            <Badge variant="outline" className="text-xs">
              {stats.totalOrders} total orders
            </Badge>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-4" role="list" aria-label="Order status pipeline">
              {statusFlow.map(({ status, icon: Icon, count }) => {
                const config = STATUS_CONFIG[status]
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
                const isActive = count > 0
                return (
                  <div key={status} className={cn('flex items-center gap-4', isActive ? '' : 'opacity-50')}>
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', config.bgColor)}>
                      <Icon className={cn('w-5 h-5', config.textColor)} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{config.label}</span>
                        <span className={cn('text-sm font-semibold shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                          {count}
                        </span>
                      </div>
                      <Progress value={percentage} className="mt-1.5 h-1.5" aria-label={`${count} orders in ${config.label}`} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Summary */}
        <Card>
          <CardHeader className="px-6 py-4">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-3">
            <Link
              href="/orders?status=RECEIVED"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Package className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">New Walk-ins</p>
                <p className="text-xs text-muted-foreground">{received} orders awaiting processing</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </Link>
            <Link
              href="/orders?status=READY"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                <ShoppingBag className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Ready for Pickup</p>
                <p className="text-xs text-muted-foreground">{readyForPickup} orders awaiting collection</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </Link>
            <Link
              href="/orders/new"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group border border-dashed"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Plus className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Create Order</p>
                <p className="text-xs text-muted-foreground">Start a new walk-in or portal order</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
          <CardTitle className="text-lg">Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" render={<Link href="/orders" className="flex items-center gap-1.5" />}>
            View all
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {stats.recentOrders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              description="Create your first order to get started."
              actionLabel="Create Order"
              actionHref="/orders/new"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <th className="pb-3 px-4">Order</th>
                    <th className="pb-3 px-4 hidden md:table-cell">Customer</th>
                    <th className="pb-3 px-4 text-right hidden sm:table-cell">Total</th>
                    <th className="pb-3 px-4 text-center">Status</th>
                    <th className="pb-3 px-4 text-right hidden lg:table-cell">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="py-4 px-4">
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-semibold text-sm hover:text-primary transition-colors"
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="py-4 px-4 hidden md:table-cell">
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {(() => { const c = Array.isArray(order.customer) ? order.customer[0] : order.customer; return c?.full_name ?? 'Unknown' })()}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-right hidden sm:table-cell font-semibold text-sm">
                        {formatMoney(order.total_cents)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <StatusBadge status={order.status as OrderStatus} size="sm" />
                      </td>
                      <td className="py-4 px-4 text-right hidden lg:table-cell text-xs text-muted-foreground">
                        {formatRelativeTime(order.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
