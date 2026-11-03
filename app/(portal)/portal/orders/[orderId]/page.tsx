import Link from 'next/link'
import QRCode from 'qrcode'
import { getOrderById } from '@/lib/data/orders'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { CustomerOrderStatusCard } from '@/components/app/customer-order-status-card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, QrCode, Store, Sparkles, Copy, Check } from 'lucide-react'
import Image from 'next/image'

export default async function PortalOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const order = await getOrderById(orderId)

  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description="This order does not exist or does not belong to you."
        actionLabel="Back to my orders"
        actionHref="/portal/orders"
      />
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const trackingUrl = `${baseUrl}/track/${order.tracking_code}`
  const qrDataUrl = await QRCode.toDataURL(trackingUrl, {
    margin: 1,
    width: 220,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground hover:text-foreground text-xs" render={<Link href="/portal/orders" aria-label="Back to my orders" />}>
          <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
          Back to My Orders
        </Button>
      </div>

      <CustomerOrderStatusCard order={order} />

      {/* Counter Scan Card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-card p-6 shadow-xs dark:border-border sm:p-7">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-3 shadow-2xs dark:border-border">
            <Image
              src={qrDataUrl}
              alt={`QR Code for order ${order.order_number}`}
              width={140}
              height={140}
              className="rounded-lg"
              priority
            />
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <QrCode className="h-3.5 w-3.5" />
              Counter Pickup Slip
            </span>
            <h3 className="text-base font-bold text-foreground">
              Claiming at the counter?
            </h3>
            <p className="max-w-md text-xs text-muted-foreground leading-relaxed">
              Show this QR code or provide your tracking code <strong className="font-mono text-foreground">{order.tracking_code}</strong> to the staff when collecting your clean laundry.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
