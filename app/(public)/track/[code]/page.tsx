import Link from 'next/link'
import { getOrderByTrackingCode } from '@/lib/data/orders'
import { STATUS_CONFIG, type OrderStatus } from '@/lib/order-machine'
import { StatusBadge } from '@/components/app/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/time'
import { Droplets, Search, Package, CalendarDays, Clock } from 'lucide-react'

export default async function TrackCodePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const order = await getOrderByTrackingCode(code)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
              <Droplets className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="font-bold text-xl tracking-tight">LabadaFlow</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {!order ? (
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-destructive/20">
                <Package className="w-8 h-8 text-destructive" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight mb-2">Order not found</h1>
              <p className="text-muted-foreground mb-6">
                We could not find an order with that tracking code. Please check the code and try again.
              </p>
              <Button render={<Link href="/track" />} variant="outline" size="lg">
                <Search className="w-4 h-4 mr-2" />
                Try again
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <p className="text-sm text-muted-foreground mb-1">Order {order.order_number}</p>
                <h1 className="text-3xl font-bold tracking-tight mb-4">
                  {STATUS_CONFIG[order.status as OrderStatus]?.label ?? order.status}
                </h1>
                <div className="flex justify-center">
                  <StatusBadge status={order.status as OrderStatus} size="lg" />
                </div>
              </div>
              <Card className="border-2 shadow-lg shadow-primary/5">
                <CardContent className="p-6">
                  <dl className="space-y-4">
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-2 text-muted-foreground text-sm">
                        <CalendarDays className="w-4 h-4" />
                        Received
                      </dt>
                      <dd className="font-medium">{formatDate(order.received_at)}</dd>
                    </div>
                    {order.due_at && (
                      <div className="flex items-center justify-between">
                        <dt className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Clock className="w-4 h-4" />
                          Estimated ready
                        </dt>
                        <dd className="font-medium">{formatDate(order.due_at)}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="mt-6 pt-4 border-t">
                    <Button render={<Link href="/track" />} variant="outline" className="w-full">
                      <Search className="w-4 h-4 mr-2" />
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
