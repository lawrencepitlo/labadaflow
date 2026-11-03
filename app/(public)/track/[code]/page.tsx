import Link from 'next/link'
import { getOrderByTrackingCode } from '@/lib/data/orders'
import { getActor } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/app/empty-state'
import { CustomerOrderStatusCard } from '@/components/app/customer-order-status-card'
import { Button } from '@/components/ui/button'
import { Droplets, Search, Package, ArrowLeft } from 'lucide-react'

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

  let staffOrderId: string | null = null
  const actor = await getActor()
  if (actor && ['ADMIN', 'STAFF'].includes(actor.role) && trackingCode) {
    const supabase = await createClient()
    const { data: staffOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('tracking_code', trackingCode)
      .maybeSingle()
    if (staffOrder) staffOrderId = staffOrder.id
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60 dark:bg-background">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-105">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Droplets className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-bold tracking-tight text-foreground">LabadaFlow</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs" render={<Link href="/track" />}>
              <Search className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
              Track another
            </Button>
            <Button variant="outline" size="sm" className="text-xs" render={<Link href="/sign-in" />}>
              Sign in
            </Button>
          </div>
        </div>
      </header>

      {staffOrderId && (
        <aside aria-label="Staff quick link" className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 text-center text-xs">
          <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-between gap-2">
            <span className="text-muted-foreground">
              ⚡ <strong>Staff Quick Intake:</strong> Order <span className="font-mono font-bold text-foreground">{order?.order_number}</span> detected.
            </span>
            <Button size="sm" className="h-7 text-xs font-semibold gap-1" render={<Link href={`/orders/${staffOrderId}`} />}>
              Open in Backoffice & Start Laundry →
            </Button>
          </div>
        </aside>
      )}

      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-3xl">
          <div className="mb-4">
            <Link
              href="/track"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Tracking Search
            </Link>
          </div>

          {!order ? (
            <div className="rounded-2xl border border-border/80 bg-card p-8 shadow-xs">
              <EmptyState
                icon={Package}
                title="Order not found"
                description="We could not find an order with that tracking code. Check the tracking code on your printed receipt slip and try again."
                actionLabel="Try another code"
                actionHref="/track"
              />
            </div>
          ) : (
            <CustomerOrderStatusCard order={order} />
          )}
        </div>
      </main>
    </div>
  )
}
