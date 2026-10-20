'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createPortalOrder } from '@/lib/actions/orders'
import { formatMoney } from '@/lib/money'
import { type ServiceItem } from '@/lib/data/services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import {
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Shirt,
  Scale,
  Calendar,
  Phone,
  AlertCircle,
  Clock,
  ShieldCheck,
  Check,
} from 'lucide-react'

interface PortalOrderFormProps {
  services: ServiceItem[]
  customerPhone?: string | null
  customerName?: string | null
  customerEmail?: string | null
}

export function PortalOrderForm({
  services,
  customerPhone = '',
  customerName = '',
  customerEmail = '',
}: PortalOrderFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Service item quantities: { [serviceId]: quantity }
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  // Category filter
  const [filter, setFilter] = useState<'ALL' | 'PER_KG' | 'PER_PIECE'>('ALL')

  // Additional fields
  const [phone, setPhone] = useState(customerPhone ?? '')
  const [notes, setNotes] = useState('')
  const [dropOffEstimate, setDropOffEstimate] = useState('Today')

  // Filtered services list
  const filteredServices = useMemo(() => {
    if (filter === 'ALL') return services
    return services.filter(s => s.pricing_unit === filter)
  }, [services, filter])

  function handleIncrement(serviceId: string, step = 1) {
    setQuantities(prev => {
      const current = prev[serviceId] || 0
      return { ...prev, [serviceId]: current + step }
    })
  }

  function handleDecrement(serviceId: string, step = 1) {
    setQuantities(prev => {
      const current = prev[serviceId] || 0
      const next = Math.max(0, current - step)
      if (next === 0) {
        const copy = { ...prev }
        delete copy[serviceId]
        return copy
      }
      return { ...prev, [serviceId]: next }
    })
  }

  function handleQuantityChange(serviceId: string, val: string) {
    const num = Number.parseFloat(val)
    if (Number.isNaN(num) || num <= 0) {
      setQuantities(prev => {
        const copy = { ...prev }
        delete copy[serviceId]
        return copy
      })
    } else {
      setQuantities(prev => ({ ...prev, [serviceId]: num }))
    }
  }

  // Active selected items list & total calculation
  const selectedItems = useMemo(() => {
    return Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([svcId, qty]) => {
        const svc = services.find(s => s.id === svcId)
        const unitPriceCents = svc?.unit_price_cents ?? 0
        const lineTotalCents = Math.round(unitPriceCents * qty)
        return {
          serviceId: svcId,
          serviceName: svc?.name ?? 'Service',
          pricingUnit: svc?.pricing_unit ?? 'PER_KG',
          unitPriceCents,
          quantity: qty,
          lineTotalCents,
        }
      })
  }, [quantities, services])

  const subtotalCents = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.lineTotalCents, 0)
  }, [selectedItems])

  const totalItemCount = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.quantity, 0)
  }, [selectedItems])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (selectedItems.length === 0) {
      setError('Please add at least one laundry item or service.')
      return
    }

    startTransition(async () => {
      const combinedNotes = [
        dropOffEstimate ? `Estimated Drop-off: ${dropOffEstimate}` : null,
        notes.trim() ? `Instructions: ${notes.trim()}` : null,
      ]
        .filter(Boolean)
        .join(' · ')

      const res = await createPortalOrder({
        phone: phone.trim() || null,
        notes: combinedNotes || null,
        items: selectedItems.map(item => ({
          service_id: item.serviceId,
          quantity: item.quantity,
        })),
      })

      if (res.error || !res.id) {
        setError(res.error || 'Failed to submit order. Please try again.')
        return
      }

      router.push(`/portal/orders/${res.id}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive font-medium"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Selection Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filter === 'ALL'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              All Services ({services.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('PER_KG')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filter === 'PER_KG'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Scale className="h-3.5 w-3.5" />
              By Kilo (Wash & Fold)
            </button>
            <button
              type="button"
              onClick={() => setFilter('PER_PIECE')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filter === 'PER_PIECE'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Shirt className="h-3.5 w-3.5" />
              Per Piece (Shirts, Pants, Linens)
            </button>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredServices.map(svc => {
              const qty = quantities[svc.id] || 0
              const isSelected = qty > 0
              const isKg = svc.pricing_unit === 'PER_KG'

              return (
                <div
                  key={svc.id}
                  className={`group relative flex flex-col justify-between rounded-xl border p-4 transition-all ${
                    isSelected
                      ? 'border-primary/60 bg-primary/5 shadow-xs ring-1 ring-primary/20'
                      : 'border-border/80 bg-card hover:border-border hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            isKg
                              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {isKg ? <Scale className="h-4 w-4" /> : <Shirt className="h-4 w-4" />}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground leading-tight">
                            {svc.name}
                          </h3>
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {isKg ? 'By Weight' : 'Per Item'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-foreground">
                          {formatMoney(svc.unit_price_cents)}
                        </span>
                        <span className="block text-[10px] text-muted-foreground">
                          /{isKg ? 'kg' : 'pc'}
                        </span>
                      </div>
                    </div>

                    {svc.description && (
                      <p className="mt-2.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {svc.description}
                      </p>
                    )}
                  </div>

                  {/* Stepper Controls */}
                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                    <span className="text-[11px] text-muted-foreground">
                      {isKg ? 'Estimated weight' : 'Number of items'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-md"
                        disabled={qty <= 0}
                        onClick={() => handleDecrement(svc.id, isKg ? 1 : 1)}
                        aria-label={`Decrease ${svc.name}`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>

                      <Input
                        type="number"
                        min="0"
                        step={isKg ? '0.5' : '1'}
                        value={qty === 0 ? '' : qty}
                        placeholder="0"
                        onChange={e => handleQuantityChange(svc.id, e.target.value)}
                        className="h-7 w-14 text-center font-mono text-xs font-semibold p-1"
                      />

                      <Button
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        size="icon"
                        className="h-7 w-7 rounded-md"
                        onClick={() => handleIncrement(svc.id, isKg ? 1 : 1)}
                        aria-label={`Increase ${svc.name}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Instructions and Drop-off Preferences */}
          <Card className="gap-0 py-0">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-[13px] flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Drop-off & Garment Care Instructions
              </CardTitle>
              <CardDescription>
                Let us know when to expect your clothes and any special washing requests.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="dropoff" className="text-xs font-medium">
                    When will you drop off your laundry?
                  </Label>
                  <Input
                    id="dropoff"
                    value={dropOffEstimate}
                    onChange={e => setDropOffEstimate(e.target.value)}
                    placeholder="e.g. Today 2:00 PM, Tomorrow morning"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-medium">
                    Contact Phone Number <span className="text-muted-foreground">(for SMS update)</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 0917 123 4567"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-medium">
                  Special Instructions or Stain Notes
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Separate white dress shirts; food stain on red polo collar; please use mild softener."
                  rows={2}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sticky Summary Column */}
        <div className="space-y-4 lg:sticky lg:top-20">
          <Card className="gap-0 py-0 border-primary/20 shadow-sm">
            <CardHeader className="bg-primary/5 px-4 py-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Order Summary
                </CardTitle>
                <span className="text-xs font-mono font-medium text-muted-foreground">
                  {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {selectedItems.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  <p>No services selected yet.</p>
                  <p className="mt-1 text-[11px]">Click [+] on any service on the left to add items.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border/60 text-xs">
                  {selectedItems.map(item => (
                    <li key={item.serviceId} className="flex items-center justify-between py-2">
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-foreground truncate">{item.serviceName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.quantity} {item.pricingUnit === 'PER_KG' ? 'kg' : 'pcs'} × {formatMoney(item.unitPriceCents)}
                        </p>
                      </div>
                      <span className="font-semibold text-foreground shrink-0">
                        {formatMoney(item.lineTotalCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <Separator />

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-sm font-bold text-foreground">Estimated Total</span>
                  <span className="block text-[10px] text-muted-foreground">
                    Final weight confirmed at counter scale
                  </span>
                </div>
                <span className="text-xl font-bold font-mono tracking-tight text-primary">
                  {formatMoney(subtotalCents)}
                </span>
              </div>

              {/* No online payment notice */}
              <div className="rounded-lg bg-emerald-500/10 p-3 text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>No Online Payment Needed</span>
                </div>
                <p className="text-muted-foreground dark:text-emerald-400/80 leading-normal">
                  Pay at the shop via Cash or GCash when you drop off or pick up your laundry.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isPending || selectedItems.length === 0}
                className="w-full h-10 font-semibold"
              >
                {isPending ? (
                  'Creating Your Drop-off Pass...'
                ) : (
                  <>
                    Confirm Booking & Get Pass
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* How It Works Callout */}
          <div className="rounded-xl border border-dashed p-4 text-xs space-y-2 text-muted-foreground bg-card/60">
            <h4 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-primary" />
              How it works:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
              <li>Book your items & get your instant QR Pass.</li>
              <li>Bring your laundry to our shop counter.</li>
              <li>Show your phone screen — staff scans it & starts washing!</li>
            </ol>
          </div>
        </div>
      </div>
    </form>
  )
}
