'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateOwnProfile } from '@/lib/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProfileFormProps {
  profile: {
    full_name: string
    phone: string | null
    email: string | null
    address: string | null
  }
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function submit(formData: FormData) {
    setError(null)
    setSuccess(false)
    const input = {
      full_name: String(formData.get('full_name') ?? ''),
      phone: String(formData.get('phone') ?? '') || null,
      email: String(formData.get('email') ?? '') || null,
      address: String(formData.get('address') ?? '') || null,
    }
    startTransition(async () => {
      const result = await updateOwnProfile(input)
      if (result?.error) setError(result.error)
      else {
        setSuccess(true)
        router.refresh()
      }
    })
  }

  return (
    <form action={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name *</Label>
        <Input id="full_name" name="full_name" required maxLength={100} defaultValue={profile.full_name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" maxLength={20} defaultValue={profile.phone ?? ''} autoComplete="tel" inputMode="tel" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={profile.email ?? ''} autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" maxLength={255} defaultValue={profile.address ?? ''} autoComplete="street-address" />
      </div>
      {error && <p className="text-xs text-destructive sm:col-span-2" role="alert">{error}</p>}
      {success && <p className="text-xs text-muted-foreground sm:col-span-2" role="status">Profile updated.</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={isPending} aria-live="polite">
          {isPending ? 'Saving…' : 'Save Profile'}
        </Button>
      </div>
    </form>
  )
}
