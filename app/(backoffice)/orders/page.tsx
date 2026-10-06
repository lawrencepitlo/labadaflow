import Link from 'next/link'
import { getOrders } from '@/lib/data/orders'
import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { EmptyState } from '@/components/app/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatMoney } from '@/lib/money'
import { formatDateTime } from '@/lib/time'
import { Plus, ClipboardList, ChevronLeft, ChevronRight, Globe, User } from 'lucide-react'
import { OrdersFilter } from './orders-filter'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}) {
  const params = await searchParams
  const result = await getOrders({
    search: params.search,
    status: params.status,
    page: params.page ? Number(params.page) : 1,
  })

  if (!result) {
    return <EmptyState title="Access Denied" description="You do not have permission to view orders." />
  }

  const { orders, total, page, pageSize } = result
  const totalPages = Math.ceil(total / pageSize)

  const sourceBadge = (source: 'WALK_IN' | 'PORTAL') => (
    <Badge variant="outline" className="text-xs gap-1">
      {source === 'PORTAL' ? <Globe className="w-3 h-3" /> : <User className="w-3 h-3" />}
      {source === 'PORTAL' ? 'Portal' : 'Walk-in'}
    </Badge>
  )

  return (
    <>
      <PageHeader title="Orders" description={`${total} total orders`}>
        <Button render={<Link href="/orders/new" />}>
          <Plus className="w-4 h-4 mr-1.5" />
          New Order
        </Button>
      </PageHeader>

      {/* Filters */}
      <OrdersFilter
        currentSearch={params.search}
        currentStatus={params.status}
      />

      {/* Orders Table */}
      {orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders found"
          description={params.search || params.status ? 'Try adjusting your filters.' : 'Create your first order to get started.'}
          actionLabel={!params.search && !params.status ? 'Create Order' : undefined}
          actionHref={!params.search && !params.status ? '/orders/new' : undefined}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-muted/30">
                    <TableHead className="font-semibold pl-6">Order #</TableHead>
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold">Source</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Total</TableHead>
                    <TableHead className="font-semibold pr-6">Received</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(order => (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-accent/30 transition-colors">
                      <TableCell className="pl-6">
                        <Link href={`/orders/${order.id}`} className="font-semibold text-primary hover:underline">
                          {order.order_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer.full_name}</p>
                          {order.customer.phone && (
                            <p className="text-xs text-muted-foreground">{order.customer.phone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {sourceBadge(order.source)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} size="sm" />
                      </TableCell>
                      <TableCell className="font-semibold text-right">{formatMoney(order.total_cents)}</TableCell>
                      <TableCell className="pr-6 text-muted-foreground text-sm">{formatDateTime(order.received_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {orders.map(order => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="hover:bg-accent/50 hover:shadow-sm transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-primary">{order.order_number}</span>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{order.customer.full_name}</span>
                      <span className="font-semibold">{formatMoney(order.total_cents)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {sourceBadge(order.source)}
                      <span>{formatDateTime(order.received_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              {page > 1 && (
                <Button variant="outline" size="sm" render={<Link href={`/orders?page=${page - 1}${params.status ? `&status=${params.status}` : ''}${params.search ? `&search=${params.search}` : ''}`} />}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
              )}
              <span className="text-sm text-muted-foreground font-medium">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Button variant="outline" size="sm" render={<Link href={`/orders?page=${page + 1}${params.status ? `&status=${params.status}` : ''}${params.search ? `&search=${params.search}` : ''}`} />}>
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
