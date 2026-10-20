'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Copy, Check, QrCode, Store, Sparkles, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { type OrderStatus } from '@/lib/order-machine'

interface PortalOrderPassProps {
  orderNumber: string
  trackingCode: string
  qrDataUrl: string
  status: OrderStatus
  totalFormatted: string
  source: 'WALK_IN' | 'PORTAL'
}

export function PortalOrderPass({
  orderNumber,
  trackingCode,
  qrDataUrl,
  status,
  totalFormatted,
  source,
}: PortalOrderPassProps) {
  const [copied, setCopied] = useState(false)

  function copyCode() {
    navigator.clipboard.writeText(trackingCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isReceived = status === 'RECEIVED'
  const isReady = status === 'READY'
  const isCompleted = status === 'COMPLETED'
  const isProcessing = ['WASHING', 'DRYING', 'FOLDING'].includes(status)

  return (
    <Card className="mb-5 overflow-hidden border-2 border-primary/20 bg-linear-to-b from-primary/5 via-background to-background shadow-md">
      <div className="bg-primary/10 px-4 py-2.5 flex items-center justify-between border-b border-primary/15">
        <div className="flex items-center gap-2">
          <QrCode className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold tracking-wide uppercase text-primary">
            Digital Laundry Drop-off Pass
          </span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-0.5 text-[11px] font-semibold text-foreground shadow-xs">
          <Store className="h-3 w-3 text-muted-foreground" />
          Pay in Shop
        </span>
      </div>

      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
          {/* QR Code Container */}
          <div className="relative flex flex-col items-center justify-center rounded-xl bg-white p-2.5 shadow-sm border border-border/80">
            <Image
              src={qrDataUrl}
              alt={`QR Code for order ${orderNumber}`}
              width={160}
              height={160}
              className="rounded-lg"
              priority
            />
            <span className="mt-1 text-[10px] font-mono text-neutral-600 tracking-wider">
              SCAN AT COUNTER
            </span>
          </div>

          {/* Details & Counter Instructions */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="font-mono text-xs font-semibold text-muted-foreground uppercase">
                  Order {orderNumber}
                </span>
                {source === 'PORTAL' && (
                  <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-600 dark:text-sky-400">
                    Online Booking
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-lg font-bold text-foreground">
                {isReceived && 'Ready for Clothes Drop-off'}
                {isProcessing && 'Laundry in Progress'}
                {isReady && 'Ready for Counter Pickup!'}
                {isCompleted && 'Order Completed'}
              </h2>
            </div>

            {/* Tracking Code with 1-click Copy */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border bg-muted/60 px-3 py-1.5 font-mono text-sm font-bold tracking-wider text-foreground">
                <span>{trackingCode}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={copyCode}
                  aria-label="Copy tracking code"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              {copied && <span className="text-xs text-emerald-600 font-medium">Copied!</span>}
            </div>

            {/* Context message */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isReceived && (
                <>
                  Bring your laundry to the counter and show this screen or QR code. Our staff will scan it, confirm your garments/weight, and start washing immediately.
                </>
              )}
              {isProcessing && (
                <>
                  Your clothes are being cared for right now. You do not need to do anything — we will notify you when folding is finished.
                </>
              )}
              {isReady && (
                <>
                  Your clean laundry is packed and waiting. Show this pass at the counter to claim and pay {totalFormatted}.
                </>
              )}
              {isCompleted && (
                <>
                  Thank you for washing with LabadaFlow! Keep this pass for your personal records.
                </>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
