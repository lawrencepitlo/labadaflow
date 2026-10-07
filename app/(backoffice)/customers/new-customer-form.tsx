'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createCustomer } from '@/lib/actions/customers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export function NewCustomerForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function submit(formData: FormData) {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await createCustomer(formData)
      if (result?.error) setError(result.error)
      else {
        setSuccess(true)
        router.refresh()
        ;(document.getElementById('new-customer-form') as HTMLFormElement)?.reset()
      }
    })
  }

  return (
    <form id="new-customer-form" action={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name *</Label>
        <Input id="full_name" name="full_name" required maxLength={100} placeholder="e.g. Maria Santos" autoComplete="name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" maxLength={20} placeholder="09xx xxx xxxx" autoComplete="tel" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="name@example.com" autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" maxLength={255} placeholder="Barangay, street…" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" maxLength={1000} placeholder="Allergies, preferences…" rows={2} />
      </div>
      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2" role="alert">{error}</p>}
      {success && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 sm:col-span-2" role="status">Customer created.</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating…' : 'Create Customer'}
        </Button>
      </div>
    </form>
  )
}
