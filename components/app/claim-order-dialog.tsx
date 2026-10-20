'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { claimOrder } from '@/lib/actions/orders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tag, CheckCircle2 } from 'lucide-react'

export function ClaimOrderDialog({
  triggerText = 'Claim an Order',
  variant = 'outline',
  size = 'sm',
}: {
  triggerText?: string
  variant?: 'outline' | 'default' | 'secondary'
  size?: 'sm' | 'default'
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [trackingCode, setTrackingCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleClaim(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (!trackingCode.trim()) {
      setError('Please enter your tracking code.')
      return
    }

    startTransition(async () => {
      const res = await claimOrder(trackingCode)
      if (res.error) {
        setError(res.error)
      } else if (res.success && res.orderId) {
        setSuccessMsg(res.message || 'Order claimed successfully!')
        setTimeout(() => {
          setOpen(false)
          setTrackingCode('')
          router.push(`/portal/orders/${res.orderId}`)
          router.refresh()
        }, 800)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={variant} size={size} className="gap-1.5" />}>
        <Tag className="h-3.5 w-3.5" />
        {triggerText}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleClaim}>
          <DialogHeader>
            <DialogTitle>Claim Your Laundry Order</DialogTitle>
            <DialogDescription>
              Enter the tracking code printed on your receipt slip or received via SMS to attach the
              order to your customer account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            {error && (
              <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 p-2 text-xs text-destructive">
                {error}
              </div>
            )}
            {successMsg && (
              <div role="status" className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-2 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                {successMsg}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="tracking-code-input">Tracking Code</Label>
              <Input
                id="tracking-code-input"
                placeholder="e.g. FRESH-4821 or tracking code"
                value={trackingCode}
                onChange={e => setTrackingCode(e.target.value)}
                autoFocus
                required
                className="font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Claiming…' : 'Claim Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
