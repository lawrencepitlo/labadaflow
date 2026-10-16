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

      {/* Workspace */}
      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left Column: Order history & Edit Customer */}
        <div className="space-y-6 min-w-0">
          {/* Order history — the operational hero */}
          <section aria-labelledby="customer-orders" className="overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
            <div className="mb-4 flex items-baseline justify-between gap-2 border-b pb-3">
              <div>
                <h2 id="customer-orders" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Order History</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">All laundry orders registered under this profile</p>
              </div>
              <p className="tnum font-mono text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md">{orders.length} order{orders.length === 1 ? '' : 's'}</p>
            </div>
            {orders.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-medium text-foreground">No orders recorded yet</p>
                <p className="mt-1 text-xs text-muted-foreground">This customer has not placed any laundry orders.</p>
                {!archived && (
                  <Button render={<Link href="/orders/new" />} className="mt-4" size="sm">
                    <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                    Create First Order
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/70">
                <Table aria-label="Customer order history">
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-10 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase pl-4">Order #</TableHead>
                      <TableHead className="h-10 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Status</TableHead>
                      <TableHead className="h-10 text-right text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Amount</TableHead>
                      <TableHead className="h-10 text-right text-[11px] font-semibold tracking-wide text-muted-foreground uppercase pr-4">Intake Date</TableHead>
                      <TableHead className="h-10 w-10 pr-3">
                        <span className="sr-only">Open</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o: { id: string; order_number: string; status: string; total_cents: number; received_at: string }) => (
                      <TableRow key={o.id} className="group transition-colors duration-150 hover:bg-muted/40">
                        <TableCell className="pl-4">
                          <Link
                            href={`/orders/${o.id}`}
                            className="font-mono text-xs font-semibold text-foreground hover:text-primary transition-colors hover:underline"
                          >
                            {o.order_number}
                          </Link>
                        </TableCell>
                        <TableCell><StatusBadge status={o.status as OrderStatus} size="sm" /></TableCell>
                        <TableCell className="tnum text-right text-xs font-semibold">{formatMoney(o.total_cents)}</TableCell>
                        <TableCell className="tnum text-right text-xs text-muted-foreground pr-4">{formatDateTime(o.received_at)}</TableCell>
                        <TableCell className="pr-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground/50 transition-colors group-hover:text-foreground hover:bg-muted"
                            render={<Link href={`/orders/${o.id}`} aria-label={`Open order ${o.order_number}`} />}
                          >
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          {/* Edit — secondary, below the operational content */}
          <section aria-labelledby="customer-edit" className="overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
            <div className="mb-4 border-b pb-3">
              <h2 id="customer-edit" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Edit Customer Details</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Keep contact information up to date for SMS ready notices</p>
            </div>
            <EditCustomerForm customer={customer} />
          </section>
        </div>

        {/* Right Sidebar: Contact info */}
        <aside className="space-y-6">
          <section aria-labelledby="customer-contact" className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
            <h2 id="customer-contact" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase border-b pb-3 mb-3">Customer Profile</h2>
            <dl className="tnum divide-y divide-border/60 text-xs">
              <div className="flex items-center justify-between gap-2 py-2.5">
                <dt className="text-muted-foreground">Phone Number</dt>
                <dd className="font-semibold text-foreground">{customer.phone ?? 'None'}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2.5">
                <dt className="text-muted-foreground">Email Address</dt>
                <dd className="max-w-[14rem] truncate font-medium text-foreground">{customer.email ?? 'None'}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2.5">
                <dt className="shrink-0 text-muted-foreground">Delivery / Address</dt>
                <dd className="truncate font-medium text-foreground">{customer.address ?? 'None'}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2.5 last:pb-0">
                <dt className="text-muted-foreground">Lifetime Orders</dt>
                <dd className="font-bold text-foreground">{orders.length}</dd>
              </div>
            </dl>
            {customer.notes && (
              <div className="mt-4 rounded-xl border border-muted bg-muted/20 p-3 text-xs">
                <span className="font-semibold text-foreground block mb-0.5">Preferences / Notes:</span>
                <span className="text-muted-foreground">{customer.notes}</span>
              </div>
            )}
          </section>
        </aside>
      </div>
    </>
  )
}
