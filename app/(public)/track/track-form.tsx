'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function TrackForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  function submit(formData: FormData) {
    const raw = String(formData.get('code') ?? '')
    const code = raw.trim()
    if (!code) {
      setError('Enter the tracking code from your order slip.')
      return
    }
    if (code.length < 4) {
      setError('That code looks too short. Check the code on your slip and try again.')
      return
    }
    if (/[<>"']/.test(code)) {
      setError('That code contains invalid characters. Check the code on your slip and try again.')
      return
    }
    setError(null)
    router.push(`/track/${encodeURIComponent(code)}`)
  }

  return (
    <form
      action={submit}
      noValidate
      aria-describedby="track-help"
    >
      <div className="space-y-2">
        <Label htmlFor="track-code">Tracking code</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="track-code"
            name="code"
            placeholder="e.g. V1StGXR8_Z5jdHi6"
            required
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Tracking code"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'track-error track-help' : 'track-help'}
            className="h-11 text-base"
          />
          <Button type="submit" size="lg" className="h-11 px-6 sm:shrink-0">
            <Search className="w-4 h-4 mr-2" aria-hidden="true" />
            Track
          </Button>
        </div>
        {error && (
          <p id="track-error" className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <p id="track-help" className="text-xs text-muted-foreground">
          Find the code on your printed order slip. No account or sign-in needed.
        </p>
      </div>
    </form>
  )
}
