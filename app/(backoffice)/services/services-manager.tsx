'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createService, updateService, toggleServiceActive } from '@/lib/actions/services'
import { formatMoney, pesosToCentavos, centavosToPesos } from '@/lib/money'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EmptyState } from '@/components/app/empty-state'
import { Package } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { ServiceItem } from '@/lib/data/services'

interface ServicesManagerProps {
  services: ServiceItem[]
  canEdit: boolean
}

export function ServicesManager({ services, canEdit }: ServicesManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [pricingUnit, setPricingUnit] = useState<'PER_KG' | 'PER_PIECE'>('PER_KG')
  const [editPricingUnit, setEditPricingUnit] = useState<Record<string, 'PER_KG' | 'PER_PIECE'>>({})

  function submitCreate(formData: FormData) {
    setError(null)
    formData.set('pricing_unit', pricingUnit)
    const pesos = Number(formData.get('unit_price_pesos'))
    if (!Number.isFinite(pesos) || pesos < 0) {
      setError('Enter a valid unit price.')
      return
    }
    formData.set('unit_price_cents', String(pesosToCentavos(pesos)))
    formData.delete('unit_price_pesos')
    startTransition(async () => {
      const result = await createService(formData)
      if (result?.error) setError(result.error)
      else {
        router.refresh()
        ;(document.getElementById('service-create-form') as HTMLFormElement)?.reset()
      }
    })
  }

  function submitUpdate(formData: FormData, service: ServiceItem) {
    setError(null)
    formData.set('id', service.id)
    formData.set('pricing_unit', editPricingUnit[service.id] ?? service.pricing_unit)
    const pesos = Number(formData.get('unit_price_pesos'))
    if (!Number.isFinite(pesos) || pesos < 0) {
      setError('Enter a valid unit price.')
      return
    }
    formData.set('unit_price_cents', String(pesosToCentavos(pesos)))
    formData.delete('unit_price_pesos')
    startTransition(async () => {
      const result = await updateService(formData)
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  function toggle(id: string, isActive: boolean) {
    setError(null)
    startTransition(async () => {
      const result = await toggleServiceActive(id, isActive)
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {services.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No services yet"
          description={canEdit ? 'Create your first service — orders are priced from this catalog.' : 'No services available yet.'}
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden gap-0 overflow-hidden py-0 md:block">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-[13px]">Catalog</CardTitle>
              <CardDescription>Inactive services stay hidden from new orders</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table aria-label="Services">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-9 pl-4 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Name</TableHead>
                    <TableHead className="h-9 text-right text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Unit price</TableHead>
                    <TableHead className="h-9 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Unit</TableHead>
                    <TableHead className="h-9 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Status</TableHead>
                    {canEdit && (
                      <TableHead className="h-9 pr-4 text-right text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map(s => (
                    <TableRow key={s.id} className={`h-12 hover:bg-muted/40 ${s.is_active ? '' : 'opacity-60'}`}>
                      <TableCell className="pl-4">
                        <div className="text-[13px] font-medium">{s.name}</div>
                        {s.description && <div className="mt-0.5 max-w-sm truncate text-xs text-muted-foreground">{s.description}</div>}
                      </TableCell>
                      <TableCell className="tnum text-right text-[13px] font-semibold">{formatMoney(s.unit_price_cents)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.pricing_unit === 'PER_KG' ? 'Per kg' : 'Per piece'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 text-xs ${s.is_active ? 'text-foreground' : 'text-muted-foreground'}`} aria-label={s.is_active ? `${s.name} active` : `${s.name} inactive`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${s.is_active ? 'bg-green-500' : 'bg-muted-foreground/40'}`} aria-hidden="true" />
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="pr-4 text-right">
                          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => toggle(s.id, !s.is_active)} disabled={isPending}>
                            {s.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile compact list */}
          <ul className="space-y-2 md:hidden" aria-label="Services">
            {services.map(s => (
              <li
                key={s.id}
                className={`rounded-lg border bg-card p-3 ${s.is_active ? '' : 'opacity-70'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-[13px] font-medium">{s.name}</p>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs ${s.is_active ? 'text-foreground' : 'text-muted-foreground'}`} aria-label={s.is_active ? `${s.name} active` : `${s.name} inactive`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${s.is_active ? 'bg-green-500' : 'bg-muted-foreground/40'}`} aria-hidden="true" />
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {s.description && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{s.description}</p>
                )}
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <p className="tnum text-[13px]">
                    <span className="font-semibold">{formatMoney(s.unit_price_cents)}</span>
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {s.pricing_unit === 'PER_KG' ? 'Per kg' : 'Per piece'}
                    </span>
                  </p>
                  {canEdit && (
                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => toggle(s.id, !s.is_active)} disabled={isPending}>
                      {s.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {canEdit && (
        <>
          <Card className="gap-0 py-0">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-[13px]">New Service</CardTitle>
              <CardDescription>Appears in new-order pricing immediately</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <form id="service-create-form" action={submitCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" name="name" required maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" maxLength={500} />
                </div>
                <div className="space-y-2">
                  <Label>Pricing unit</Label>
                  <Select value={pricingUnit} onValueChange={v => setPricingUnit(v as 'PER_KG' | 'PER_PIECE')}>
                    <SelectTrigger aria-label="Pricing unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PER_KG">Per kg</SelectItem>
                      <SelectItem value="PER_PIECE">Per piece</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_price_pesos">Unit price (₱) *</Label>
                  <Input id="unit_price_pesos" name="unit_price_pesos" type="number" min={0} step="0.01" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Sort order</Label>
                  <Input id="sort_order" name="sort_order" type="number" defaultValue={0} />
                </div>
                {error && <p className="text-xs text-destructive sm:col-span-2" role="alert">{error}</p>}
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Saving…' : 'Create Service'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="gap-0 py-0">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-[13px]">Edit Services</CardTitle>
              <CardDescription>Price changes apply to future orders only</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="divide-y divide-border">
                {services.map(s => (
                  <form key={s.id} action={fd => submitUpdate(fd, s)} className="grid grid-cols-1 gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input name="name" required maxLength={100} defaultValue={s.name} aria-label={`Name for ${s.name}`} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input name="description" defaultValue={s.description ?? ''} aria-label={`Description for ${s.name}`} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pricing unit</Label>
                    <Select
                      value={editPricingUnit[s.id] ?? s.pricing_unit}
                      onValueChange={v => setEditPricingUnit(prev => ({ ...prev, [s.id]: v as 'PER_KG' | 'PER_PIECE' }))}
                    >
                      <SelectTrigger aria-label={`Pricing unit for ${s.name}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PER_KG">Per kg</SelectItem>
                        <SelectItem value="PER_PIECE">Per piece</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unit price (₱)</Label>
                    <Input
                      name="unit_price_pesos"
                      type="number"
                      min={0}
                      step="0.01"
                      required
                      defaultValue={centavosToPesos(s.unit_price_cents)}
                      aria-label={`Unit price for ${s.name}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sort order</Label>
                    <Input name="sort_order" type="number" defaultValue={s.sort_order} aria-label={`Sort order for ${s.name}`} />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" variant="outline" disabled={isPending}>Save</Button>
                  </div>
                </form>
              ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
