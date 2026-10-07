import Link from 'next/link'
import { getCustomerOrders } from '@/lib/data/orders'
import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { EmptyState } from '@/components/app/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/money'
import { formatDate, formatDateTime } from '@/lib/time'
import { ChevronLeft, ChevronRight, ClipboardList, BellRing } from 'lucide-react'
import { cn } from 'cn'
import type { OrderStatus } from '@/lib/order-machine'

function parsePage(raw?: string): number {
  const n = raw ? Number.parseInt(raw, 10) : 1
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(n, 1000)
}

export default async function PortalOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const result = await getCustomerOrders({ page: parsePage(params.page) })

  if (!result) {
    return (
      <EmptyState
        title="No customer record linked"
        description="Your account is not linked to a customer record yet. Please contact the shop."
      />
    )
  }

  const { orders, total, page, pageSize } = result
  const totalPages = Math.ceil(total / pageSize)

  return (
    <>
      <PageHeader
        title="My Orders"
        description={total === 0 ? 'Your laundry orders will appear here' : `${total} order${total === 1 ? '' : 's'} · newest first`}
      />
      {orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          description="When you drop off laundry at the shop, your orders will appear here with live status."
        />
      ) : (
        <>
          <ul className="space-y-3" aria-label="My orders">
            {orders.map(order => {
              const isReady = order.status === 'READY'
              return (
                <li key={order.id}>
                  <Link
                    href={`/portal/orders/${order.id}`}
                    aria-label={`Order ${order.order_number}, ${order.status}, ${formatMoney(order.total_cents)}`}
                  >
                    <Card
                      className={cn(
                        'transition-colors hover:bg-accent/50 motion-reduce:transition-none',
                        isReady && 'border-green-500/30 bg-green-500/[0.04]'
                      )}
                    >
                      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="font-semibold">{order.order_number}</p>
                            {isReady && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-300">
                                <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
                                Ready for pickup
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Received {formatDateTime(order.received_at)}{order.due_at ? ` · Due ${formatDate(order.due_at)}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <span className="font-semibold tabular-nums">{formatMoney(order.total_cents)}</span>
                          <StatusBadge status={order.status as OrderStatus} size="sm" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              )
            })}
          </ul>
          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-3 mt-8" aria-label="Orders pagination">
              {page > 1 && (
                <Button variant="outline" size="sm" render={<Link href={`/portal/orders?page=${page - 1}`} aria-label={`Go to page ${page - 1}`} />}>
                  <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" />
                  Previous
                </Button>
              )}
              <span className="text-sm text-muted-foreground font-medium" aria-live="polite">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Button variant="outline" size="sm" render={<Link href={`/portal/orders?page=${page + 1}`} aria-label={`Go to page ${page + 1}`} />}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
                </Button>
              )}
            </nav>
          )}
        </>
      )}
    </>
  )
}
