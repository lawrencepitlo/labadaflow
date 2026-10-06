import Link from 'next/link'
import { getCustomerById } from '@/lib/data/customers'
import { getOrdersByCustomerForStaff } from '@/lib/data/orders'
import { getActor } from '@/lib/auth'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { StatusBadge } from '@/components/app/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatMoney } from '@/lib/money'
import { formatDateTime } from '@/lib/time'
import type { OrderStatus } from '@/lib/order-machine'
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

  return (
    <>
      <PageHeader title={customer.full_name} description={customer.archived_at ? 'Archived customer' : 'Customer details'} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-lg">Info</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="font-medium">{customer.phone ?? '—'}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium">{customer.email ?? '—'}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Address</dt>
                  <dd className="font-medium">{customer.address ?? '—'}</dd>
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
            <ArchiveButtons customerId={customer.id} archived={!!customer.archived_at} />
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-lg">Edit Customer</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <EditCustomerForm customer={customer} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-lg">Order History</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No orders yet.</p>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
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
                        <TableRow key={o.id} className="hover:bg-accent/30 transition-colors">
                          <TableCell>
                            <Link href={`/orders/${o.id}`} className="font-semibold text-primary hover:underline">
                              {o.order_number}
                            </Link>
                          </TableCell>
                          <TableCell><StatusBadge status={o.status as OrderStatus} size="sm" /></TableCell>
                          <TableCell className="font-semibold">{formatMoney(o.total_cents)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{formatDateTime(o.received_at)}</TableCell>
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
