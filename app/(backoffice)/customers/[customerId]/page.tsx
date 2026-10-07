import Link from 'next/link'
import { getCustomerById } from '@/lib/data/customers'
import { getOrdersByCustomerForStaff } from '@/lib/data/orders'
import { getActor } from '@/lib/auth'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { StatusBadge } from '@/components/app/status-badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatMoney } from '@/lib/money'
import { formatDateTime } from '@/lib/time'
import type { OrderStatus } from '@/lib/order-machine'
import { ChevronLeft, Archive, Plus } from 'lucide-react'
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

  return (
    <>
      <div className="mb-2">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" render={<Link href="/customers" />}>
          <ChevronLeft aria-hidden="true" />
          Customers
        </Button>
      </div>
      <PageHeader
        title={customer.full_name}
        description={archived ? 'Archived — read-only history' : `${orders.length} order${orders.length === 1 ? '' : 's'} on record`}
      >
        {archived ? (
          <span className="inline-flex h-[22px] items-center gap-1.5 rounded-md border px-2 text-xs font-medium text-muted-foreground">
            <Archive className="h-3 w-3" aria-hidden="true" />
            Archived
          </span>
        ) : (
          <Button render={<Link href={`/orders/new`} />}>
            <Plus aria-hidden="true" />
            New Order
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Card className="gap-0 py-0">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-[13px]">Contact</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <dl className="tnum divide-y divide-border text-[13px]">
                <div className="flex items-center justify-between gap-2 py-2 first:pt-0">
                  <dt className="text-xs text-muted-foreground">Phone</dt>
                  <dd className="font-medium">{customer.phone ?? '—'}</dd>
                </div>
                <div className="flex items-center justify-between gap-2 py-2">
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="max-w-[12rem] truncate font-medium">{customer.email ?? '—'}</dd>
                </div>
                <div className="flex items-center justify-between gap-2 py-2 last:pb-0">
                  <dt className="shrink-0 text-xs text-muted-foreground">Address</dt>
                  <dd className="truncate font-medium">{customer.address ?? '—'}</dd>
                </div>
              </dl>
              {customer.notes && (
                <p className="mt-3 text-[13px] text-muted-foreground">
                  <span className="font-medium text-foreground">Notes: </span>{customer.notes}
                </p>
              )}
            </CardContent>
          </Card>

          {actor?.role === 'ADMIN' && (
            <ArchiveButtons customerId={customer.id} archived={archived} />
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card className="gap-0 py-0">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-[13px]">Edit Customer</CardTitle>
              <CardDescription>Keep contact details current for pickup notices</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <EditCustomerForm customer={customer} />
            </CardContent>
          </Card>

          <Card className="gap-0 py-0">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-[13px]">Order History</CardTitle>
              <CardDescription>Newest first</CardDescription>
              <CardAction>
                <span className="tnum text-xs text-muted-foreground">{orders.length}</span>
              </CardAction>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {orders.length === 0 ? (
                <p className="py-3 text-center text-[13px] text-muted-foreground">No orders yet for this customer.</p>
              ) : (
                <div className="overflow-hidden rounded-md border">
                  <Table aria-label="Customer order history">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-9 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Order</TableHead>
                        <TableHead className="h-9 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Status</TableHead>
                        <TableHead className="h-9 text-right text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Total</TableHead>
                        <TableHead className="h-9 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Received</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((o: { id: string; order_number: string; status: string; total_cents: number; received_at: string }) => (
                        <TableRow key={o.id} className="hover:bg-muted/40">
                          <TableCell>
                            <Link href={`/orders/${o.id}`} className="font-mono text-xs font-medium text-foreground hover:underline">
                              {o.order_number}
                            </Link>
                          </TableCell>
                          <TableCell><StatusBadge status={o.status as OrderStatus} size="sm" /></TableCell>
                          <TableCell className="tnum text-right text-[13px] font-medium">{formatMoney(o.total_cents)}</TableCell>
                          <TableCell className="tnum text-[13px] text-muted-foreground">{formatDateTime(o.received_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
