import Link from 'next/link'
import { getOrderById } from '@/lib/data/orders'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { StatusBadge, STATUS_DOT_CLASS } from '@/components/app/status-badge'
import { OrderFlowStepper } from '@/components/app/order-flow-stepper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatMoney } from '@/lib/money'
import { formatDate, formatDateTime } from '@/lib/time'
import { STATUS_CONFIG } from '@/lib/order-machine'
import { ChevronLeft } from 'lucide-react'
import { cn } from 'cn'

export default async function PortalOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const order = await getOrderById(orderId)

  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description="This order does not exist or does not belong to you."
        actionLabel="Back to my orders"
        actionHref="/portal/orders"
      />
    )
  }

  const isReady = order.status === 'READY'
  const isCompleted = order.status === 'COMPLETED'
  const isCancelled = order.status === 'CANCELLED'

  const notice = isReady
    ? { dot: STATUS_DOT_CLASS.READY, title: 'Ready for pickup — bring your slip', sub: `${order.due_at ? `Was due ${formatDate(order.due_at)} · ` : ''}Pay ${formatMoney(order.total_cents)} at the counter.` }
    : isCompleted
      ? { dot: STATUS_DOT_CLASS.COMPLETED, title: 'Completed — thank you', sub: 'This order is paid and closed. No further action needed.' }
      : isCancelled
        ? { dot: STATUS_DOT_CLASS.CANCELLED, title: 'Cancelled — no pickup needed', sub: 'Please contact the shop if you have questions about this order.' }
        : null

  return (
    <>
      <div className="mb-2">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" render={<Link href="/portal/orders" aria-label="Back to my orders" />}>
          <ChevronLeft aria-hidden="true" />
          My orders
        </Button>
      </div>
      <PageHeader title={`Order ${order.order_number}`} description={`Received ${formatDateTime(order.received_at)} · ${formatMoney(order.total_cents)}`}>
        <StatusBadge status={order.status} />
      </PageHeader>

      {notice && (
        <div className="mb-4 rounded-lg border bg-card px-4 py-3" role="status">
          <p className="flex items-center gap-2.5 text-[13px] font-semibold">
            <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', notice.dot)} aria-hidden="true" />
            {notice.title}
          </p>
          <p className="tnum mt-0.5 pl-4 text-xs text-muted-foreground">{notice.sub}</p>
        </div>
      )}

      <Card className="mb-4 gap-0 py-0">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-[13px]">Progress</CardTitle>
          <CardDescription>{STATUS_CONFIG[order.status]?.description ?? ''}</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <OrderFlowStepper currentStatus={order.status} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:items-start">
        <div className="space-y-4 lg:col-span-2">
          <Card className="gap-0 py-0">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-[13px]">What did I order?</CardTitle>
              <CardDescription>{order.items.length} item{order.items.length === 1 ? '' : 's'}</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {/* Mobile: compact rows */}
              <ul className="space-y-2 sm:hidden" aria-label="Order items">
                {order.items.map(item => (
                  <li key={item.id} className="tnum rounded-md border px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-medium">{item.service_name}</p>
                      <p className="shrink-0 text-[13px] font-semibold">{formatMoney(item.line_total_cents)}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatMoney(item.unit_price_cents)} / {item.pricing_unit === 'PER_KG' ? 'kg' : 'pc'} · Qty {item.quantity}
                    </p>
                  </li>
                ))}
              </ul>
              {/* Desktop: table */}
              <div className="hidden overflow-x-auto rounded-md border sm:block">
                <Table aria-label="Order items">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-9 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Service</TableHead>
                      <TableHead className="h-9 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Unit price</TableHead>
                      <TableHead className="h-9 text-center text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Qty</TableHead>
                      <TableHead className="h-9 text-right text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map(item => (
                      <TableRow key={item.id} className="hover:bg-muted/40">
                        <TableCell className="text-[13px] font-medium">{item.service_name}</TableCell>
                        <TableCell className="tnum text-xs text-muted-foreground">{formatMoney(item.unit_price_cents)} / {item.pricing_unit === 'PER_KG' ? 'kg' : 'pc'}</TableCell>
                        <TableCell className="tnum text-center text-[13px]">{item.quantity}</TableCell>
                        <TableCell className="tnum text-right text-[13px] font-medium">{formatMoney(item.line_total_cents)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="tnum mt-3 flex items-baseline justify-between border-t pt-3">
                <p className="text-xs text-muted-foreground">Total to pay</p>
                <p className="text-[15px] font-semibold tracking-tight">{formatMoney(order.total_cents)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 py-0">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-[13px]">Status History</CardTitle>
              <CardDescription>When your laundry moved through the shop</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {order.events.length === 0 ? (
                <p className="py-3 text-center text-[13px] text-muted-foreground">No updates yet — we just received your order.</p>
              ) : (
                <ol className="space-y-4" aria-label="Order status history">
                  {order.events.map((event, i) => (
                    <li key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center" aria-hidden="true">
                        <span className={cn(
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          i === order.events.length - 1 ? STATUS_DOT_CLASS[event.to_status] ?? 'bg-foreground' : 'bg-muted-foreground/25'
                        )} />
                        {i < order.events.length - 1 && (
                          <span className="mt-1 w-px flex-1 bg-border" />
                        )}
                      </div>
                      <div className="tnum min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="truncate text-[13px] font-semibold">
                            {STATUS_CONFIG[event.to_status]?.label ?? event.to_status}
                          </p>
                          <time dateTime={event.created_at} className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(event.created_at)}</time>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {STATUS_CONFIG[event.to_status]?.description ?? ''}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="order-first h-fit gap-0 py-0 lg:order-none">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-[13px]">Details</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <dl className="tnum divide-y divide-border text-[13px]">
              <div className="flex items-center justify-between gap-2 py-2 first:pt-0">
                <dt className="text-xs text-muted-foreground">Status</dt>
                <dd><StatusBadge status={order.status} size="sm" /></dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2">
                <dt className="text-xs text-muted-foreground">Received</dt>
                <dd>{formatDateTime(order.received_at)}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2">
                <dt className="text-xs text-muted-foreground">Due</dt>
                <dd>{order.due_at ? formatDateTime(order.due_at) : '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2 last:pb-0">
                <dt className="text-xs text-muted-foreground">Completed</dt>
                <dd>{order.completed_at ? formatDateTime(order.completed_at) : '—'}</dd>
              </div>
            </dl>
            <div className="mt-3 flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-2.5 py-1.5">
              <span className="shrink-0 text-xs text-muted-foreground">Tracking</span>
              <code className="min-w-0 truncate font-mono text-xs">{order.tracking_code}</code>
            </div>
            {order.cancel_reason && (
              <p className="mt-3 text-[13px] text-muted-foreground">
                <span className="font-medium text-foreground">Why was it cancelled? </span>{order.cancel_reason}
              </p>
            )}
            {!isCompleted && !isCancelled && (
              <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                {isReady
                  ? 'Show this tracking code or your slip at the counter for pickup.'
                  : 'We update this page as your laundry moves through the shop. No action needed from you right now.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
