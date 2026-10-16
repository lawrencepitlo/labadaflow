import Link from 'next/link'
import { getOrderByTrackingCode } from '@/lib/data/orders'
import { STATUS_CONFIG, ORDER_STATUS_FLOW, type OrderStatus } from '@/lib/order-machine'
import { StatusBadge, STATUS_DOT_CLASS } from '@/components/app/status-badge'
import { OrderFlowStepper } from '@/components/app/order-flow-stepper'
import { EmptyState } from '@/components/app/empty-state'
import { Button } from '@/components/ui/button'
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
              <div className="mb-6 text-center">
                <span className="inline-block font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/60 px-3 py-1 rounded-full mb-3">
                  Order {order.order_number}
                </span>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {STATUS_CONFIG[order.status as OrderStatus]?.label ?? order.status}
                </h1>
                <div className="mt-3 flex justify-center">
                  <StatusBadge status={order.status as OrderStatus} size="md" />
                </div>
                {notice && (
                  <p className="tnum mx-auto mt-4 flex max-w-sm items-center justify-center gap-2 rounded-xl bg-muted/40 border px-3.5 py-2 text-xs text-foreground font-medium" role="status">
                    <span className={cn('h-2 w-2 shrink-0 rounded-full', notice.dot)} aria-hidden="true" />
                    {notice.text}
                  </p>
                )}
              </div>

              {!isCancelled && (
                <div className="mb-4 overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
                  <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-4">Live Laundry Progress</h2>
                  <OrderFlowStepper currentStatus={order.status as OrderStatus} />
                  <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
                    {ORDER_STATUS_FLOW.includes(order.status as OrderStatus)
                      ? 'Status updates in real-time as your laundry moves through each machine.'
                      : 'This order is no longer in the active workflow.'}
                  </p>
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
                <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">Order Details</h2>
                <dl className="tnum divide-y divide-border/60 text-xs">
                  <div className="flex items-center justify-between gap-2 py-2.5 first:pt-0">
                    <dt className="text-muted-foreground">Intake Date</dt>
                    <dd className="font-semibold text-foreground">{formatDate(order.received_at)}</dd>
                  </div>
                  {order.due_at && (
                    <div className="flex items-center justify-between gap-2 py-2.5">
                      <dt className="text-muted-foreground">Target Ready Date</dt>
                      <dd className="font-semibold text-foreground">{formatDate(order.due_at)}</dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 py-2.5 last:pb-0">
                    <dt className="text-muted-foreground">Last Updated</dt>
                    <dd className="font-semibold text-foreground">{formatDate(order.updated_at)}</dd>
                  </div>
                </dl>
                <div className="mt-5 border-t pt-4">
                  <Button render={<Link href="/track" />} variant="outline" className="w-full">
                    <Search className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    Track another order
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
