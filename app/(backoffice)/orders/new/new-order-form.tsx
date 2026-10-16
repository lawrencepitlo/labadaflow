'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createOrder } from '@/lib/actions/orders'
import { createCustomer } from '@/lib/actions/customers'
import { formatMoney } from '@/lib/money'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, UserPlus, TriangleAlert } from 'lucide-react'
import type { ServiceItem } from '@/lib/data/services'

interface CustomerOption {
  id: string
  full_name: string
  phone: string | null
}

interface NewOrderFormProps {
  customers: CustomerOption[]
  services: ServiceItem[]
  defaultDueDays?: number
}

function getDefaultDueDateTimeString(days: number) {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  // Format as YYYY-MM-DDTHH:MM local time
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function NewOrderForm({
  customers: initialCustomers,
  services,
  defaultDueDays = 3,
}: NewOrderFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Customer state & quick-add dialog
  const [customerList, setCustomerList] = useState<CustomerOption[]>(initialCustomers)
  const [customerId, setCustomerId] = useState('')
  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [quickCustomerError, setQuickCustomerError] = useState<string | null>(null)
  const [isCreatingCustomer, startCreateCustomer] = useTransition()

  // Due date prefilled
  const [dueAt, setDueAt] = useState(() => getDefaultDueDateTimeString(defaultDueDays))
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState<{ service_id: string; quantity: number }[]>([
    { service_id: '', quantity: 1 },
  ])

  // Merge items reactively for live total and summary display
  const mergedSummary = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of rows) {
      if (r.service_id && r.quantity > 0) {
        map.set(r.service_id, (map.get(r.service_id) || 0) + r.quantity)
      }
    }
    return Array.from(map.entries()).map(([serviceId, quantity]) => {
      const svc = services.find(s => s.id === serviceId)
      return {
        serviceId,
        name: svc ? svc.name : 'Unknown Service',
        unitPriceCents: svc ? svc.unit_price_cents : 0,
        pricingUnit: svc ? svc.pricing_unit : 'PER_KG',
        quantity,
        totalCents: Math.round((svc ? svc.unit_price_cents : 0) * quantity),
      }
    })
  }, [rows, services])

  const totalCents = useMemo(() => {
    return mergedSummary.reduce((sum, item) => sum + item.totalCents, 0)
  }, [mergedSummary])

  const rowError = (row: { service_id: string; quantity: number }) =>
    !row.service_id ? 'Select a service.' : row.quantity <= 0 ? 'Quantity must be positive.' : null

  function handleQuickCreateCustomer(e: React.FormEvent) {
    e.preventDefault()
    setQuickCustomerError(null)

    if (!newCustomerName.trim()) {
      setQuickCustomerError('Customer name is required.')
      return
    }

    const formData = new FormData()
    formData.append('full_name', newCustomerName.trim())
    if (newCustomerPhone.trim()) {
      formData.append('phone', newCustomerPhone.trim())
    }

    startCreateCustomer(async () => {
      const res = await createCustomer(formData)
      if (res?.error) {
        setQuickCustomerError(res.error)
      } else if (res?.success && res.id) {
        const newCust: CustomerOption = {
          id: res.id,
          full_name: newCustomerName.trim(),
          phone: newCustomerPhone.trim() || null,
        }
        setCustomerList(prev => [newCust, ...prev])
        setCustomerId(res.id)
        setQuickCustomerOpen(false)
        setNewCustomerName('')
        setNewCustomerPhone('')
      }
    })
  }

  function submit() {
    setError(null)
    if (customerList.length === 0) return setError('No customers yet. Create a customer first.')
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
    <>
      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs lg:col-span-2 space-y-6">
          <div className="border-b pb-3">
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Order Intake Details</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Select customer, specify services, and set estimated ready date</p>
          </div>
          <div className="space-y-6">
            <section aria-labelledby="new-order-customer" className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 id="new-order-customer" className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Customer
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuickCustomerError(null)
                    setQuickCustomerOpen(true)
                  }}
                  className="h-7 text-xs gap-1"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Quick Add Customer
                </Button>
              </div>

              {customerList.length === 0 ? (
                <div className="flex items-center justify-between rounded-md border border-dashed p-3 text-[13px] text-muted-foreground">
                  <span>No customers yet.</span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setQuickCustomerOpen(true)}
                  >
                    Add First Customer
                  </Button>
                </div>
              ) : (
                <>
                  <Label htmlFor="customer">Customer *</Label>
                  <Select value={customerId} onValueChange={v => { if (v !== null) setCustomerId(v) }}>
                    <SelectTrigger id="customer">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerList.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.full_name}{c.phone ? ` — ${c.phone}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                            className="tnum w-24 shrink-0"
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
                <Label htmlFor="due">Estimated ready date</Label>
                <Input id="due" type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} />
                <p className="text-[11px] text-muted-foreground">Default estimated window: {defaultDueDays} days</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  maxLength={1000}
                  placeholder="Stains, preferences, special instructions…"
                  rows={2}
                />
              </div>
            </section>

            {error && (
              <p className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive" role="alert">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </p>
            )}
          </div>
        </div>

        {/* Live Calculation & Summary Card */}
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs lg:sticky lg:top-6 space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Order Summary</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{mergedSummary.length} item line{mergedSummary.length === 1 ? '' : 's'} · pay upon collection</p>
          </div>
          
          <dl className="tnum space-y-2 text-xs">
            {mergedSummary.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No services selected yet.</p>
            ) : (
              mergedSummary.map(item => (
                <div key={item.serviceId} className="flex justify-between items-baseline gap-2 py-1 border-b border-border/40 last:border-b-0">
                  <dt className="truncate text-foreground font-medium">
                    {item.quantity} {item.pricingUnit === 'PER_KG' ? 'kg' : 'pc'} × {item.name}
                  </dt>
                  <dd className="shrink-0 font-semibold font-mono text-foreground">
                    {formatMoney(item.totalCents)}
                  </dd>
                </div>
              ))
            )}
          </dl>

          <div className="border-t pt-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-foreground">Estimated Total</span>
              <span className="text-2xl font-bold font-mono text-foreground" aria-live="polite">{formatMoney(totalCents)}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Payment method will be recorded at pickup (Cash, GCash, or Other).
            </p>
          </div>

          <Button onClick={submit} disabled={isPending} className="w-full h-11 text-sm font-semibold mt-2" size="lg" aria-busy={isPending}>
            {isPending ? 'Creating Order…' : 'Create Order & Print Slip'}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground">
            Order starts at Received stage on the operations board.
          </p>
        </div>
      </div>

      {/* Quick Create Customer Dialog */}
      <Dialog open={quickCustomerOpen} onOpenChange={setQuickCustomerOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleQuickCreateCustomer}>
            <DialogHeader>
              <DialogTitle>Quick Add Customer</DialogTitle>
              <DialogDescription>
                Create a customer immediately and continue with order creation.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3">
              {quickCustomerError && (
                <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 p-2 text-xs text-destructive">
                  {quickCustomerError}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="quick-cust-name">Full Name *</Label>
                <Input
                  id="quick-cust-name"
                  placeholder="e.g. Maria Santos"
                  value={newCustomerName}
                  onChange={e => setNewCustomerName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quick-cust-phone">Mobile Phone (optional)</Label>
                <Input
                  id="quick-cust-phone"
                  placeholder="e.g. 09171234567"
                  value={newCustomerPhone}
                  onChange={e => setNewCustomerPhone(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isCreatingCustomer}
                onClick={() => setQuickCustomerOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingCustomer}>
                {isCreatingCustomer ? 'Creating…' : 'Create & Select'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
