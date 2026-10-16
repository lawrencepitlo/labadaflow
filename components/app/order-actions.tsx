'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  advanceOrderStatus,
  cancelOrder,
  reopenOrder,
} from '@/lib/actions/orders'
import { getPreviousStatus, STATUS_CONFIG, type OrderStatus } from '@/lib/order-machine'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ChevronLeft, XCircle, RotateCcw } from 'lucide-react'
import { OrderPrimaryAction } from '@/components/app/order-primary-action'
import { STATUS_DOT_CLASS } from '@/components/app/status-badge'
import { cn } from 'cn'

interface OrderActionsProps {
  orderId: string
  status: OrderStatus
  totalCents?: number
  isAdmin?: boolean
}

export function OrderActions({
  orderId,
  status,
  totalCents = 0,
  isAdmin = false,
}: OrderActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [reopenNote, setReopenNote] = useState('')
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false)

  const previous = getPreviousStatus(status)
  const isCompleted = status === 'COMPLETED'
  const isCancelled = status === 'CANCELLED'

  function run(action: () => Promise<{ error?: string; success?: boolean }>) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result?.error) {
        setError(result.error)
      } else {
        setNote('')
        setCancelReason('')
        setReopenNote('')
        setReopenDialogOpen(false)
        router.refresh()
      }
    })
  }

  if (isCancelled) {
    return (
      <p className="flex items-center gap-1.5 py-2 text-[13px] text-muted-foreground">
        <span
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_DOT_CLASS[status])}
          aria-hidden="true"
        />
        This order is cancelled and cannot be reopened.
      </p>
    )
  }

  if (isCompleted) {
    return (
      <div className="space-y-3 py-2">
        <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <span
            className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_DOT_CLASS[status])}
            aria-hidden="true"
          />
          This order is completed and paid.
        </p>

        {isAdmin && (
          <div>
            <Dialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
              <DialogTrigger render={<Button variant="outline" size="sm" className="w-full gap-1.5" />}>
                <RotateCcw className="h-3.5 w-3.5" />
                Admin: Reopen Order
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Reopen Completed Order</DialogTitle>
                  <DialogDescription>
                    Reopening moves this order back to <strong>Ready for Pickup</strong>, clears
                    the payment timestamp and method, and logs a status event.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-3">
                  <label htmlFor="reopen-note" className="text-xs font-medium text-foreground">
                    Reason for reopening (required)
                  </label>
                  <Textarea
                    id="reopen-note"
                    placeholder="e.g. Customer returned items for re-cleaning, payment correction..."
                    value={reopenNote}
                    onChange={e => setReopenNote(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    disabled={isPending}
                    onClick={() => setReopenDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={isPending || !reopenNote.trim()}
                    onClick={() =>
                      run(() =>
                        reopenOrder({
                          order_id: orderId,
                          note: reopenNote.trim(),
                        })
                      )
                    }
                  >
                    {isPending ? 'Reopening…' : 'Confirm Reopen'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
        {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
      </div>
    )
  }

  const previousLabel = previous ? STATUS_CONFIG[previous]?.label ?? previous : null

  return (
    <div className="space-y-4">
      {/* Forward actions */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {status === 'READY' ? 'Complete' : 'Next step'}
        </p>
        <OrderPrimaryAction
          orderId={orderId}
          status={status}
          totalCents={totalCents}
          className="w-full"
        />
        {status === 'READY' && (
          <p className="text-xs text-muted-foreground">Collect payment, then complete the order.</p>
        )}
      </div>

      {/* Backward action */}
      {previous && previousLabel && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Move back</p>
            <Textarea
              placeholder={`Note required to move back to ${previousLabel}`}
              value={note}
              onChange={e => setNote(e.target.value)}
              aria-label="Backward transition note"
              maxLength={500}
              rows={2}
            />
            <Button
              variant="outline"
              disabled={isPending || !note.trim()}
              onClick={() => run(() => advanceOrderStatus({ order_id: orderId, to_status: previous, note }))}
              className="w-full"
            >
              <ChevronLeft aria-hidden="true" />
              Move Back to {previousLabel}
            </Button>
          </div>
        </>
      )}

      {/* Cancel action */}
      <Separator />
      <div className="space-y-2">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Cancel</p>
        <Textarea
          placeholder="Cancellation reason"
          value={cancelReason}
          onChange={e => setCancelReason(e.target.value)}
          aria-label="Cancellation reason"
          maxLength={500}
          rows={2}
        />
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive" disabled={isPending || !cancelReason.trim()} className="w-full" />}>
            <XCircle aria-hidden="true" />
            Cancel Order
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark the order as cancelled. Terminal orders cannot transition.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Back</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => run(() => cancelOrder({ order_id: orderId, cancel_reason: cancelReason }))}
              >
                Confirm Cancel
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  )
}
