'use client'

import { useState } from 'react'
import { formatMoney } from '@/lib/money'
import { Button } from '@/components/ui/button'
import { MessageSquare, Copy, Check } from 'lucide-react'

interface ReadyCustomerNotifierProps {
  customerName: string
  phone: string | null
  orderNumber: string
  trackingCode: string
  totalCents: number
  shopName?: string
}

export function ReadyCustomerNotifier({
  customerName,
  phone,
  orderNumber,
  trackingCode,
  totalCents,
  shopName = 'LabadaFlow',
}: ReadyCustomerNotifierProps) {
  const [copied, setCopied] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const trackingUrl = `${baseUrl}/track/${trackingCode}`
  const message = `Hi ${customerName}! Your laundry (${orderNumber}) is ready for pickup at ${shopName}. Total: ${formatMoney(totalCents)}. Track here: ${trackingUrl}`

  const cleanPhone = phone ? phone.replace(/[^0-9+]/g, '') : ''
  const smsHref = cleanPhone
    ? `sms:${cleanPhone}?body=${encodeURIComponent(message)}`
    : null

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100">
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-800 dark:text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Ready for customer pickup
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {phone ? `Customer phone: ${phone}` : 'No phone number recorded for customer'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {smsHref && (
          <Button
            render={<a href={smsHref} />}
            size="sm"
            variant="default"
            className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Send SMS
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="h-7 text-xs gap-1.5 border-emerald-500/30 hover:bg-emerald-500/20"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied Message' : 'Copy Message'}
        </Button>
      </div>
    </div>
  )
}
