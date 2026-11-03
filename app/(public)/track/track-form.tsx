'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function TrackForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  function submit(formData: FormData) {
    const raw = String(formData.get('code') ?? '')
    const code = raw.trim().replace(/^#/, '')
    if (!code) {
      setError('Please enter the tracking code from your counter receipt slip.')
      return
    }
    if (code.length < 3) {
      setError('That code looks too short. Check your receipt slip and try again.')
      return
    }
    if (/[<>"']/.test(code)) {
      setError('Invalid characters detected. Please check your tracking code.')
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
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="track-code" className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Order Tracking Code
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="track-code"
            name="code"
            placeholder="e.g. SOAP-4821 or LF-1042"
            required
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Tracking code"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'track-error track-help' : 'track-help'}
            className="h-11 font-mono text-sm uppercase tracking-wider rounded-xl"
          />
          <Button type="submit" size="lg" className="h-11 px-6 rounded-xl font-semibold shadow-sm sm:shrink-0">
            <Search className="w-4 h-4 mr-1.5" aria-hidden="true" />
            Track Now
          </Button>
        </div>
        {error && (
          <p id="track-error" className="text-xs font-medium text-rose-600 dark:text-rose-400" role="alert">
            {error}
          </p>
        )}
        <p id="track-help" className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
          <QrCode className="h-3.5 w-3.5 text-primary shrink-0" />
          Printed on your counter slip or digital pass. No login required.
        </p>
      </div>
    </form>
  )
}
