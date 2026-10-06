import Link from 'next/link'
import { getOrderById } from '@/lib/data/orders'
import { getActiveServices } from '@/lib/data/services'
import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { EmptyState } from '@/components/app/empty-state'
import { OrderFlowStepper } from '@/components/app/order-flow-stepper'
import { OrderActions } from '@/components/app/order-actions'
import { OrderItemsEditor } from '@/components/app/order-items-editor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatMoney } from '@/lib/money'
import { formatDateTime } from '@/lib/time'
import { Printer } from 'lucide-react'
import type { OrderStatus } from '@/lib/order-machine'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const order = await getOrderById(orderId)

  if (!order) {
    return <EmptyState title="Order not found" description="This order does not exist or you do not have access." />
  }

  const services = order.status === 'RECEIVED' ? await getActiveServices() : []

  return (
    <>
      <PageHeader title={`Order ${order.order_number}`} description={`Created ${formatDateTime(order.created_at)}`}>
        <Button variant="outline" render={<Link href={`/orders/${order.id}/slip`} />}>
          <Printer className="w-4 h-4 mr-2" />
          Print Slip
        </Button>
      </PageHeader>

      {/* Status Stepper */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <OrderFlowStepper currentStatus={order.status} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Items + History */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-lg">Items</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {order.status === 'RECEIVED' ? (
                <OrderItemsEditor orderId={order.id} items={order.items} services={services} />
              ) : (
                <>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="font-semibold">Service</TableHead>
                          <TableHead className="font-semibold">Unit Price</TableHead>
                          <TableHead className="font-semibold text-center">Qty</TableHead>
                          <TableHead className="font-semibold text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map(item => (
                          <TableRow key={item.id} className="hover:bg-accent/30 transition-colors">
                            <TableCell className="font-medium">{item.service_name}</TableCell>
                            <TableCell className="text-muted-foreground">{formatMoney(item.unit_price_cents)} / {item.pricing_unit === 'PER_KG' ? 'kg' : 'pc'}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right font-medium">{formatMoney(item.line_total_cents)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-end mt-4 pt-4 border-t">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{formatMoney(order.total_cents)}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-lg">Status History</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <ol className="relative space-y-6">
                {order.events.map((event, i) => (
                  <li key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full mt-1.5 ${i === order.events.length - 1 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                      {i < order.events.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-sm">
                            {event.from_status ? (
                              <span className="text-muted-foreground">{event.from_status} → </span>
                            ) : null}
                            <span className="font-semibold">{event.to_status}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">by {event.actor_name}</p>
                          {event.note && (
                            <p className="text-xs text-muted-foreground italic mt-1">&ldquo;{event.note}&rdquo;</p>
                          )}
                        </div>
                        <time className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(event.created_at)}</time>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Details + Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd><StatusBadge status={order.status} size="sm" /></dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Customer</dt>
                  <dd className="font-medium">{order.customer.full_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>{order.customer.phone ?? '—'}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Source</dt>
                  <dd className="capitalize">{order.source}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Assigned to</dt>
                  <dd>{order.assigned_staff?.full_name ?? '—'}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Due</dt>
                  <dd>{order.due_at ? formatDateTime(order.due_at) : '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Paid at</dt>
                  <dd>{order.paid_at ? formatDateTime(order.paid_at) : '—'}</dd>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground">Tracking</dt>
                  <dd>
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{order.tracking_code}</code>
                  </dd>
                </div>
              </dl>
              {order.notes && (
                <>
                  <Separator className="my-3" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Notes: </span>{order.notes}
                  </p>
                </>
              )}
              {order.cancel_reason && (
                <>
                  <Separator className="my-3" />
                  <p className="text-sm text-destructive">
                    <span className="font-medium">Cancel reason: </span>{order.cancel_reason}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <OrderActions orderId={order.id} status={order.status as OrderStatus} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
