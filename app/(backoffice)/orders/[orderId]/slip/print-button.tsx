'use client'

import { useState } from 'react'
import { Printer, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PrintButton({ trackingUrl }: { trackingUrl?: string }) {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    if (!trackingUrl) return
    navigator.clipboard.writeText(trackingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
      <Button onClick={() => window.print()} size="default" className="gap-2">
        <Printer className="h-4 w-4" aria-hidden="true" />
        Print Receipt
      </Button>
      {trackingUrl && (
        <Button onClick={copyLink} variant="outline" size="default" className="gap-2">
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              Link Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Copy Tracking Link
            </>
          )}
        </Button>
      )}
    </div>
  )
}
