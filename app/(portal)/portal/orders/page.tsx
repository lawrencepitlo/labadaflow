import Link from 'next/link'
import { getCustomerOrders } from '@/lib/data/orders'
import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { EmptyState } from '@/components/app/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/money'
import { formatDateTime } from '@/lib/time'
import { ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react'
import type { OrderStatus } from '@/lib/order-machine'

export default async function PortalOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const result = await getCustomerOrders({ page: params.page ? Number(params.page) : 1 })

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
      <PageHeader title="My Orders" description={`${total} orders`} />
      {orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          description="Your laundry orders will appear here."
        />
      ) : (
        <>
          <div className="space-y-3">
            {orders.map(order => (
              <Link key={order.id} href={`/portal/orders/${order.id}`}>
                <Card className="hover:bg-accent/50 hover:shadow-sm transition-all border-2">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(order.received_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatMoney(order.total_cents)}</span>
                      <StatusBadge status={order.status as OrderStatus} size="sm" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              {page > 1 && (
                <Button variant="outline" size="sm" render={<Link href={`/portal/orders?page=${page - 1}`} />}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
              )}
              <span className="text-sm text-muted-foreground font-medium">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Button variant="outline" size="sm" render={<Link href={`/portal/orders?page=${page + 1}`} />}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}
