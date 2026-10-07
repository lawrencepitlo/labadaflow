import Link from 'next/link'
import { getOrderById } from '@/lib/data/orders'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { StatusBadge } from '@/components/app/status-badge'
import { OrderFlowStepper } from '@/components/app/order-flow-stepper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatMoney } from '@/lib/money'
import { formatDate, formatDateTime } from '@/lib/time'
import { STATUS_CONFIG } from '@/lib/order-machine'
import { BellRing, CheckCircle2, ChevronLeft, XCircle } from 'lucide-react'

export default async function PortalOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const order = await getOrderById(orderId)

  if (!order) {
    return <EmptyState title="Order not found" description="This order does not exist or does not belong to you." />
  }

  const isReady = order.status === 'READY'
  const isCompleted = order.status === 'COMPLETED'
  const isCancelled = order.status === 'CANCELLED'

  return (
    <>
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/portal/orders" className="inline-flex items-center gap-1 text-muted-foreground" aria-label="Back to my orders" />}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          My orders
        </Button>
      </div>
      <PageHeader title={`Order ${order.order_number}`} description={`Received ${formatDateTime(order.received_at)} · ${formatMoney(order.total_cents)}`}>
        <StatusBadge status={order.status} />
      </PageHeader>

      {isReady && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-500/25 bg-green-500/[0.07] px-4 py-3" role="status">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/15">
            <BellRing className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Ready for pickup — bring your slip</p>
            <p className="text-xs text-muted-foreground">
              {order.due_at ? `Was due ${formatDate(order.due_at)} · ` : ''}Pay {formatMoney(order.total_cents)} at the counter.
            </p>
          </div>
        </div>
      )}
      {isCompleted && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3" role="status">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Completed — thank you</p>
            <p className="text-xs text-muted-foreground">This order is paid and closed. No further action needed.</p>
          </div>
        </div>
      )}
      {isCancelled && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/25 bg-red-500/[0.07] px-4 py-3" role="status">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Cancelled — no pickup needed</p>
            <p className="text-xs text-muted-foreground">Please contact the shop if you have questions about this order.</p>
          </div>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader className="px-6 py-4">
          <CardTitle className="text-base">Progress</CardTitle>
          <CardDescription>{STATUS_CONFIG[order.status]?.description ?? ''}</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <OrderFlowStepper currentStatus={order.status} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-base">What did I order?</CardTitle>
              <CardDescription>{order.items.length} item{order.items.length === 1 ? '' : 's'}</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {/* Mobile: compact cards */}
              <ul className="space-y-2 sm:hidden" aria-label="Order items">
                {order.items.map(item => (
                  <li key={item.id} className="rounded-lg border px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{item.service_name}</p>
                      <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(item.line_total_cents)}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                      {formatMoney(item.unit_price_cents)} / {item.pricing_unit === 'PER_KG' ? 'kg' : 'pc'} · Qty {item.quantity}
                    </p>
                  </li>
                ))}
              </ul>
              {/* Desktop: table */}
              <div className="hidden rounded-lg border sm:block sm:overflow-hidden">
                <Table aria-label="Order items">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Service</TableHead>
                      <TableHead className="font-semibold">Unit Price</TableHead>
                      <TableHead className="font-semibold text-center">Qty</TableHead>
                      <TableHead className="font-semibold text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.service_name}</TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">{formatMoney(item.unit_price_cents)} / {item.pricing_unit === 'PER_KG' ? 'kg' : 'pc'}</TableCell>
                        <TableCell className="text-center tabular-nums">{item.quantity}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{formatMoney(item.line_total_cents)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end mt-4 pt-4 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total to pay</p>
                  <p className="text-2xl font-bold tabular-nums">{formatMoney(order.total_cents)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-base">Status History</CardTitle>
              <CardDescription>When your laundry moved through the shop</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {order.events.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No updates yet — we just received your order.</p>
              ) : (
                <ol className="relative space-y-6" aria-label="Order status history">
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
                          <div>
                            <p className="text-sm font-medium">
                              <span className="font-semibold">{STATUS_CONFIG[event.to_status]?.label ?? event.to_status}</span>
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {STATUS_CONFIG[event.to_status]?.description ?? ''}
                            </p>
                          </div>
                          <time dateTime={event.created_at} className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(event.created_at)}</time>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader className="px-6 py-4">
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <dt className="text-muted-foreground">Status</dt>
                <dd><StatusBadge status={order.status} size="sm" /></dd>
              </div>
              <Separator />
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Received</dt>
                <dd className="font-medium text-right">{formatDateTime(order.received_at)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Due</dt>
                <dd className="text-right">{order.due_at ? formatDateTime(order.due_at) : '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Completed</dt>
                <dd className="text-right">{order.completed_at ? formatDateTime(order.completed_at) : '—'}</dd>
              </div>
              <Separator />
              <div className="flex justify-between items-center gap-2">
                <dt className="text-muted-foreground">Tracking</dt>
                <dd>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{order.tracking_code}</code>
                </dd>
              </div>
            </dl>
            {order.cancel_reason && (
              <>
                <Separator className="my-3" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Why was it cancelled? </span>{order.cancel_reason}
                </p>
              </>
            )}
            {!isCompleted && !isCancelled && (
              <>
                <Separator className="my-3" />
                <p className="text-xs text-muted-foreground">
                  {isReady
                    ? 'Show this tracking code or your slip at the counter for pickup.'
                    : 'We update this page as your laundry moves through the shop. No action needed from you right now.'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
