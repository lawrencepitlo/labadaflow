import { notFound } from 'next/navigation'
import Link from 'next/link'
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

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 print:hidden">
        <Link href={`/orders/${order.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to order {order.order_number}
        </Link>
      </div>
      <div className="rounded-lg border bg-white p-6 text-black sm:p-8 print:rounded-none print:border-0 dark:bg-white dark:text-black">
        <div className="mb-6 border-b border-neutral-200 pb-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{getShopName()}</h1>
          <p className="mt-1 text-sm text-neutral-500">Laundry Order Slip · {order.order_number}</p>
        </div>

        <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
          <dt className="font-semibold text-neutral-500">Order #</dt><dd className="font-semibold">{order.order_number}</dd>
          <dt className="font-semibold text-neutral-500">Tracking code</dt><dd className="font-mono text-xs">{order.tracking_code}</dd>
          <dt className="font-semibold text-neutral-500">Customer</dt><dd>{order.customer.full_name}</dd>
          <dt className="font-semibold text-neutral-500">Phone</dt><dd>{order.customer.phone ?? '—'}</dd>
          <dt className="font-semibold text-neutral-500">Received</dt><dd>{formatDateTime(order.received_at)}</dd>
          {order.due_at && (<><dt className="font-semibold text-neutral-500">Due</dt><dd>{formatDateTime(order.due_at)}</dd></>)}
          <dt className="font-semibold text-neutral-500">Status</dt><dd className="font-medium">{STATUS_CONFIG[order.status]?.label ?? order.status}</dd>
        </dl>

        <table className="w-full border-y border-neutral-200 text-sm tabular-nums">
          <thead>
            <tr className="text-left text-neutral-500">
              <th className="py-2 font-medium">Service</th>
              <th className="font-medium">Qty</th>
              <th className="font-medium">Unit price</th>
              <th className="py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.id} className="border-t border-neutral-100">
                <td className="py-2 font-medium">{item.service_name}</td>
                <td>{item.quantity}</td>
                <td>{formatMoney(item.unit_price_cents)}</td>
                <td className="text-right font-medium">{formatMoney(item.line_total_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex items-baseline justify-between gap-2 border-t border-dashed border-neutral-200 pt-4">
          <span className="text-sm text-neutral-500">Total due on pickup</span>
          <span className="text-2xl font-bold tracking-tight tabular-nums">{formatMoney(order.total_cents)}</span>
        </div>

        {order.notes && (
          <p className="mt-4 rounded bg-neutral-100 p-3 text-xs text-neutral-600">
            <span className="font-semibold">Notes: </span>{order.notes}
          </p>
        )}

        <p className="mt-8 text-center text-xs text-neutral-500">
          Track this order at /track/{order.tracking_code}
        </p>

        <div className="mt-8 text-center print:hidden">
          <PrintButton />
        </div>
      </div>
    </div>
  )
}
