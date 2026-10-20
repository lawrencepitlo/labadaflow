'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { lookupOrderByCode, advanceOrderStatus } from '@/lib/actions/orders'
import { formatMoney } from '@/lib/money'
import { formatDateTime } from '@/lib/time'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/app/status-badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  QrCode,
  Search,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Phone,
  User,
  Clock,
  Play,
  RotateCw,
} from 'lucide-react'
import type { OrderStatus } from '@/lib/order-machine'

interface LookedUpOrder {
  id: string
  order_number: string
  tracking_code: string
  status: OrderStatus
  source: 'WALK_IN' | 'PORTAL'
  total_cents: number
  received_at: string
  customer_name: string
  customer_phone: string | null
}

export function OrderScanLookupDialog({
  triggerVariant = 'outline',
  triggerSize = 'default',
}: {
  triggerVariant?: 'default' | 'outline' | 'secondary' | 'ghost'
  triggerSize?: 'default' | 'sm' | 'lg' | 'icon'
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [isSearching, startSearch] = useTransition()
  const [isAdvancing, startAdvance] = useTransition()
  const [result, setResult] = useState<LookedUpOrder | null>(null)
  const [notFound, setNotFound] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setResult(null)
      setNotFound(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Debounced live search
  useEffect(() => {
    const clean = query.trim()
    if (!clean) {
      setResult(null)
      setNotFound(false)
      return
    }

    const timer = setTimeout(() => {
      startSearch(async () => {
        const res = await lookupOrderByCode(clean)
        if (res.found && res.order) {
          setResult(res.order as LookedUpOrder)
          setNotFound(false)
        } else {
          setResult(null)
          setNotFound(true)
        }
      })
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  function handleStartWashing() {
    if (!result) return
    startAdvance(async () => {
      await advanceOrderStatus({
        order_id: result.id,
        to_status: 'WASHING',
        note: 'Online order drop-off received at counter',
      })
      setOpen(false)
      router.push(`/orders/${result.id}`)
    })
  }

  function handleOpenOrder() {
    if (!result) return
    setOpen(false)
    router.push(`/orders/${result.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={triggerVariant}
            size={triggerSize}
            className="gap-2 font-medium"
          />
        }
      >
        <QrCode className="h-4 w-4 text-primary" />
        <span>Scan / Fast Lookup</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <QrCode className="h-5 w-5 text-primary" />
            Scan Drop-off Pass or Search Code
          </DialogTitle>
          <DialogDescription className="text-xs">
            Scan the customer&apos;s phone pass QR code with your scanner, or paste/type any tracking code or order number.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Input field */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Scan QR or enter code (e.g. FRESH-4821 or LF-00001)..."
              className="pl-9 pr-9 font-mono text-sm h-10"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            {isSearching && (
              <RotateCw className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Result Card */}
          {result && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 animate-in fade-in-50 duration-150">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-foreground">
                      {result.order_number}
                    </span>
                    <StatusBadge status={result.status} size="sm" />
                    {result.source === 'PORTAL' && (
                      <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                        Online Booking
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span className="font-medium text-foreground">{result.customer_name}</span>
                    {result.customer_phone && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {result.customer_phone}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-foreground">
                    {formatMoney(result.total_cents)}
                  </span>
                  <span className="block text-[10px] text-muted-foreground">
                    {result.status === 'COMPLETED' ? 'Paid' : 'Pay at Counter'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-primary/15 pt-2.5 text-xs text-muted-foreground font-mono">
                <span>Code: {result.tracking_code}</span>
                <span>{formatDateTime(result.received_at)}</span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                {result.status === 'RECEIVED' ? (
                  <Button
                    type="button"
                    onClick={handleStartWashing}
                    disabled={isAdvancing}
                    className="flex-1 h-9 font-semibold"
                  >
                    <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                    {isAdvancing ? 'Starting...' : 'Accept & Start Washing'}
                  </Button>
                ) : null}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenOrder}
                  className="flex-1 h-9"
                >
                  Open Order Details
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {notFound && !isSearching && query.trim() && (
            <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
              No order found matching &quot;{query.trim()}&quot;. Check the code and try again.
            </div>
          )}

          {!query && (
            <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Tip for Counter Staff:</p>
              <p>
                When a customer shows their phone saying &quot;I ordered online&quot;, scan their screen QR code with your barcode scanner or paste their tracking code here to start their laundry in 1 click!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
