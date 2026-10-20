import Link from 'next/link'
import { getActor } from '@/lib/auth'
import { getOrderById } from '@/lib/data/orders'
import { getActiveServices } from '@/lib/data/services'
import { getShopName } from '@/lib/settings'
import { StatusBadge, STATUS_DOT_CLASS } from '@/components/app/status-badge'
import { EmptyState } from '@/components/app/empty-state'
import { OrderFlowStepper } from '@/components/app/order-flow-stepper'
import { OrderActions } from '@/components/app/order-actions'
import { OrderPrimaryAction } from '@/components/app/order-primary-action'
import { OrderItemsEditor } from '@/components/app/order-items-editor'
import { ReadyCustomerNotifier } from '@/components/app/ready-customer-notifier'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatMoney } from '@/lib/money'
import { formatDateTime, formatDate } from '@/lib/time'
import { Printer, QrCode } from 'lucide-react'
import { STATUS_CONFIG } from '@/lib/order-machine'
import { cn } from 'cn'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const [order, actor] = await Promise.all([
    getOrderById(orderId),
    getActor(),
  ])

  if (!order) {
    return <EmptyState title="Order not found" description="This order does not exist or you do not have access." />
  }

  const isAdmin = actor?.role === 'ADMIN'
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
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/orders" className="rounded-md outline-none transition-colors hover:text-foreground">
          Orders
        </Link>
        <span aria-hidden="true" className="text-muted-foreground/40">/</span>
        <span className="font-mono font-medium text-foreground" aria-current="page">{order.order_number}</span>
      </nav>

      {/* Identity header */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b pb-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground">{order.order_number}</h1>
            <StatusBadge status={order.status} size="md" />
          </div>
          <p className="mt-1.5 truncate text-sm text-muted-foreground">
            Customer:{' '}
            <Link
              href={`/customers/${order.customer.id}`}
              className="font-semibold text-foreground hover:underline"
            >
              {order.customer.full_name}
            </Link>
            <span aria-hidden="true" className="mx-1.5 text-muted-foreground/40">·</span>
            <span className="font-medium">{order.source === 'WALK_IN' ? 'Walk-in Intake' : 'Portal Order'}</span>
          </p>
          <div className="tnum mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span>Tracking Code: <code className="font-mono font-semibold text-foreground px-1 py-0.5 rounded bg-muted select-all">{order.tracking_code}</code></span>
            <span aria-hidden="true" className="text-muted-foreground/40">·</span>
            {order.due_at ? (
              <span className={cn('font-medium', isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground')}>
                {isOverdue ? `Due ${formatDate(order.due_at)} (Overdue)` : `Estimated Due: ${formatDate(order.due_at)}`}
              </span>
            ) : (
              <span>No due date</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <OrderPrimaryAction orderId={order.id} status={order.status} totalCents={order.total_cents} />
          <Button variant="outline" render={<Link href={`/orders/${order.id}/slip`} />} className="gap-1.5 text-xs font-medium">
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            Print Slip
          </Button>
        </div>
      </header>

      {order.source === 'PORTAL' && order.status === 'RECEIVED' && (
        <div className="mb-6 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                <QrCode className="h-4 w-4" /> Customer Online Drop-off Intake
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This order was booked online. When the customer hands over their clothes at the counter, verify the weight/items below, then click <strong>Start Washing</strong> to start processing and notify the customer.
              </p>
            </div>
            <div className="shrink-0">
              <OrderPrimaryAction orderId={order.id} status={order.status} totalCents={order.total_cents} />
            </div>
          </div>
        </div>
      )}

      {isReady && (
        <div className="mb-6">
          <ReadyCustomerNotifier
            customerName={order.customer.full_name}
            phone={order.customer.phone}
            orderNumber={order.order_number}
            trackingCode={order.tracking_code}
            totalCents={order.total_cents}
            shopName={getShopName()}
          />
        </div>
      )}

      {isOverdue && order.due_at && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-400" role="status">
          <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500 ring-2 ring-rose-500/30" aria-hidden="true" />
          <span className="font-semibold">Past Due Date — {formatDate(order.due_at)}</span>
          <span className="text-xs text-rose-600/80 dark:text-rose-400/80">Please prioritize finishing this order for customer pickup.</span>
        </div>
      )}

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column: workflow + items */}
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="order-workflow" className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
            <div className="mb-4 flex items-baseline justify-between gap-2">
              <h2 id="order-workflow" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Station Progress</h2>
              <p className="truncate text-xs font-medium text-foreground">{STATUS_CONFIG[order.status]?.description ?? order.status}</p>
            </div>
            <OrderFlowStepper currentStatus={order.status} />
          </section>

          <section aria-labelledby="order-items" className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 id="order-items" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Service Items ({order.items.length})
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {order.status === 'RECEIVED'
                    ? 'Editable while order is in Received stage'
                    : 'Locked after wash cycle begins'}
                </p>
              </div>
              <span className="tnum text-base font-bold text-foreground">{formatMoney(order.total_cents)}</span>
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

          {/* Activity Section */}
          <section aria-labelledby="order-activity" className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
            <div className="mb-4 flex items-baseline justify-between gap-2">
              <h2 id="order-activity" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Transition History</h2>
              <p className="tnum text-xs text-muted-foreground">{order.events.length} event{order.events.length === 1 ? '' : 's'}</p>
            </div>
            {order.events.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">No transitions recorded yet.</p>
            ) : (
              <ol className="space-y-4">
                {order.events.map((event, i) => (
                  <li key={event.id} className="flex gap-3.5">
                    <div className="flex flex-col items-center" aria-hidden="true">
                      <span className={cn(
                        'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-current/20',
                        i === order.events.length - 1 ? STATUS_DOT_CLASS[event.to_status] ?? 'bg-foreground' : 'bg-muted-foreground/30'
                      )} />
                      {i < order.events.length - 1 && (
                        <span className="mt-1 w-px flex-1 bg-border/80" />
                      )}
                    </div>
                    <div className="tnum min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-sm">
                          {event.from_status ? (
                            <span className="text-muted-foreground text-xs">{STATUS_CONFIG[event.from_status]?.label ?? event.from_status} → </span>
                          ) : null}
                          <span className="font-semibold text-foreground">{STATUS_CONFIG[event.to_status]?.label ?? event.to_status}</span>
                        </p>
                        <time className="shrink-0 text-xs text-muted-foreground">{formatDateTime(event.created_at)}</time>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">Recorded by {event.actor_name}</p>
                      {event.note && (
                        <p className="mt-1 rounded-md bg-muted/60 px-2.5 py-1 text-xs text-foreground italic">&ldquo;{event.note}&rdquo;</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* Sidebar Column: details + actions */}
        <aside className="space-y-6">
          <section aria-labelledby="order-details" className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
            <h2 id="order-details" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">Order Details</h2>
            <dl className="tnum divide-y divide-border/60 text-xs sm:text-[13px]">
              <div className="flex items-center justify-between gap-2 py-2.5 first:pt-0">
                <dt className="text-xs text-muted-foreground">Current Status</dt>
                <dd><StatusBadge status={order.status} size="sm" /></dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2.5">
                <dt className="text-xs text-muted-foreground">Customer</dt>
                <dd className="truncate font-semibold">
                  <Link href={`/customers/${order.customer.id}`} className="hover:underline">
                    {order.customer.full_name}
                  </Link>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2.5">
                <dt className="text-xs text-muted-foreground">Phone</dt>
                <dd className="font-mono">{order.customer.phone ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2.5">
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="truncate text-muted-foreground">{order.customer.email ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2.5">
                <dt className="text-xs text-muted-foreground">Source</dt>
                <dd className="font-medium">{order.source === 'WALK_IN' ? 'Walk-in' : 'Portal'}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2.5">
                <dt className="text-xs text-muted-foreground">Assigned Staff</dt>
                <dd className="truncate font-medium">{order.assigned_staff?.full_name ?? 'Unassigned'}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2.5">
                <dt className="text-xs text-muted-foreground">Intake Date</dt>
                <dd>{formatDateTime(order.received_at)}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2.5">
                <dt className="text-xs text-muted-foreground">Target Due</dt>
                <dd className={isOverdue ? 'font-bold text-rose-600 dark:text-rose-400' : ''}>
                  {order.due_at ? formatDateTime(order.due_at) : '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2.5">
                <dt className="text-xs text-muted-foreground">Payment Method</dt>
                <dd className="font-semibold text-foreground">{order.payment_method ?? 'Unpaid'}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2.5">
                <dt className="text-xs text-muted-foreground">Paid At</dt>
                <dd>{order.paid_at ? formatDateTime(order.paid_at) : '—'}</dd>
              </div>
              {order.completed_at && (
                <div className="flex items-center justify-between gap-2 py-2.5 last:pb-0">
                  <dt className="text-xs text-muted-foreground">Completed At</dt>
                  <dd>{formatDateTime(order.completed_at)}</dd>
                </div>
              )}
            </dl>
            <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border bg-muted/40 p-3">
              <span className="text-xs text-muted-foreground">Tracking Code</span>
              <code className="font-mono text-xs font-bold text-foreground select-all">{order.tracking_code}</code>
            </div>
            {order.notes && (
              <div className="mt-3.5 rounded-xl border border-muted bg-muted/20 p-3 text-xs">
                <span className="font-semibold text-foreground block mb-0.5">Special Instructions:</span>
                <span className="text-muted-foreground">{order.notes}</span>
              </div>
            )}
            {order.cancel_reason && (
              <div className="mt-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs">
                <span className="font-semibold text-rose-700 dark:text-rose-400 block mb-0.5">Cancellation Reason:</span>
                <span className="text-rose-600 dark:text-rose-300">{order.cancel_reason}</span>
              </div>
            )}
          </section>

          <section aria-labelledby="order-actions" className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
            <h2 id="order-actions" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-1">Station Actions</h2>
            <p className="mb-4 text-xs text-muted-foreground">Advance stage, move back, or cancel order</p>
            <OrderActions
              orderId={order.id}
              status={order.status}
              totalCents={order.total_cents}
              isAdmin={isAdmin}
            />
          </section>
        </aside>
      </div>
    </>
  )
}
