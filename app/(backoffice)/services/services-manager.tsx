'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createService, updateService, toggleServiceActive } from '@/lib/actions/services'
import { formatMoney, pesosToCentavos, centavosToPesos } from '@/lib/money'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/app/empty-state'
import { Package, Plus, Sparkles } from 'lucide-react'
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
  const [editingId, setEditingId] = useState<string | null>(null)
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
      else {
        setEditingId(null)
        router.refresh()
      }
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
    <div className="mt-6 space-y-6">
      {services.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-8">
          <EmptyState
            icon={Package}
            title="No services in catalog"
            description={canEdit ? 'Create your first service — intake pricing is automatically computed from this catalog.' : 'No active services available.'}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b pb-4">
            <div>
              <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Services Catalog</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Standardized laundry items and rate configurations</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md">
                {services.filter(s => s.is_active).length} of {services.length} active
              </span>
            </div>
          </div>

          {/* Desktop — Clean SaaS table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border/70 md:block">
            <Table aria-label="Services Catalog">
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-10 pl-4 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Service Name & Description</TableHead>
                  <TableHead className="h-10 text-right text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Rate / Unit</TableHead>
                  <TableHead className="h-10 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase pl-6">Status</TableHead>
                  {canEdit && (
                    <TableHead className="h-10 pr-4 text-right text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map(s => {
                  const isEditingThis = editingId === s.id
                  return (
                    <TableRow key={s.id} className={`transition-colors duration-150 hover:bg-muted/40 ${s.is_active ? '' : 'opacity-60 bg-muted/10'}`}>
                      <TableCell className="pl-4 py-3.5">
                        <div className="font-semibold text-foreground text-sm">{s.name}</div>
                        {s.description && <div className="mt-0.5 max-w-md text-xs text-muted-foreground">{s.description}</div>}
                      </TableCell>
                      <TableCell className="tnum text-right py-3.5">
                        <span className="font-mono text-sm font-bold text-foreground">{formatMoney(s.unit_price_cents)}</span>
                        <span className="ml-1 text-xs text-muted-foreground">/ {s.pricing_unit === 'PER_KG' ? 'kg' : 'pc'}</span>
                      </TableCell>
                      <TableCell className="pl-6 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          s.is_active 
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                            : 'bg-muted text-muted-foreground border border-border'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${s.is_active ? 'bg-emerald-500' : 'bg-muted-foreground/50'}`} aria-hidden="true" />
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="pr-4 text-right py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs font-medium text-foreground hover:bg-muted"
                              onClick={() => setEditingId(isEditingThis ? null : s.id)}
                            >
                              {isEditingThis ? 'Close' : 'Edit'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`text-xs ${s.is_active ? 'text-muted-foreground hover:text-destructive' : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'}`}
                              onClick={() => toggle(s.id, !s.is_active)}
                              disabled={isPending}
                            >
                              {s.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Inline Edit Panel when editing a service on desktop */}
          {editingId && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
              {(() => {
                const activeEditService = services.find(s => s.id === editingId)
                if (!activeEditService) return null
                return (
                  <form action={fd => submitUpdate(fd, activeEditService)} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor={`edit-name-${activeEditService.id}`} className="text-xs font-semibold">Service Name</Label>
                      <Input id={`edit-name-${activeEditService.id}`} name="name" required maxLength={100} defaultValue={activeEditService.name} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Pricing Unit</Label>
                      <Select
                        value={editPricingUnit[activeEditService.id] ?? activeEditService.pricing_unit}
                        onValueChange={v => setEditPricingUnit(prev => ({ ...prev, [activeEditService.id]: v as 'PER_KG' | 'PER_PIECE' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PER_KG">Per kilogram (kg)</SelectItem>
                          <SelectItem value="PER_PIECE">Per piece (pc)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`edit-price-${activeEditService.id}`} className="text-xs font-semibold">Rate (₱)</Label>
                      <Input
                        id={`edit-price-${activeEditService.id}`}
                        name="unit_price_pesos"
                        type="number"
                        min={0}
                        step="0.01"
                        required
                        defaultValue={centavosToPesos(activeEditService.unit_price_cents)}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-3">
                      <Label htmlFor={`edit-desc-${activeEditService.id}`} className="text-xs font-semibold">Description</Label>
                      <Input id={`edit-desc-${activeEditService.id}`} name="description" defaultValue={activeEditService.description ?? ''} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="submit" size="sm" disabled={isPending} className="w-full">
                        {isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )
              })()}
            </div>
          )}

          {/* Mobile — Card items */}
          <div className="divide-y divide-border/60 rounded-xl border border-border/70 md:hidden mt-2">
            {services.map(s => (
              <div key={s.id} className={`p-4 ${s.is_active ? '' : 'opacity-60 bg-muted/10'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{s.name}</h3>
                    {s.description && <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>}
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0 ${
                    s.is_active 
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                      : 'bg-muted text-muted-foreground border border-border'
                  }`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t pt-2.5">
                  <div className="font-mono text-sm font-bold text-foreground">
                    {formatMoney(s.unit_price_cents)}
                    <span className="text-xs font-normal text-muted-foreground"> / {s.pricing_unit === 'PER_KG' ? 'kg' : 'pc'}</span>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground"
                        onClick={() => toggle(s.id, !s.is_active)}
                        disabled={isPending}
                      >
                        {s.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {canEdit && (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
          <div className="mb-4 border-b pb-3">
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Add New Service</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">New services become immediately available during order intake</p>
          </div>
          <form id="service-create-form" action={submitCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">Service Name *</Label>
              <Input id="name" name="name" placeholder="e.g. Wash, Dry & Fold" required maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Pricing Unit</Label>
              <Select value={pricingUnit} onValueChange={v => setPricingUnit(v as 'PER_KG' | 'PER_PIECE')}>
                <SelectTrigger aria-label="Pricing unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PER_KG">Per kilogram (₱/kg)</SelectItem>
                  <SelectItem value="PER_PIECE">Per piece (₱/pc)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit_price_pesos" className="text-xs font-semibold">Unit Price (₱) *</Label>
              <Input id="unit_price_pesos" name="unit_price_pesos" type="number" min={0} step="0.01" placeholder="65.00" required />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
              <Label htmlFor="description" className="text-xs font-semibold">Service Description</Label>
              <Input id="description" name="description" placeholder="Short description of what is included" maxLength={500} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sort_order" className="text-xs font-semibold">Catalog Order</Label>
              <Input id="sort_order" name="sort_order" type="number" defaultValue={services.length + 1} />
            </div>
            {error && <p className="text-xs text-destructive sm:col-span-2 lg:col-span-3" role="alert">{error}</p>}
            <div className="sm:col-span-2 lg:col-span-3 pt-2">
              <Button type="submit" disabled={isPending}>
                <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                {isPending ? 'Creating…' : 'Add Service to Catalog'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
