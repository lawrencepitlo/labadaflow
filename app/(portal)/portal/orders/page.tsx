import Link from 'next/link'
import { getCustomerOrders } from '@/lib/data/orders'
import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { ClaimOrderDialog } from '@/components/app/claim-order-dialog'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/money'
import { formatDate, formatDateTime } from '@/lib/time'
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  QrCode,
  ArrowRight,
  Sparkles,
  ShoppingBag,
} from 'lucide-react'
import type { OrderStatus } from '@/lib/order-machine'

function parsePage(raw?: string): number {
  const n = raw ? Number.parseInt(raw, 10) : 1
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(n, 1000)
}

const PAST_STATUSES = new Set(['COMPLETED', 'CANCELLED'])

export default async function PortalOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const result = await getCustomerOrders({ page: parsePage(params.page) })

  if (!result) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Orders" description="Track your laundry orders from drop-off to pickup." />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-10 text-center bg-card shadow-xs">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary mb-3">
            <ClipboardList className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">No customer record linked yet</h3>
          <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
            If you placed an order at the counter, enter the tracking code from your receipt slip to
            claim it, or show your Walk-in Pass on your next visit!
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <ClaimOrderDialog triggerText="Claim Slip with Tracking Code" variant="default" />
            <Button variant="outline" render={<Link href="/portal/pass" />}>
              <QrCode className="h-4 w-4 mr-1.5 text-primary" />
              View Walk-in Pass
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const { orders, total, page, pageSize } = result
  const totalPages = Math.ceil(total / pageSize)

  const activeOrders = orders.filter(o => !PAST_STATUSES.has(o.status))
  const pastOrders = orders.filter(o => PAST_STATUSES.has(o.status))

  function OrderRow({ order }: { order: (typeof orders)[number] }) {
    const isReady = order.status === 'READY'
    return (
      <li key={order.id}>
        <Link
          href={`/portal/orders/${order.id}`}
          aria-label={`Order ${order.order_number}, ${order.status}, ${formatMoney(order.total_cents)}`}
          className="group flex min-h-[68px] items-center gap-3 px-5 py-4 outline-none transition-colors duration-100 hover:bg-slate-50 dark:hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="font-mono text-xs font-bold text-foreground">
                {order.order_number}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                {order.tracking_code}
              </span>
              {isReady && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  <ShoppingBag className="h-3 w-3" />
                  Ready for pickup!
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              Counter Intake: {formatDateTime(order.received_at)}
              {order.due_at ? ` · Target: ${formatDate(order.due_at)}` : ''}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-4">
            <span className="font-mono text-sm font-bold text-foreground">
              {formatMoney(order.total_cents)}
            </span>
            <StatusBadge status={order.status as OrderStatus} size="sm" />
            <ArrowRight className="hidden sm:block h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
          </div>
        </Link>
      </li>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="My Laundry Orders"
          description={total === 0 ? 'Your counter drop-offs will appear here' : `${total} total order${total === 1 ? '' : 's'}`}
        />
        <div className="shrink-0 flex items-center gap-2.5">
          <Button variant="outline" size="sm" render={<Link href="/portal/pass" />}>
            <QrCode className="h-4 w-4 mr-1.5 text-primary" />
            My Walk-in Pass
          </Button>
          <ClaimOrderDialog triggerText="Claim Slip" />
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 p-12 text-center bg-card shadow-xs">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary mb-3">
            <ClipboardList className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">No active orders found</h3>
          <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
            Drop off your laundry at our counter anytime. Show your Walk-in Pass for express intake,
            or claim a paper slip using your tracking code.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Button render={<Link href="/portal/pass" />}>
              <QrCode className="h-4 w-4 mr-1.5" />
              Show Walk-in Pass
            </Button>
            <ClaimOrderDialog triggerText="Claim Paper Slip Order" variant="outline" />
          </div>
        </div>
      ) : (
        <>
          {activeOrders.length > 0 && (
            <section aria-label="Active orders" className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Active In-Progress ({activeOrders.length})
                </h2>
              </div>
              <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-slate-200/90 bg-card shadow-xs dark:border-border" aria-label="Active orders">
                {activeOrders.map(order => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </ul>
            </section>
          )}

          {pastOrders.length > 0 && (
            <section aria-label="Past orders" className="mt-8 space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Order History ({pastOrders.length})
                </h2>
              </div>
              <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-slate-200/90 bg-card shadow-xs dark:border-border" aria-label="Past orders">
                {pastOrders.map(order => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </ul>
            </section>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <Button variant="outline" size="sm" render={<Link href={`/portal/orders?page=${page - 1}`} />}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                )}
                {page < totalPages && (
                  <Button variant="outline" size="sm" render={<Link href={`/portal/orders?page=${page + 1}`} />}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
