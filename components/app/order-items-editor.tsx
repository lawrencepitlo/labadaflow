'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateOrderItems } from '@/lib/actions/orders'
import { formatMoney } from '@/lib/money'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import type { ServiceItem } from '@/lib/data/services'
import type { OrderItemDTO } from '@/lib/data/orders'

interface OrderItemsEditorProps {
  orderId: string
  items: OrderItemDTO[]
  services: ServiceItem[]
}

export function OrderItemsEditor({ orderId, items, services }: OrderItemsEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState(
    items.map(i => ({ service_id: i.service_id ?? '', quantity: i.quantity }))
  )

  function updateRow(index: number, patch: Partial<{ service_id: string; quantity: number }>) {
    setRows(rows => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function save() {
    setError(null)
    const valid = rows.every(r => r.service_id && r.quantity > 0)
    if (!valid || rows.length === 0) {
      setError('Each item needs a service and a positive quantity.')
      return
    }
    startTransition(async () => {
      const result = await updateOrderItems({ order_id: orderId, items: rows })
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-2.5">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <Select value={row.service_id} onValueChange={v => { if (v !== null) updateRow(i, { service_id: v }) }}>
            <SelectTrigger className="min-w-0 flex-1" aria-label={`Service for item ${i + 1}`}>
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent>
              {services.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} — {formatMoney(s.unit_price_cents)} / {s.pricing_unit === 'PER_KG' ? 'kg' : 'piece'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={0.001}
            step="any"
            value={row.quantity}
            onChange={e => updateRow(i, { quantity: Number(e.target.value) })}
            className="tnum w-20 shrink-0"
            aria-label={`Quantity for item ${i + 1}`}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => setRows(rows => rows.filter((_, idx) => idx !== i))}
            aria-label={`Remove item ${i + 1}`}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRows(rows => [...rows, { service_id: '', quantity: 1 }])}
        >
          <Plus /> Add item
        </Button>
        <Button size="sm" onClick={save} disabled={isPending}>
          {isPending ? 'Saving…' : 'Save items'}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  )
}
