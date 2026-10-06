'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createCustomer } from '@/lib/actions/customers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

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
    <Card>
      <CardContent className="pt-6">
        <form id="new-customer-form" action={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name *</Label>
            <Input id="full_name" name="full_name" required maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" maxLength={20} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" maxLength={255} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" maxLength={1000} />
          </div>
          {error && <p className="text-sm text-destructive sm:col-span-2" role="alert">{error}</p>}
          {success && <p className="text-sm text-emerald-600 sm:col-span-2">Customer created.</p>}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating…' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
