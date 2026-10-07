'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createOrder } from '@/lib/actions/orders'
import { formatMoney } from '@/lib/money'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, UserPlus, TriangleAlert } from 'lucide-react'
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

  const rowError = (row: { service_id: string; quantity: number }) =>
    !row.service_id ? 'Select a service.' : row.quantity <= 0 ? 'Quantity must be positive.' : null

  function submit() {
    setError(null)
    if (customers.length === 0) return setError('No customers yet. Create a customer first.')
    if (services.length === 0) return setError('No active services. Ask an admin to add services first.')
    if (!customerId) return setError('Please select a customer.')
    if (rows.length === 0 || rows.some(r => rowError(r))) {
      return setError('Every item needs a service and a positive quantity.')
    }
    startTransition(async () => {
      const result = await createOrder({
        customer_id: customerId,
        source: 'WALK_IN',
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        notes: notes.trim() || null,
        items: rows,
      })
      if (result?.error) setError(result.error)
      else if (result.success && result.id) router.push(`/orders/${result.id}`)
    })
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
      <Card className="gap-0 py-0 lg:col-span-2">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-[13px]">Order details</CardTitle>
          <CardDescription>Customer → items → pickup estimate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-4 pb-4">
          <section aria-labelledby="new-order-customer" className="space-y-2">
            <h2 id="new-order-customer" className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Customer
            </h2>
            {customers.length === 0 ? (
              <p className="rounded-md border border-dashed p-3 text-[13px] text-muted-foreground">
                No customers yet.{' '}
                <Link href="/customers" className="font-medium text-foreground hover:underline">
                  Create a customer first
                </Link>
                .
              </p>
            ) : (
              <>
                <Label htmlFor="customer">Customer *</Label>
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
                <Link href="/customers" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  New customer? Add them in Customers first
                </Link>
              </>
            )}
          </section>

          <Separator />

          <section aria-labelledby="new-order-items" className="space-y-2.5">
            <h2 id="new-order-items" className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Services / items
            </h2>
            {services.length === 0 ? (
              <p className="rounded-md border border-dashed p-3 text-[13px] text-muted-foreground">
                No active services. Ask an admin to add services before creating orders.
              </p>
            ) : (
              <>
                {rows.map((row, i) => {
                  const err = rowError(row)
                  const svc = services.find(s => s.id === row.service_id)
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex gap-2">
                        <Select
                          value={row.service_id}
                          onValueChange={v => {
                            if (v !== null) {
                              setRows(prev => prev.map((x, idx) => (idx === i ? { ...x, service_id: v } : x)))
                            }
                          }}
                        >
                          <SelectTrigger className="min-w-0 flex-1" aria-label={`Service ${i + 1}`}>
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
                          className="tnum w-20 shrink-0"
                          aria-label={`Quantity ${i + 1} (${svc ? `${formatMoney(svc.unit_price_cents)} per ${svc.pricing_unit === 'PER_KG' ? 'kg' : 'piece'}` : 'quantity'})`}
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                          onClick={() => setRows(r => r.filter((_, idx) => idx !== i))}
                          disabled={rows.length === 1 || isPending}
                          aria-label={`Remove item ${i + 1}`}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                      {err && row.service_id !== '' && (
                        <p className="text-xs text-destructive">{err}</p>
                      )}
                    </div>
                  )
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRows(r => [...r, { service_id: '', quantity: 1 }])}
                  disabled={isPending}
                >
                  <Plus aria-hidden="true" /> Add item
                </Button>
              </>
            )}
          </section>

          <Separator />

          <section aria-labelledby="new-order-pickup" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <h2 id="new-order-pickup" className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase sm:col-span-2">
              Due date & notes
            </h2>
            <div className="space-y-2">
              <Label htmlFor="due">Estimated ready date (optional)</Label>
              <Input id="due" type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                maxLength={1000}
                placeholder="Stains, preferences, packaging…"
                rows={1}
              />
            </div>
          </section>

          {error && (
            <p className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-[13px] text-destructive" role="alert">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="h-fit gap-0 py-0 lg:sticky lg:top-6">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-[13px]">Summary</CardTitle>
          <CardDescription>{rows.length} item{rows.length === 1 ? '' : 's'} · pay on pickup</CardDescription>
        </CardHeader>
        <CardContent className="tnum space-y-3 px-4 pb-4">
          <dl className="space-y-1.5 text-[13px]">
            {rows.map((row, i) => {
              const svc = services.find(s => s.id === row.service_id)
              if (!svc) return null
              return (
                <div key={i} className="flex justify-between gap-2">
                  <dt className="truncate text-muted-foreground">
                    {row.quantity}× {svc.name}
                  </dt>
                  <dd className="shrink-0 font-medium">
                    {formatMoney(Math.round(svc.unit_price_cents * row.quantity))}
                  </dd>
                </div>
              )
            })}
          </dl>
          <Separator />
          <div className="flex items-baseline justify-between gap-2 border-t pt-3">
            <span className="text-[13px] font-medium">Total</span>
            <span className="text-xl font-semibold tracking-tight" aria-live="polite">{formatMoney(Math.round(total))}</span>
          </div>
          <p className="text-xs text-muted-foreground">Pay on pickup — payment is recorded when a READY order is completed.</p>
          <Button onClick={submit} disabled={isPending} className="w-full" size="lg" aria-busy={isPending}>
            {isPending ? 'Creating…' : 'Create Order'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Order starts at Received.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
