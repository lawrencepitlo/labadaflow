'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { advanceOrderStatus, completeOrder } from '@/lib/actions/orders'
import { getNextStatus, STATUS_CONFIG, type OrderStatus } from '@/lib/order-machine'
import { formatMoney } from '@/lib/money'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ChevronRight, CheckCircle } from 'lucide-react'
import { cn } from 'cn'

const ADVANCE_LABELS: Partial<Record<OrderStatus, string>> = {
  RECEIVED: 'Start Washing',
  WASHING: 'Start Drying',
  DRYING: 'Start Folding',
  FOLDING: 'Mark Ready',
}

interface OrderPrimaryActionProps {
  orderId: string
  status: OrderStatus
  totalCents?: number
  className?: string
}

/**
 * The single next step for an order — rendered in the page header so the
 * current action is never buried. Terminal orders render nothing.
 */
export function OrderPrimaryAction({
  orderId,
  status,
  totalCents = 0,
  className,
}: OrderPrimaryActionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'GCASH' | 'OTHER'>('CASH')

  const next = getNextStatus(status)
  const isTerminal = status === 'COMPLETED' || status === 'CANCELLED'

  function run(action: () => Promise<{ error?: string; success?: boolean }>) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result?.error) {
        setError(result.error)
      } else {
        setDialogOpen(false)
        router.refresh()
      }
    })
  }

  if (isTerminal) return null

  const advanceLabel = ADVANCE_LABELS[status] ?? (next ? `Advance to ${STATUS_CONFIG[next]?.label ?? next}` : null)

  return (
    <span className={cn('inline-flex flex-col items-stretch gap-1', className)}>
      {next && advanceLabel && (
        <Button disabled={isPending} onClick={() => run(() => advanceOrderStatus({ order_id: orderId, to_status: next }))}>
          <ChevronRight aria-hidden="true" />
          {advanceLabel}
        </Button>
      )}
      {status === 'READY' && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button disabled={isPending} />}>
            <CheckCircle aria-hidden="true" />
            Complete & Collect Payment
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Order & Record Payment</DialogTitle>
              <DialogDescription>
                Record the customer payment and mark this order as completed.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3">
                <span className="text-xs text-muted-foreground">Amount Due</span>
                <span className="text-lg font-bold text-foreground">
                  {formatMoney(totalCents)}
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="primary-payment-method">Payment Method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={v => setPaymentMethod(v as 'CASH' | 'GCASH' | 'OTHER')}
                >
                  <SelectTrigger id="primary-payment-method" className="w-full">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="GCASH">GCash</SelectItem>
                    <SelectItem value="OTHER">Other / Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={isPending}
                onClick={() =>
                  run(() =>
                    completeOrder({
                      order_id: orderId,
                      payment_method: paymentMethod,
                    })
                  )
                }
              >
                {isPending ? 'Completing…' : 'Confirm Completion'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {error && <span className="text-xs text-destructive" role="alert">{error}</span>}
    </span>
  )
}
