import Link from 'next/link'
import { getOrderById } from '@/lib/data/orders'
import { getActiveServices } from '@/lib/data/services'
import { StatusBadge, STATUS_DOT_CLASS } from '@/components/app/status-badge'
import { EmptyState } from '@/components/app/empty-state'
import { OrderFlowStepper } from '@/components/app/order-flow-stepper'
import { OrderActions } from '@/components/app/order-actions'
import { OrderPrimaryAction } from '@/components/app/order-primary-action'
import { OrderItemsEditor } from '@/components/app/order-items-editor'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatMoney } from '@/lib/money'
import { formatDateTime, formatDate } from '@/lib/time'
import { Printer } from 'lucide-react'
import { STATUS_CONFIG } from '@/lib/order-machine'
import { cn } from 'cn'

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
      {/* Breadcrumb — also serves as back navigation */}
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/orders" className="rounded outline-none transition-colors duration-100 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 motion-reduce:transition-none">
          Orders
        </Link>
        <span aria-hidden="true" className="text-muted-foreground/50">/</span>
        <span className="font-mono text-foreground" aria-current="page">{order.order_number}</span>
      </nav>

      {/* Identity header */}
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-[17px] font-semibold tracking-tight text-foreground">{order.order_number}</h1>
            <StatusBadge status={order.status} size="sm" />
          </div>
          <p className="mt-1 truncate text-[13px] text-muted-foreground">
            <Link
              href={`/customers/${order.customer.id}`}
              className="font-medium text-foreground/90 rounded outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {order.customer.full_name}
            </Link>
            <span aria-hidden="true"> · </span>
            {order.source === 'WALK_IN' ? 'Walk-in' : 'Portal'}
          </p>
          <p className="tnum mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            <span>Tracking <code className="font-mono text-foreground/80 select-all">{order.tracking_code}</code></span>
            <span aria-hidden="true" className="text-muted-foreground/50">·</span>
            {order.due_at ? (
              <span className={cn(isOverdue && 'font-medium text-amber-600 dark:text-amber-400')}>
                {isOverdue ? `Due ${formatDate(order.due_at)} · overdue` : `Due ${formatDate(order.due_at)}`}
              </span>
            ) : (
              <span>No due date</span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <OrderPrimaryAction orderId={order.id} status={order.status} />
          <Button variant="outline" render={<Link href={`/orders/${order.id}/slip`} />}>
            <Printer aria-hidden="true" />
            Print Slip
          </Button>
        </div>
      </header>

      {(isReady || (isOverdue && order.due_at)) && (
        <div className="mb-4 flex flex-col divide-y divide-border overflow-hidden rounded-lg border bg-card" role="status">
          {isReady && (
            <p className="tnum flex items-center gap-2.5 px-4 py-2.5 text-[13px]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" aria-hidden="true" />
              <span className="font-semibold">Ready for customer pickup</span>
              <span className="truncate text-xs text-muted-foreground">
                Tracking {order.tracking_code.slice(0, 12)}…
              </span>
            </p>
          )}
          {isOverdue && order.due_at && (
            <p className="tnum flex items-center gap-2.5 px-4 py-2.5 text-[13px]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
              <span className="font-semibold">Past due date — {formatDate(order.due_at)}</span>
              <span className="truncate text-xs text-muted-foreground">Prioritize this order.</span>
            </p>
          )}
        </div>
      )}

      {/* Workspace — one quiet surface on desktop, stacked sections on mobile.
          DOM order: workflow → items → details/actions → activity, so mobile
          reads identity → action → workflow → items → customer → activity. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-0 lg:overflow-hidden lg:rounded-lg lg:border lg:bg-card">
        {/* Main column: workflow + items */}
        <div className="min-w-0 divide-y divide-border overflow-hidden rounded-lg border bg-card lg:col-start-1 lg:row-start-1 lg:rounded-none lg:border-0">
          <section aria-labelledby="order-workflow" className="px-4 py-3.5">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 id="order-workflow" className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Workflow</h2>
              <p className="truncate text-xs text-muted-foreground">{STATUS_CONFIG[order.status]?.description ?? order.status}</p>
            </div>
            <OrderFlowStepper currentStatus={order.status} />
          </section>

          <section aria-labelledby="order-items" className="px-4 py-3.5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 id="order-items" className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Items · {order.items.length}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {order.status === 'RECEIVED'
                    ? 'Editable while order is received'
                    : 'Locked after processing starts'}
                </p>
              </div>
              <span className="tnum shrink-0 text-sm font-semibold">{formatMoney(order.total_cents)}</span>
            </div>
            {order.status === 'RECEIVED' ? (
              <OrderItemsEditor orderId={order.id} items={order.items} services={services} />
            ) : (
              <>
                <div className="overflow-x-auto rounded-md border">
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
                <div className="mt-3 flex items-baseline justify-between border-t pt-3">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="tnum text-[15px] font-semibold tracking-tight">{formatMoney(order.total_cents)}</p>
                </div>
              </>
            )}
          </section>
        </div>

        {/* Context column: details + secondary actions */}
        <aside className="divide-y divide-border overflow-hidden rounded-lg border bg-card lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:rounded-none lg:border-0 lg:border-l">
          <section aria-labelledby="order-details" className="px-4 py-3.5">
            <h2 id="order-details" className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Details</h2>
            <dl className="tnum mt-1 divide-y divide-border text-[13px]">
              <div className="flex items-center justify-between gap-2 py-2">
                <dt className="text-xs text-muted-foreground">Status</dt>
                <dd><StatusBadge status={order.status} size="sm" /></dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2">
                <dt className="text-xs text-muted-foreground">Customer</dt>
                <dd className="truncate font-medium">
                  <Link href={`/customers/${order.customer.id}`} className="rounded outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40">
                    {order.customer.full_name}
                  </Link>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2">
                <dt className="text-xs text-muted-foreground">Phone</dt>
                <dd>{order.customer.phone ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2">
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="truncate">{order.customer.email ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2">
                <dt className="text-xs text-muted-foreground">Source</dt>
                <dd>{order.source === 'WALK_IN' ? 'Walk-in' : 'Portal'}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2">
                <dt className="text-xs text-muted-foreground">Assigned to</dt>
                <dd className="truncate">{order.assigned_staff?.full_name ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2">
                <dt className="text-xs text-muted-foreground">Received</dt>
                <dd>{formatDateTime(order.received_at)}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2">
                <dt className="text-xs text-muted-foreground">Due</dt>
                <dd className={isOverdue ? 'font-medium text-amber-600 dark:text-amber-400' : ''}>
                  {order.due_at ? formatDateTime(order.due_at) : '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2">
                <dt className="text-xs text-muted-foreground">Paid at</dt>
                <dd>{order.paid_at ? formatDateTime(order.paid_at) : '—'}</dd>
              </div>
              {order.completed_at && (
                <div className="flex items-center justify-between gap-2 py-2">
                  <dt className="text-xs text-muted-foreground">Completed</dt>
                  <dd>{formatDateTime(order.completed_at)}</dd>
                </div>
              )}
            </dl>
            <div className="mt-3 flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-2.5 py-1.5">
              <span className="text-xs text-muted-foreground">Tracking</span>
              <code className="truncate font-mono text-xs select-all">{order.tracking_code}</code>
            </div>
            {order.notes && (
              <p className="mt-3 text-[13px] text-muted-foreground">
                <span className="font-medium text-foreground">Notes: </span>{order.notes}
              </p>
            )}
            {order.cancel_reason && (
              <p className="mt-3 text-[13px]">
                <span className="font-medium text-muted-foreground">Cancelled: </span>
                <span className="text-foreground">{order.cancel_reason}</span>
              </p>
            )}
          </section>

          <section aria-labelledby="order-actions" className="px-4 py-3.5">
            <h2 id="order-actions" className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Actions</h2>
            <p className="mt-0.5 mb-3 text-xs text-muted-foreground">Advance, move back, or cancel</p>
            <OrderActions orderId={order.id} status={order.status} />
          </section>
        </aside>

        {/* Activity */}
        <section aria-labelledby="order-activity" className="overflow-hidden rounded-lg border bg-card px-4 py-3.5 lg:col-start-1 lg:row-start-2 lg:rounded-none lg:border-0 lg:border-t">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 id="order-activity" className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Activity</h2>
            <p className="tnum text-xs text-muted-foreground">{order.events.length} transition{order.events.length === 1 ? '' : 's'}</p>
          </div>
          {order.events.length === 0 ? (
            <p className="py-3 text-center text-[13px] text-muted-foreground">No transitions recorded yet.</p>
          ) : (
            <ol className="space-y-4">
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
                      <p className="truncate text-[13px]">
                        {event.from_status ? (
                          <span className="text-muted-foreground">{STATUS_CONFIG[event.from_status]?.label ?? event.from_status} → </span>
                        ) : null}
                        <span className="font-semibold">{STATUS_CONFIG[event.to_status]?.label ?? event.to_status}</span>
                      </p>
                      <time className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(event.created_at)}</time>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">by {event.actor_name}</p>
                    {event.note && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground italic">&ldquo;{event.note}&rdquo;</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  )
}
