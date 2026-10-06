import { notFound } from 'next/navigation'
import { getOrderById } from '@/lib/data/orders'
import { formatMoney } from '@/lib/money'
import { formatDateTime } from '@/lib/time'
import { getShopName } from '@/lib/settings'
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
    <div className="max-w-2xl mx-auto bg-white text-black p-8 print:p-0">
      <div className="text-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold">{getShopName()}</h1>
        <p className="text-sm">Order Slip</p>
      </div>

      <dl className="grid grid-cols-2 gap-y-1 text-sm mb-6">
        <dt className="font-semibold">Order #</dt><dd>{order.order_number}</dd>
        <dt className="font-semibold">Tracking Code</dt><dd className="font-mono text-xs">{order.tracking_code}</dd>
        <dt className="font-semibold">Customer</dt><dd>{order.customer.full_name}</dd>
        <dt className="font-semibold">Phone</dt><dd>{order.customer.phone ?? '—'}</dd>
        <dt className="font-semibold">Received</dt><dd>{formatDateTime(order.received_at)}</dd>
        {order.due_at && (<><dt className="font-semibold">Due</dt><dd>{formatDateTime(order.due_at)}</dd></>)}
        <dt className="font-semibold">Status</dt><dd>{order.status}</dd>
      </dl>

      <table className="w-full text-sm border-t border-b">
        <thead>
          <tr className="text-left">
            <th className="py-2">Service</th>
            <th>Qty</th>
            <th>Unit</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map(item => (
            <tr key={item.id} className="border-t">
              <td className="py-2">{item.service_name}</td>
              <td>{item.quantity}</td>
              <td>{formatMoney(item.unit_price_cents)}</td>
              <td className="text-right">{formatMoney(item.line_total_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mt-4 text-xl font-bold">
        Total: {formatMoney(order.total_cents)}
      </div>

      <p className="mt-8 text-center text-xs text-gray-500">
        Track this order at /track/{order.tracking_code}
      </p>

      <div className="print:hidden mt-8 text-center">
        <PrintButton />
      </div>
    </div>
  )
}
