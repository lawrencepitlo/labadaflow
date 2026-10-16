import { notFound } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import { getOrderById } from '@/lib/data/orders'
import { formatMoney } from '@/lib/money'
import { formatDateTime } from '@/lib/time'
import { getShopName } from '@/lib/settings'
import { STATUS_CONFIG } from '@/lib/order-machine'
import { ArrowLeft } from 'lucide-react'
import { PrintButton } from './print-button'

export default async function OrderSlipPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const order = await getOrderById(orderId)

  if (!order) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const trackingUrl = `${baseUrl}/track/${order.tracking_code}`
  const qrDataUrl = await QRCode.toDataURL(trackingUrl, {
    margin: 1,
    width: 140,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  })

  return (
    <div className="mx-auto max-w-xl print:max-w-none print:w-full print:m-0 print:p-0">
      {/* Print stylesheet for clean receipt format */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                margin: 0.5cm;
              }
              html, body {
                background: white !important;
                color: black !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                height: auto !important;
              }
              .receipt-container {
                width: 100% !important;
                max-width: 80mm !important;
                margin: 0 auto !important;
                padding: 4mm 2mm !important;
                border: none !important;
                box-shadow: none !important;
                font-size: 11px !important;
                color: black !important;
                background: white !important;
              }
              .receipt-container * {
                color: black !important;
              }
              .receipt-container table {
                font-size: 11px !important;
              }
              .receipt-container h1 {
                font-size: 18px !important;
              }
            }
          `,
        }}
      />

      <div className="mb-4 print:hidden">
        <Link
          href={`/orders/${order.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to order {order.order_number}
        </Link>
      </div>

      <div className="receipt-container rounded-lg border bg-white p-6 text-black sm:p-8 print:rounded-none print:border-0 dark:bg-white dark:text-black">
        {/* Header */}
        <div className="mb-5 border-b border-neutral-200 pb-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{getShopName()}</h1>
          <p className="mt-1 font-mono text-sm font-semibold text-neutral-800">
            {order.order_number}
          </p>
          <p className="text-xs text-neutral-500">Laundry Order Slip</p>
        </div>

        {/* Order Details */}
        <dl className="mb-5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:text-sm">
          <dt className="font-semibold text-neutral-500">Order #</dt>
          <dd className="font-mono font-semibold">{order.order_number}</dd>
          <dt className="font-semibold text-neutral-500">Tracking Code</dt>
          <dd className="font-mono text-xs">{order.tracking_code}</dd>
          <dt className="font-semibold text-neutral-500">Customer</dt>
          <dd className="font-medium">{order.customer.full_name}</dd>
          <dt className="font-semibold text-neutral-500">Phone</dt>
          <dd>{order.customer.phone ?? '—'}</dd>
          <dt className="font-semibold text-neutral-500">Received</dt>
          <dd>{formatDateTime(order.received_at)}</dd>
          {order.due_at && (
            <>
              <dt className="font-semibold text-neutral-500">Due Date</dt>
              <dd>{formatDateTime(order.due_at)}</dd>
            </>
          )}
          <dt className="font-semibold text-neutral-500">Status</dt>
          <dd className="font-medium">{STATUS_CONFIG[order.status]?.label ?? order.status}</dd>
        </dl>

        {/* Line Items Table */}
        <table className="w-full border-y border-neutral-200 text-xs sm:text-sm tabular-nums">
          <thead>
            <tr className="text-left text-neutral-500">
              <th className="py-1.5 font-medium">Service</th>
              <th className="py-1.5 text-center font-medium">Qty</th>
              <th className="py-1.5 text-right font-medium">Price</th>
              <th className="py-1.5 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.id} className="border-t border-neutral-100">
                <td className="py-1.5 font-medium">{item.service_name}</td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-right text-neutral-600">{formatMoney(item.unit_price_cents)}</td>
                <td className="text-right font-medium">{formatMoney(item.line_total_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total Due */}
        <div className="mt-4 flex items-baseline justify-between gap-2 border-t border-dashed border-neutral-300 pt-3">
          <span className="text-sm font-semibold text-neutral-700">Total due on pickup</span>
          <span className="text-2xl font-bold tracking-tight tabular-nums">
            {formatMoney(order.total_cents)}
          </span>
        </div>

        {order.notes && (
          <p className="mt-4 rounded bg-neutral-100 p-2.5 text-xs text-neutral-700">
            <span className="font-semibold">Notes: </span>{order.notes}
          </p>
        )}

        {/* QR Code and Tracking Info */}
        <div className="mt-6 border-t border-neutral-200 pt-5 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt={`QR code to track order ${order.order_number}`}
            className="mx-auto h-28 w-28"
          />
          <p className="mt-2 font-mono text-[11px] text-neutral-600">
            {order.tracking_code}
          </p>
          <p className="mt-1 font-mono text-[10px] break-all text-neutral-500">
            {trackingUrl}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Scan to track live order progress online anytime.
          </p>
        </div>

        <div className="mt-6 text-center print:hidden">
          <PrintButton trackingUrl={trackingUrl} />
        </div>
      </div>
    </div>
  )
}
