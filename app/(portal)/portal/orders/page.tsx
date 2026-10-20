import Link from 'next/link'
import { getCustomerOrders } from '@/lib/data/orders'
import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { ClaimOrderDialog } from '@/components/app/claim-order-dialog'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/money'
import { formatDate, formatDateTime } from '@/lib/time'
import { ChevronLeft, ChevronRight, ClipboardList, Plus } from 'lucide-react'
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
      <>
        <PageHeader title="My Orders" description="Manage and track your laundry orders." />
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center bg-card">
          <ClipboardList className="h-8 w-8 text-muted-foreground/60 mb-2" />
          <h3 className="text-sm font-semibold text-foreground">No customer record linked yet</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            If you placed an order at the counter, enter your tracking code from your receipt slip to
            claim it and link your customer profile.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            <Button render={<Link href="/portal/orders/new" />}>
              <Plus className="h-4 w-4 mr-1" />
              Book Laundry Online
            </Button>
            <ClaimOrderDialog triggerText="Claim with Tracking Code" variant="outline" />
          </div>
        </div>
      </>
    )
  }

  const { orders, total, page, pageSize } = result
  const totalPages = Math.ceil(total / pageSize)

  // Presentation-only grouping (newest-first preserved within each group).
  const activeOrders = orders.filter(o => !PAST_STATUSES.has(o.status))
  const pastOrders = orders.filter(o => PAST_STATUSES.has(o.status))

  function OrderRow({ order }: { order: (typeof orders)[number] }) {
    const isReady = order.status === 'READY'
    return (
      <li key={order.id}>
        <Link
          href={`/portal/orders/${order.id}`}
          aria-label={`Order ${order.order_number}, ${order.status}, ${formatMoney(order.total_cents)}`}
          className="tnum flex min-h-[60px] items-center gap-3 px-4 py-3 outline-none transition-colors duration-100 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 motion-reduce:transition-none"
        >
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-xs font-medium">
              <span className="truncate">{order.order_number}</span>
              {isReady && (
                <span className="inline-flex shrink-0 items-center gap-1 font-sans text-[11px] font-medium text-green-600 dark:text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
                  Ready for pickup
                </span>
              )}
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              Received {formatDateTime(order.received_at)}{order.due_at ? ` · Due ${formatDate(order.due_at)}` : ''}
            </span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-[13px] font-semibold">{formatMoney(order.total_cents)}</span>
            <StatusBadge status={order.status as OrderStatus} size="sm" />
          </span>
        </Link>
      </li>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <PageHeader
          title="My Orders"
          description={total === 0 ? 'Your laundry orders will appear here' : `${total} order${total === 1 ? '' : 's'} · newest first`}
        />
        <div className="shrink-0 flex items-center gap-2">
          <Button render={<Link href="/portal/orders/new" />} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Book Laundry
          </Button>
          <ClaimOrderDialog />
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-12 text-center bg-card shadow-xs">
          <div className="rounded-full bg-primary/10 p-3 text-primary mb-3">
            <ClipboardList className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No orders found</h3>
          <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
            When you drop off laundry at the shop, your orders will appear here. Or claim an existing
            order using your receipt slip.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <Button render={<Link href="/portal/orders/new" />}>
              <Plus className="h-4 w-4 mr-1" />
              Book Laundry Online
            </Button>
            <ClaimOrderDialog triggerText="Claim an Order with Tracking Code" variant="outline" />
          </div>
        </div>
      ) : (
        <>
          {activeOrders.length > 0 && (
            <section aria-label="Active orders" className="mt-6">
              <div className="mb-2.5 flex items-baseline justify-between">
                <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Active Orders ({activeOrders.length})
                </h2>
              </div>
              <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs" aria-label="Active orders">
                {activeOrders.map(order => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </ul>
            </section>
          )}
          {pastOrders.length > 0 && (
            <section aria-label="Past orders" className="mt-6">
              <div className="mb-2.5 flex items-baseline justify-between">
                <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Past Orders ({pastOrders.length})
                </h2>
              </div>
              <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs" aria-label="Past orders">
                {pastOrders.map(order => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </ul>
            </section>
          )}
          {totalPages > 1 && (
            <nav className="mt-4 flex items-center justify-center gap-1" aria-label="Orders pagination">
              {page > 1 && (
                <Button variant="ghost" size="sm" className="text-muted-foreground" render={<Link href={`/portal/orders?page=${page - 1}`} aria-label={`Go to page ${page - 1}`} />}>
                  <ChevronLeft aria-hidden="true" />
                  Prev
                </Button>
              )}
              <span className="tnum px-2 text-xs text-muted-foreground" aria-live="polite">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Button variant="ghost" size="sm" className="text-muted-foreground" render={<Link href={`/portal/orders?page=${page + 1}`} aria-label={`Go to page ${page + 1}`} />}>
                  Next
                  <ChevronRight aria-hidden="true" />
                </Button>
              )}
            </nav>
          )}
        </>
      )}
    </>
  )
}
