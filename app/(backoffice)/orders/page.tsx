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
import { formatMoney } from '@/lib/money'
import { formatDate, formatDateTime } from '@/lib/time'
import { Plus, ClipboardList, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { OrdersFilter } from './orders-filter'

function buildPageHref(
  page: number,
  params: { search?: string; status?: string }
) {
  const qs = new URLSearchParams()
  if (page > 1) qs.set('page', String(page))
  if (params.status && params.status !== 'ALL') qs.set('status', params.status)
  if (params.search) qs.set('search', params.search)
  const s = qs.toString()
  return s ? `/orders?${s}` : '/orders'
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const result = await getOrders({
    search: params.search,
    status: params.status,
    page,
  })

  if (!result) {
    return <EmptyState title="Access Denied" description="You do not have permission to view orders." />
  }

  const { orders, total, page: currentPage, pageSize } = result
  const totalPages = Math.ceil(total / pageSize)
  const hasFilters = Boolean(params.search || (params.status && params.status !== 'ALL'))

  return (
    <>
      <PageHeader
        title="Orders"
        description={
          hasFilters
            ? `${total} matching order${total === 1 ? '' : 's'}`
            : `${total} total order${total === 1 ? '' : 's'} · received → washing → ready → pickup`
        }
      >
        <Button render={<Link href="/orders/new" />}>
          <Plus aria-hidden="true" />
          New Order
        </Button>
      </PageHeader>

      {/* Remounted via key when URL filters change (e.g. dashboard pipeline links) */}
      <OrdersFilter
        key={`${params.search ?? ''}|${params.status ?? 'ALL'}`}
        currentSearch={params.search}
        currentStatus={params.status}
      />

      {orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={hasFilters ? 'No matching orders' : 'No orders yet'}
          description={
            hasFilters
              ? 'No orders match this search or status. Try adjusting your filters.'
              : 'Create your first order to start the flow: received → washing → ready → pickup.'
          }
          actionLabel={hasFilters ? undefined : 'Create Order'}
          actionHref={hasFilters ? undefined : '/orders/new'}
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden gap-0 overflow-hidden py-0 md:block">
            <CardContent className="p-0">
              <Table aria-label="Orders">
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="pl-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Order</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Customer</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Received / Due</TableHead>
                    <TableHead className="pr-4 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(order => (
                    <TableRow key={order.id} className="hover:bg-muted/40">
                      <TableCell className="pl-4">
                        <Link href={`/orders/${order.id}`} className="text-sm font-semibold text-primary hover:underline">
                          {order.order_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{order.customer.full_name}</p>
                        {order.customer.phone && (
                          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{order.customer.phone}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} size="sm" />
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium tabular-nums">{formatMoney(order.total_cents)}</TableCell>
                      <TableCell>
                        <span className="block text-sm" title={formatDateTime(order.received_at)}>
                          {formatDate(order.received_at)}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {order.due_at ? `Due ${formatDate(order.due_at)}` : 'No due date'}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button variant="ghost" size="sm" render={<Link href={`/orders/${order.id}`} aria-label={`View order ${order.order_number}`} />}>
                          View
                          <ArrowRight aria-hidden="true" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile compact list */}
          <ul className="space-y-2 md:hidden">
            {orders.map(order => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="block rounded-lg border bg-card p-3.5 transition-colors hover:bg-muted/40 motion-reduce:transition-none"
                  aria-label={`View order ${order.order_number}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-primary">{order.order_number}</span>
                    <StatusBadge status={order.status} size="sm" />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{order.customer.full_name}</span>
                    <span className="shrink-0 font-semibold tabular-nums">{formatMoney(order.total_cents)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="truncate">Received {formatDate(order.received_at)}</span>
                    <span className="shrink-0">{order.due_at ? `Due ${formatDate(order.due_at)}` : 'No due date'}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Orders pagination">
              {currentPage > 1 && (
                <Button variant="outline" size="sm" render={<Link href={buildPageHref(currentPage - 1, params)} aria-label="Previous page" />}>
                  <ChevronLeft aria-hidden="true" />
                  Previous
                </Button>
              )}
              <span className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
                Page {currentPage} of {totalPages} · {total} orders
              </span>
              {currentPage < totalPages && (
                <Button variant="outline" size="sm" render={<Link href={buildPageHref(currentPage + 1, params)} aria-label="Next page" />}>
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
