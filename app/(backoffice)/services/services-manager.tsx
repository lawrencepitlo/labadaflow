'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createService, updateService, toggleServiceActive } from '@/lib/actions/services'
import { formatMoney, pesosToCentavos, centavosToPesos } from '@/lib/money'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    <div className="space-y-8">
      {services.length === 0 ? (
        <p className="text-sm text-muted-foreground">No services yet.</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold pl-6">Name</TableHead>
                  <TableHead className="font-semibold">Unit Price</TableHead>
                  <TableHead className="font-semibold">Unit</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  {canEdit && <TableHead className="font-semibold pr-6">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map(s => (
                  <TableRow key={s.id} className="hover:bg-accent/30 transition-colors">
                    <TableCell className="pl-6">
                      <div className="font-medium">{s.name}</div>
                      {s.description && <div className="text-xs text-muted-foreground mt-0.5">{s.description}</div>}
                    </TableCell>
                    <TableCell className="font-semibold">{formatMoney(s.unit_price_cents)}</TableCell>
                    <TableCell className="text-muted-foreground">{s.pricing_unit === 'PER_KG' ? 'Per kg' : 'Per piece'}</TableCell>
                    <TableCell>
                      <Badge variant={s.is_active ? 'default' : 'secondary'}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="pr-6">
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
      )}

      {canEdit && (
        <>
          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-lg">New Service</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form id="service-create-form" action={submitCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-lg">Edit Services</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-6">
              {services.map(s => (
                <form key={s.id} action={fd => submitUpdate(fd, s)} className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-6 last:border-0 last:pb-0">
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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
