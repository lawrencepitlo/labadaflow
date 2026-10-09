import Link from 'next/link'
import { getOrderByTrackingCode } from '@/lib/data/orders'
import { STATUS_CONFIG, ORDER_STATUS_FLOW, type OrderStatus } from '@/lib/order-machine'
import { StatusBadge, STATUS_DOT_CLASS } from '@/components/app/status-badge'
import { OrderFlowStepper } from '@/components/app/order-flow-stepper'
import { EmptyState } from '@/components/app/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/time'
import { Droplets, Search, Package } from 'lucide-react'
import { cn } from 'cn'

export default async function TrackCodePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  let trackingCode = ''
  try {
    trackingCode = decodeURIComponent(code)
  } catch {
    trackingCode = ''
  }
  const order = trackingCode ? await getOrderByTrackingCode(trackingCode) : null

  const isCompleted = order?.status === 'COMPLETED'
  const isCancelled = order?.status === 'CANCELLED'
  const isReady = order?.status === 'READY'

  const notice = isReady
    ? { dot: STATUS_DOT_CLASS.READY, text: 'Your laundry is ready — bring your slip for pickup.' }
    : isCompleted
      ? { dot: STATUS_DOT_CLASS.COMPLETED, text: 'Completed — thank you for choosing us.' }
      : isCancelled
        ? { dot: STATUS_DOT_CLASS.CANCELLED, text: 'Cancelled — no pickup needed. Contact the shop with questions.' }
        : null

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
              <Droplets className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="text-[13px] font-semibold">LabadaFlow</span>
          </Link>
          <Button variant="ghost" size="sm" className="text-muted-foreground" render={<Link href="/track" />}>
            <Search aria-hidden="true" />
            Track another
          </Button>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {!order ? (
            <EmptyState
              icon={Package}
              title="Order not found"
              description="We could not find an order with that tracking code. Check the code on your slip and try again."
              actionLabel="Try again"
              actionHref="/track"
            />
          ) : (
            <>
              <div className="mb-5 text-center">
                <p className="tnum mb-1 font-mono text-xs text-muted-foreground">Order {order.order_number}</p>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {STATUS_CONFIG[order.status as OrderStatus]?.label ?? order.status}
                </h1>
                <div className="mt-2 flex justify-center">
                  <StatusBadge status={order.status as OrderStatus} size="md" />
                </div>
                {notice && (
                  <p className="tnum mx-auto mt-3 flex max-w-sm items-center justify-center gap-2 text-[13px] text-muted-foreground" role="status">
                    <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', notice.dot)} aria-hidden="true" />
                    {notice.text}
                  </p>
                )}
              </div>

              {!isCancelled && (
                <Card className="mb-3 gap-0 py-0">
                  <CardHeader className="px-4 py-3">
                    <CardTitle className="text-[13px]">Where&apos;s my laundry?</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <OrderFlowStepper currentStatus={order.status as OrderStatus} />
                    <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                      {ORDER_STATUS_FLOW.includes(order.status as OrderStatus)
                        ? 'We update this page as your load moves through the shop.'
                        : 'This order is no longer in the active workflow.'}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="gap-0 py-0">
                <CardContent className="px-4 py-4">
                  <dl className="tnum divide-y divide-border text-[13px]">
                    <div className="flex items-center justify-between gap-2 py-2 first:pt-0">
                      <dt className="text-xs text-muted-foreground">Received</dt>
                      <dd className="font-medium">{formatDate(order.received_at)}</dd>
                    </div>
                    {order.due_at && (
                      <div className="flex items-center justify-between gap-2 py-2">
                        <dt className="text-xs text-muted-foreground">Estimated ready</dt>
                        <dd className="font-medium">{formatDate(order.due_at)}</dd>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 py-2 last:pb-0">
                      <dt className="text-xs text-muted-foreground">Last update</dt>
                      <dd className="font-medium">{formatDate(order.updated_at)}</dd>
                    </div>
                  </dl>
                  <div className="mt-3 border-t pt-3">
                    <Button render={<Link href="/track" />} variant="outline" className="w-full">
                      <Search aria-hidden="true" />
                      Track another order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
