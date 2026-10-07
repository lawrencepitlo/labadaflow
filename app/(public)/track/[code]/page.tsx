import Link from 'next/link'
import { getOrderByTrackingCode } from '@/lib/data/orders'
import { STATUS_CONFIG, ORDER_STATUS_FLOW, type OrderStatus } from '@/lib/order-machine'
import { StatusBadge } from '@/components/app/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/time'
import { Droplets, Search, Package, CalendarDays, Clock, CheckCircle2, BellRing, XCircle } from 'lucide-react'
import { cn } from 'cn'

const CUSTOMER_STEPS: OrderStatus[] = ['RECEIVED', 'WASHING', 'DRYING', 'FOLDING', 'READY']

export default async function TrackCodePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const order = await getOrderByTrackingCode(decodeURIComponent(code))

  const currentIndex = order ? CUSTOMER_STEPS.indexOf(order.status as OrderStatus) : -1
  const isCompleted = order?.status === 'COMPLETED'
  const isCancelled = order?.status === 'CANCELLED'
  const isReady = order?.status === 'READY'

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary transition-transform group-hover:scale-105 motion-reduce:transition-none">
              <Droplets className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold tracking-tight">LabadaFlow</span>
          </Link>
          <Button variant="ghost" size="sm" render={<Link href="/track" />}>
            <Search className="mr-2 h-4 w-4" aria-hidden="true" />
            Track another
          </Button>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {!order ? (
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
                <Package className="h-8 w-8 text-destructive" aria-hidden="true" />
              </div>
              <h1 className="mb-2 text-2xl font-bold tracking-tight">Order not found</h1>
              <p className="mb-6 text-muted-foreground">
                We could not find an order with that tracking code. Check the code on your slip and try again.
              </p>
              <Button render={<Link href="/track" />} variant="outline" size="lg">
                <Search className="mr-2 h-4 w-4" aria-hidden="true" />
                Try again
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <p className="mb-1 text-sm text-muted-foreground">Order {order.order_number}</p>
                <h1 className="mb-3 text-3xl font-bold tracking-tight">
                  {STATUS_CONFIG[order.status as OrderStatus]?.label ?? order.status}
                </h1>
                <div className="flex justify-center">
                  <StatusBadge status={order.status as OrderStatus} size="lg" />
                </div>
                {isReady && (
                  <p className="mx-auto mt-3 flex max-w-sm items-center justify-center gap-2 rounded-xl border border-green-500/25 bg-green-500/[0.07] px-3 py-2 text-sm font-medium text-green-700 dark:text-green-300" role="status">
                    <BellRing className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Your laundry is ready — bring your slip for pickup.
                  </p>
                )}
                {isCompleted && (
                  <p className="mx-auto mt-3 flex max-w-sm items-center justify-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300" role="status">
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Completed — thank you for choosing us.
                  </p>
                )}
                {isCancelled && (
                  <p className="mx-auto mt-3 flex max-w-sm items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.07] px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300" role="status">
                    <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Cancelled — no pickup needed. Contact the shop with questions.
                  </p>
                )}
              </div>

              {!isCancelled && (
                <Card className="mb-4">
                  <CardContent className="p-6">
                    <h2 className="mb-4 text-sm font-semibold">Where&apos;s my laundry?</h2>
                    <ol className="space-y-3" aria-label="Order progress">
                      {CUSTOMER_STEPS.map((step, i) => {
                        const done = isCompleted || currentIndex > i
                        const active = !isCompleted && currentIndex === i
                        return (
                          <li key={step} className="flex items-center gap-3">
                            <span
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold',
                                done && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                                active && 'border-primary bg-primary/10 text-primary',
                                !done && !active && 'border-border text-muted-foreground/50'
                              )}
                              aria-current={active ? 'step' : undefined}
                            >
                              {done ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : i + 1}
                            </span>
                            <span
                              className={cn(
                                'text-sm',
                                active && 'font-semibold text-foreground',
                                done && 'text-emerald-600 dark:text-emerald-400',
                                !done && !active && 'text-muted-foreground/60'
                              )}
                            >
                              {STATUS_CONFIG[step].label}
                            </span>
                          </li>
                        )
                      })}
                    </ol>
                    <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
                      {ORDER_STATUS_FLOW.includes(order.status as OrderStatus)
                        ? 'We update this page as your load moves through the shop.'
                        : 'This order is no longer in the active workflow.'}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="border-2 shadow-lg shadow-primary/5">
                <CardContent className="p-6">
                  <dl className="space-y-4">
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4" aria-hidden="true" />
                        Received
                      </dt>
                      <dd className="font-medium">{formatDate(order.received_at)}</dd>
                    </div>
                    {order.due_at && (
                      <div className="flex items-center justify-between">
                        <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" aria-hidden="true" />
                          Estimated ready
                        </dt>
                        <dd className="font-medium">{formatDate(order.due_at)}</dd>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        Last update
                      </dt>
                      <dd className="font-medium">{formatDate(order.updated_at)}</dd>
                    </div>
                  </dl>
                  <div className="mt-6 border-t pt-4">
                    <Button render={<Link href="/track" />} variant="outline" className="w-full">
                      <Search className="mr-2 h-4 w-4" aria-hidden="true" />
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
