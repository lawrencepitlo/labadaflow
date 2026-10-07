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
import { Badge } from '@/components/ui/badge'
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
            <CardHeader className="px-4 py-3 sm:px-6">
              <CardTitle className="text-sm">Catalog</CardTitle>
              <CardDescription>Inactive services stay hidden from new orders</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table aria-label="Services">
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="pl-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Name</TableHead>
                    <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Unit price</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Unit</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</TableHead>
                    {canEdit && (
                      <TableHead className="pr-4 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map(s => (
                    <TableRow key={s.id} className={`hover:bg-muted/40 ${s.is_active ? '' : 'opacity-60'}`}>
                      <TableCell className="pl-4">
                        <div className="text-sm font-semibold">{s.name}</div>
                        {s.description && <div className="mt-0.5 max-w-sm truncate text-xs text-muted-foreground">{s.description}</div>}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold tabular-nums">{formatMoney(s.unit_price_cents)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.pricing_unit === 'PER_KG' ? 'Per kg' : 'Per piece'}</TableCell>
                      <TableCell>
                        <Badge variant={s.is_active ? 'default' : 'secondary'} aria-label={s.is_active ? `${s.name} active` : `${s.name} inactive`}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="pr-4 text-right">
                          <Button variant="outline" size="sm" onClick={() => toggle(s.id, !s.is_active)} disabled={isPending}>
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
                className={`rounded-lg border bg-card p-3.5 ${s.is_active ? '' : 'opacity-70'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-semibold">{s.name}</p>
                  <Badge variant={s.is_active ? 'default' : 'secondary'} aria-label={s.is_active ? `${s.name} active` : `${s.name} inactive`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {s.description && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{s.description}</p>
                )}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-sm">
                    <span className="font-semibold tabular-nums">{formatMoney(s.unit_price_cents)}</span>
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {s.pricing_unit === 'PER_KG' ? 'Per kg' : 'Per piece'}
                    </span>
                  </p>
                  {canEdit && (
                    <Button variant="outline" size="sm" onClick={() => toggle(s.id, !s.is_active)} disabled={isPending}>
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
            <CardHeader className="px-4 py-3 sm:px-6">
              <CardTitle className="text-sm">New Service</CardTitle>
              <CardDescription>Appears in new-order pricing immediately</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
              <form id="service-create-form" action={submitCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                {error && <p className="text-sm text-destructive sm:col-span-2" role="alert">{error}</p>}
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Saving…' : 'Create Service'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="gap-0 py-0">
            <CardHeader className="px-4 py-3 sm:px-6">
              <CardTitle className="text-sm">Edit Services</CardTitle>
              <CardDescription>Price changes apply to future orders only</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
              <div className="divide-y divide-border">
                {services.map(s => (
                  <form key={s.id} action={fd => submitUpdate(fd, s)} className="grid grid-cols-1 gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-2">
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
