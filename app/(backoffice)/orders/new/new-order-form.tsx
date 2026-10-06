'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createOrder } from '@/lib/actions/orders'
import { formatMoney } from '@/lib/money'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'
import type { ServiceItem } from '@/lib/data/services'

interface NewOrderFormProps {
  customers: { id: string; full_name: string; phone: string | null }[]
  services: ServiceItem[]
}

export function NewOrderForm({ customers, services }: NewOrderFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState<{ service_id: string; quantity: number }[]>([
    { service_id: '', quantity: 1 },
  ])

  const total = rows.reduce((sum, r) => {
    const svc = services.find(s => s.id === r.service_id)
    return sum + (svc ? svc.unit_price_cents * r.quantity : 0)
  }, 0)

  function submit() {
    setError(null)
    if (!customerId) return setError('Please select a customer.')
    if (rows.length === 0 || rows.some(r => !r.service_id || r.quantity <= 0)) {
      return setError('Every item needs a service and a positive quantity.')
    }
    startTransition(async () => {
      const result = await createOrder({
        customer_id: customerId,
        source: 'WALK_IN',
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        notes: notes || null,
        items: rows,
      })
      if (result?.error) setError(result.error)
      else if (result.success && result.id) router.push(`/orders/${result.id}`)
    })
  }

  return (
    <Card className="border-2">
      <CardHeader className="px-6 py-4">
        <CardTitle className="text-lg">Order details</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="customer">Customer</Label>
          <Select value={customerId} onValueChange={v => { if (v !== null) setCustomerId(v) }}>
            <SelectTrigger id="customer">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.full_name}{c.phone ? ` — ${c.phone}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Items</Label>
          {rows.map((row, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-2">
              <Select
                value={row.service_id}
                onValueChange={v => {
                  if (v !== null) {
                    setRows(prev => prev.map((x, idx) => (idx === i ? { ...x, service_id: v } : x)))
                  }
                }}
              >
                <SelectTrigger className="flex-1" aria-label={`Service ${i + 1}`}>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {formatMoney(s.unit_price_cents)} / {s.pricing_unit === 'PER_KG' ? 'kg' : 'pc'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={0.001}
                step="any"
                value={row.quantity}
                onChange={e => setRows(r => r.map((x, idx) => idx === i ? { ...x, quantity: Number(e.target.value) } : x))}
                className="w-full sm:w-28"
                aria-label={`Quantity ${i + 1}`}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRows(r => r.filter((_, idx) => idx !== i))}
                aria-label={`Remove item ${i + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRows(r => [...r, { service_id: '', quantity: 1 }])}
          >
            <Plus className="w-4 h-4 mr-1" /> Add item
          </Button>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="due">Estimated ready date (optional)</Label>
          <Input id="due" type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} maxLength={1000} />
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-muted-foreground">Estimated total</span>
          <span className="text-2xl font-bold">{formatMoney(Math.round(total))}</span>
        </div>

        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

        <Button onClick={submit} disabled={isPending} className="w-full sm:w-auto" size="lg">
          {isPending ? 'Creating…' : 'Create Order'}
        </Button>
      </CardContent>
    </Card>
  )
}