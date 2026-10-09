import Link from 'next/link'
import { getOrders } from '@/lib/data/orders'
import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { EmptyState } from '@/components/app/empty-state'
import { Button } from '@/components/ui/button'
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
import { Plus, ClipboardList, SearchX, ChevronLeft, ChevronRight } from 'lucide-react'
import { OrdersFilter } from './orders-filter'
import { cn } from 'cn'

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

function isOverdue(order: { due_at: string | null; status: string }, now: number): boolean {
  return (
    order.due_at != null &&
    !['COMPLETED', 'CANCELLED'].includes(order.status) &&
    new Date(order.due_at).getTime() < now
  )
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
  // eslint-disable-next-line react-hooks/purity -- server component: evaluated once per request, not a client re-render
  const now = Date.now()

  return (
    <>
      <PageHeader
        title="Orders"
        description={
          hasFilters
            ? `${total} matching order${total === 1 ? '' : 's'}`
            : 'Manage every load moving through the laundry.'
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
        <div className="overflow-hidden rounded-lg border bg-card">
          <EmptyState
            icon={hasFilters ? SearchX : ClipboardList}
            title={hasFilters ? 'No matching orders' : 'No orders yet'}
            description={
              hasFilters
                ? 'No orders match this search or status. Try adjusting your filters.'
                : 'Create your first order to start the flow: received → washing → ready → pickup.'
            }
            actionLabel={hasFilters ? undefined : 'Create Order'}
            actionHref={hasFilters ? undefined : '/orders/new'}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          {/* Desktop — Linear-style issue rows */}
          <div className="hidden md:block">
            <Table aria-label="Orders">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-8 pl-4 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Order</TableHead>
                  <TableHead className="h-8 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Customer</TableHead>
                  <TableHead className="h-8 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Status</TableHead>
                  <TableHead className="h-8 text-right text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Total</TableHead>
                  <TableHead className="h-8 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Received / Due</TableHead>
                  <TableHead className="h-8 w-10 pr-3">
                    <span className="sr-only">Open</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => {
                  const overdue = isOverdue(order, now)
                  return (
                    <TableRow
                      key={order.id}
                      className="group h-12 transition-colors duration-100 hover:bg-muted/40 focus-within:bg-muted/40"
                    >
                      <TableCell className="pl-4">
                        <Link
                          href={`/orders/${order.id}`}
                          className="rounded font-mono text-xs font-medium text-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
                        >
                          {order.order_number}
                        </Link>
                        <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground/70">
                          {order.tracking_code}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[12rem] truncate text-[13px] font-medium">{order.customer.full_name}</p>
                        {order.customer.phone && (
                          <p className="tnum mt-0.5 text-xs text-muted-foreground">{order.customer.phone}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} size="sm" />
                      </TableCell>
                      <TableCell className="tnum text-right text-[13px] font-medium">{formatMoney(order.total_cents)}</TableCell>
                      <TableCell>
                        <span className="tnum block text-[13px]" title={formatDateTime(order.received_at)}>
                          {formatDate(order.received_at)}
                        </span>
                        {order.due_at ? (
                          <span
                            className={cn(
                              'tnum mt-0.5 block text-xs',
                              overdue ? 'font-medium text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                            )}
                          >
                            {overdue ? `Due ${formatDate(order.due_at)} · overdue` : `Due ${formatDate(order.due_at)}`}
                          </span>
                        ) : (
                          <span className="mt-0.5 block text-xs text-muted-foreground/70">No due date</span>
                        )}
                      </TableCell>
                      <TableCell className="pr-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground/50 transition-colors duration-100 group-hover:text-foreground"
                          render={<Link href={`/orders/${order.id}`} aria-label={`Open order ${order.order_number}`} />}
                        >
                          <ChevronRight aria-hidden="true" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile — same list, stacked rows */}
          <ul className="divide-y divide-border md:hidden" aria-label="Orders">
            {orders.map(order => {
              const overdue = isOverdue(order, now)
              return (
                <li key={order.id}>
                  <Link
                    href={`/orders/${order.id}`}
                    className="block px-4 py-3 outline-none transition-colors duration-100 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 motion-reduce:transition-none"
                    aria-label={`Open order ${order.order_number}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-medium">
                        {order.order_number}
                        <span className="ml-1.5 text-[11px] font-normal text-muted-foreground/70">
                          {order.tracking_code}
                        </span>
                      </span>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-[13px]">
                      <span className="truncate font-medium">{order.customer.full_name}</span>
                      <span className="tnum shrink-0 font-semibold">{formatMoney(order.total_cents)}</span>
                    </div>
                    <div className="tnum mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="truncate">Received {formatDate(order.received_at)}</span>
                      {order.due_at ? (
                        <span className={cn('shrink-0', overdue && 'font-medium text-amber-600 dark:text-amber-400')}>
                          {overdue ? `Overdue · Due ${formatDate(order.due_at)}` : `Due ${formatDate(order.due_at)}`}
                        </span>
                      ) : (
                        <span className="shrink-0 text-muted-foreground/70">No due date</span>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* List footer — count + pagination */}
          <div className="flex items-center justify-between gap-2 border-t bg-muted/20 px-3 py-2">
            <p className="tnum px-1 text-xs text-muted-foreground" aria-live="polite">
              {totalPages > 1 ? (
                <>Page {currentPage} of {totalPages} · {total} orders</>
              ) : (
                <>{total} order{total === 1 ? '' : 's'}</>
              )}
            </p>
            {totalPages > 1 && (
              <nav className="flex items-center gap-1" aria-label="Orders pagination">
                {currentPage > 1 && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground" render={<Link href={buildPageHref(currentPage - 1, params)} aria-label="Previous page" />}>
                    <ChevronLeft aria-hidden="true" />
                    Prev
                  </Button>
                )}
                {currentPage < totalPages && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground" render={<Link href={buildPageHref(currentPage + 1, params)} aria-label="Next page" />}>
                    Next
                    <ChevronRight aria-hidden="true" />
                  </Button>
                )}
              </nav>
            )}
          </div>
        </div>
      )}
    </>
  )
}
