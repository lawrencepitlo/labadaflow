import Link from 'next/link'
import { getOrderById } from '@/lib/data/orders'
import { getActiveServices } from '@/lib/data/services'
import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { EmptyState } from '@/components/app/empty-state'
import { OrderFlowStepper } from '@/components/app/order-flow-stepper'
import { OrderActions } from '@/components/app/order-actions'
import { OrderItemsEditor } from '@/components/app/order-items-editor'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatMoney } from '@/lib/money'
import { formatDateTime, formatDate } from '@/lib/time'
import { Printer, BellRing, CalendarClock, ChevronLeft } from 'lucide-react'
import { STATUS_CONFIG } from '@/lib/order-machine'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const order = await getOrderById(orderId)

  if (!order) {
    return <EmptyState title="Order not found" description="This order does not exist or you do not have access." />
  }

  const services = order.status === 'RECEIVED' ? await getActiveServices() : []
  // eslint-disable-next-line react-hooks/purity -- server component: evaluated once per request, not a client re-render
  const now = Date.now()
  const isOverdue =
    order.due_at != null &&
    !['COMPLETED', 'CANCELLED'].includes(order.status) &&
    new Date(order.due_at).getTime() < now
  const isReady = order.status === 'READY'

  return (
    <>
      <div className="mb-4">
        <Button variant="ghost" size="sm" render={<Link href="/orders" className="inline-flex items-center gap-1 text-muted-foreground" />}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          All orders
        </Button>
      </div>
      <PageHeader
        title={`Order ${order.order_number}`}
        description={`Received ${formatDateTime(order.created_at)} · ${order.customer.full_name} · ${formatMoney(order.total_cents)}`}
      >
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} size="md" />
          <Button variant="outline" render={<Link href={`/orders/${order.id}/slip`} />}>
            <Printer className="h-4 w-4" aria-hidden="true" />
            Print Slip
          </Button>
        </div>
      </PageHeader>

      {isReady && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-green-500/25 bg-green-500/[0.07] px-4 py-3" role="status">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/15">
            <BellRing className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Ready for customer pickup</p>
            <p className="truncate text-xs text-muted-foreground">
              Collect payment on completion — tracking code {order.tracking_code.slice(0, 12)}…
            </p>
          </div>
        </div>
      )}

      {isOverdue && order.due_at && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3" role="status">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
            <CalendarClock className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Past due date — {formatDate(order.due_at)}</p>
            <p className="text-xs text-muted-foreground">Prioritize this order in the workflow.</p>
          </div>
        </div>
      )}

      {/* Workflow progress */}
      <Card className="mb-4">
        <CardHeader className="px-6 py-4">
          <CardTitle className="text-base">Workflow</CardTitle>
          <CardDescription>{STATUS_CONFIG[order.status]?.description ?? order.status}</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <OrderFlowStepper currentStatus={order.status} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        {/* Left column: Items + History */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
              <div>
                <CardTitle className="text-base">Items</CardTitle>
                <CardDescription>
                  {order.status === 'RECEIVED'
                    ? 'Editable while order is received'
                    : 'Locked after processing starts'}
                </CardDescription>
              </div>
              <span className="text-sm font-semibold tabular-nums">{formatMoney(order.total_cents)}</span>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {order.status === 'RECEIVED' ? (
                <OrderItemsEditor orderId={order.id} items={order.items} services={services} />
              ) : (
                <>
                  <div className="overflow-hidden rounded-lg border">
                    <Table aria-label="Order items">
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Service</TableHead>
                          <TableHead className="font-semibold">Unit price</TableHead>
                          <TableHead className="text-center font-semibold">Qty</TableHead>
                          <TableHead className="text-right font-semibold">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map(item => (
                          <TableRow key={item.id} className="transition-colors hover:bg-accent/30 motion-reduce:transition-none">
                            <TableCell className="font-medium">{item.service_name}</TableCell>
                            <TableCell className="text-muted-foreground tabular-nums">{formatMoney(item.unit_price_cents)} / {item.pricing_unit === 'PER_KG' ? 'kg' : 'pc'}</TableCell>
                            <TableCell className="text-center tabular-nums">{item.quantity}</TableCell>
                            <TableCell className="text-right font-medium tabular-nums">{formatMoney(item.line_total_cents)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4 flex justify-end border-t pt-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold tracking-tight tabular-nums">{formatMoney(order.total_cents)}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-base">Status History</CardTitle>
              <CardDescription>{order.events.length} recorded transition{order.events.length === 1 ? '' : 's'}</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {order.events.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No transitions recorded yet.</p>
              ) : (
                <ol className="relative space-y-6">
                  {order.events.map((event, i) => (
                    <li key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center" aria-hidden="true">
                        <div className={`mt-1.5 h-3 w-3 rounded-full ${i === order.events.length - 1 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                        {i < order.events.length - 1 && (
                          <div className="mt-1 w-px flex-1 bg-border" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {event.from_status ? (
                                <span className="font-normal text-muted-foreground">{STATUS_CONFIG[event.from_status]?.label ?? event.from_status} → </span>
                              ) : null}
                              <span className="font-semibold">{STATUS_CONFIG[event.to_status]?.label ?? event.to_status}</span>
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">by {event.actor_name}</p>
                            {event.note && (
                              <p className="mt-1 text-xs italic text-muted-foreground">&ldquo;{event.note}&rdquo;</p>
                            )}
                          </div>
                          <time className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(event.created_at)}</time>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Details + Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd><StatusBadge status={order.status} size="sm" /></dd>
                </div>
                <Separator />
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Customer</dt>
                  <dd className="truncate font-medium">
                    <Link href={`/customers/${order.customer.id}`} className="text-primary hover:underline">
                      {order.customer.full_name}
                    </Link>
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>{order.customer.phone ?? '—'}</dd>
                </div>
                <Separator />
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Source</dt>
                  <dd className="capitalize">{order.source === 'WALK_IN' ? 'Walk-in' : 'Portal'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Assigned to</dt>
                  <dd>{order.assigned_staff?.full_name ?? '—'}</dd>
                </div>
                <Separator />
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Due</dt>
                  <dd className={isOverdue ? 'font-semibold text-amber-600 dark:text-amber-400' : ''}>
                    {order.due_at ? formatDateTime(order.due_at) : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Paid at</dt>
                  <dd>{order.paid_at ? formatDateTime(order.paid_at) : '—'}</dd>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Tracking</dt>
                  <dd>
                    <code className="rounded bg-muted px-2 py-1 font-mono text-xs">{order.tracking_code}</code>
                  </dd>
                </div>
              </dl>
              {order.notes && (
                <>
                  <Separator className="my-3" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Notes: </span>{order.notes}
                  </p>
                </>
              )}
              {order.cancel_reason && (
                <>
                  <Separator className="my-3" />
                  <p className="text-sm text-destructive">
                    <span className="font-medium">Cancel reason: </span>{order.cancel_reason}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-base">Actions</CardTitle>
              <CardDescription>Advance, move back, or cancel</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <OrderActions orderId={order.id} status={order.status} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
