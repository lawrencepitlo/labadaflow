'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateCustomer } from '@/lib/actions/customers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { CustomerDetail } from '@/lib/data/customers'

export function EditCustomerForm({ customer }: { customer: CustomerDetail }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function submit(formData: FormData) {
    setError(null)
    setSuccess(false)
    formData.set('id', customer.id)
    startTransition(async () => {
      const result = await updateCustomer(formData)
      if (result?.error) setError(result.error)
      else {
        setSuccess(true)
        router.refresh()
      }
    })
  }

  return (
    <form action={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name *</Label>
        <Input id="full_name" name="full_name" required maxLength={100} defaultValue={customer.full_name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" maxLength={20} defaultValue={customer.phone ?? ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={customer.email ?? ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" maxLength={255} defaultValue={customer.address ?? ''} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" maxLength={1000} defaultValue={customer.notes ?? ''} />
      </div>
      {error && <p className="text-sm text-destructive sm:col-span-2" role="alert">{error}</p>}
      {success && <p className="text-sm text-emerald-600 sm:col-span-2">Customer updated.</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
