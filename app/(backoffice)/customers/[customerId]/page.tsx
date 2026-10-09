import Link from 'next/link'
import { getCustomerById } from '@/lib/data/customers'
import { getOrdersByCustomerForStaff } from '@/lib/data/orders'
import { getActor } from '@/lib/auth'
import { EmptyState } from '@/components/app/empty-state'
import { StatusBadge } from '@/components/app/status-badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatMoney } from '@/lib/money'
import { formatDateTime } from '@/lib/time'
import type { OrderStatus } from '@/lib/order-machine'
import { Archive, Plus, ChevronRight } from 'lucide-react'
import { EditCustomerForm } from './edit-customer-form'
import { ArchiveButtons } from './archive-buttons'

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>
}) {
  const { customerId } = await params
  const [customer, actor, orders] = await Promise.all([
    getCustomerById(customerId),
    getActor(),
    getOrdersByCustomerForStaff(customerId),
  ])

  if (!customer) {
    return <EmptyState title="Customer not found" description="This customer does not exist or you do not have access." />
  }

  const archived = Boolean(customer.archived_at)
  const isAdmin = actor?.role === 'ADMIN'

  return (
    <>
      {/* Breadcrumb — also serves as back navigation */}
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/customers" className="rounded outline-none transition-colors duration-100 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 motion-reduce:transition-none">
          Customers
        </Link>
        <span aria-hidden="true" className="text-muted-foreground/50">/</span>
        <span className="truncate text-foreground" aria-current="page">{customer.full_name}</span>
      </nav>

      {/* Identity header */}
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-[17px] font-semibold tracking-tight text-foreground">{customer.full_name}</h1>
            {archived && (
              <span className="inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-md border px-2 text-xs font-medium text-muted-foreground">
                <Archive className="h-3 w-3" aria-hidden="true" />
                Archived
              </span>
            )}
          </div>
          <p className="tnum mt-1 truncate text-[13px] text-muted-foreground">
            {[customer.phone, customer.email].filter(Boolean).join(' · ') || 'No contact details'}
          </p>
          <p className="tnum mt-0.5 truncate text-xs text-muted-foreground">
            {archived
              ? 'Archived — read-only history'
              : `${orders.length} order${orders.length === 1 ? '' : 's'} on record`}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {!archived && (
            <Button render={<Link href="/orders/new" />}>
              <Plus aria-hidden="true" />
              New Order
            </Button>
          )}
          {isAdmin && <ArchiveButtons customerId={customer.id} archived={archived} />}
        </div>
      </header>

      {/* Workspace — one quiet surface on desktop, stacked sections on mobile.
          DOM order: order history → contact → edit, so mobile reads the
          operational section first and editing last. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-0 lg:overflow-hidden lg:rounded-lg lg:border lg:bg-card">
        {/* Order history — the operational hero */}
        <section aria-labelledby="customer-orders" className="min-w-0 overflow-hidden rounded-lg border bg-card px-4 py-3.5 lg:col-start-1 lg:row-start-1 lg:rounded-none lg:border-0">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 id="customer-orders" className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Order history</h2>
            <p className="tnum text-xs text-muted-foreground">{orders.length} · newest first</p>
          </div>
          {orders.length === 0 ? (
            <p className="py-3 text-center text-[13px] text-muted-foreground">No orders yet for this customer.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table aria-label="Customer order history">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-9 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Order</TableHead>
                    <TableHead className="h-9 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Status</TableHead>
                    <TableHead className="h-9 text-right text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Total</TableHead>
                    <TableHead className="h-9 text-right text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Received</TableHead>
                    <TableHead className="h-9 w-10 pr-3">
                      <span className="sr-only">Open</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o: { id: string; order_number: string; status: string; total_cents: number; received_at: string }) => (
                    <TableRow key={o.id} className="group transition-colors duration-100 hover:bg-muted/40 focus-within:bg-muted/40">
                      <TableCell>
                        <Link
                          href={`/orders/${o.id}`}
                          className="rounded font-mono text-xs font-medium text-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
                        >
                          {o.order_number}
                        </Link>
                      </TableCell>
                      <TableCell><StatusBadge status={o.status as OrderStatus} size="sm" /></TableCell>
                      <TableCell className="tnum text-right text-[13px] font-medium">{formatMoney(o.total_cents)}</TableCell>
                      <TableCell className="tnum text-right text-[13px] text-muted-foreground">{formatDateTime(o.received_at)}</TableCell>
                      <TableCell className="pr-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground/50 transition-colors duration-100 group-hover:text-foreground"
                          render={<Link href={`/orders/${o.id}`} aria-label={`Open order ${o.order_number}`} />}
                        >
                          <ChevronRight aria-hidden="true" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/* Context column: contact */}
        <aside className="overflow-hidden rounded-lg border bg-card px-4 py-3.5 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:rounded-none lg:border-0 lg:border-l">
          <section aria-labelledby="customer-contact">
            <h2 id="customer-contact" className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Contact</h2>
            <dl className="tnum mt-1 divide-y divide-border text-[13px]">
              <div className="flex items-center justify-between gap-2 py-2">
                <dt className="text-xs text-muted-foreground">Phone</dt>
                <dd className="font-medium">{customer.phone ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2">
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="max-w-[12rem] truncate font-medium">{customer.email ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Address</dt>
                <dd className="truncate font-medium">{customer.address ?? '—'}</dd>
              </div>
            </dl>
            {customer.notes && (
              <p className="mt-3 text-[13px] text-muted-foreground">
                <span className="font-medium text-foreground">Notes: </span>{customer.notes}
              </p>
            )}
          </section>
        </aside>

        {/* Edit — secondary, below the operational content */}
        <section aria-labelledby="customer-edit" className="min-w-0 overflow-hidden rounded-lg border bg-card px-4 py-3.5 lg:col-start-1 lg:row-start-2 lg:rounded-none lg:border-0 lg:border-t">
          <h2 id="customer-edit" className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Edit customer</h2>
          <p className="mt-0.5 mb-3 text-xs text-muted-foreground">Keep contact details current for pickup notices</p>
          <EditCustomerForm customer={customer} />
        </section>
      </div>
    </>
  )
}
