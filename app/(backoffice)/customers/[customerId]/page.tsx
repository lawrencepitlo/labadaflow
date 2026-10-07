import Link from 'next/link'
import { getCustomerById } from '@/lib/data/customers'
import { getOrdersByCustomerForStaff } from '@/lib/data/orders'
import { getActor } from '@/lib/auth'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { StatusBadge } from '@/components/app/status-badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatMoney } from '@/lib/money'
import { formatDateTime } from '@/lib/time'
import type { OrderStatus } from '@/lib/order-machine'
import { ChevronLeft, Archive } from 'lucide-react'
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
      <div className="mb-4">
        <Button variant="ghost" size="sm" render={<Link href="/customers" className="inline-flex items-center gap-1 text-muted-foreground" />}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          All customers
        </Button>
      </div>
      <PageHeader
        title={customer.full_name}
        description={archived ? 'Archived — read-only history' : `${orders.length} order${orders.length === 1 ? '' : 's'} on record`}
      >
        {archived ? (
          <Badge variant="secondary" className="gap-1">
            <Archive className="h-3 w-3" aria-hidden="true" />
            Archived
          </Badge>
        ) : (
          <Button render={<Link href={`/orders/new`} />}>New Order</Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="font-medium">{customer.phone ?? '—'}</dd>
                </div>
                <Separator />
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="max-w-[12rem] truncate font-medium">{customer.email ?? '—'}</dd>
                </div>
                <Separator />
                <div className="flex justify-between gap-2">
                  <dt className="shrink-0 text-muted-foreground">Address</dt>
                  <dd className="text-right font-medium">{customer.address ?? '—'}</dd>
                </div>
              </dl>
              {customer.notes && (
                <>
                  <Separator className="my-3" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Notes: </span>{customer.notes}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {actor?.role === 'ADMIN' && (
            <ArchiveButtons customerId={customer.id} archived={archived} />
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-base">Edit Customer</CardTitle>
              <CardDescription>Keep contact details current for pickup notices</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <EditCustomerForm customer={customer} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
              <div>
                <CardTitle className="text-base">Order History</CardTitle>
                <CardDescription>Newest first</CardDescription>
              </div>
              <Badge variant="outline" className="tabular-nums">{orders.length}</Badge>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {orders.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No orders yet for this customer.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <Table aria-label="Customer order history">
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-semibold">Order #</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Total</TableHead>
                        <TableHead className="font-semibold">Received</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((o: { id: string; order_number: string; status: string; total_cents: number; received_at: string }) => (
                        <TableRow key={o.id} className="transition-colors hover:bg-accent/30 motion-reduce:transition-none">
                          <TableCell>
                            <Link href={`/orders/${o.id}`} className="font-semibold text-primary hover:underline">
                              {o.order_number}
                            </Link>
                          </TableCell>
                          <TableCell><StatusBadge status={o.status as OrderStatus} size="sm" /></TableCell>
                          <TableCell className="font-semibold tabular-nums">{formatMoney(o.total_cents)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDateTime(o.received_at)}</TableCell>
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
