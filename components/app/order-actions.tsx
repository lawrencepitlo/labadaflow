'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  advanceOrderStatus,
  cancelOrder,
  completeOrder,
} from '@/lib/actions/orders'
import { getNextStatus, getPreviousStatus, STATUS_CONFIG, type OrderStatus } from '@/lib/order-machine'
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
import { ChevronRight, ChevronLeft, CheckCircle, XCircle } from 'lucide-react'

interface OrderActionsProps {
  orderId: string
  status: OrderStatus
}

const ADVANCE_LABELS: Partial<Record<OrderStatus, string>> = {
  RECEIVED: 'Start Washing',
  WASHING: 'Start Drying',
  DRYING: 'Start Folding',
  FOLDING: 'Mark Ready',
}

export function OrderActions({ orderId, status }: OrderActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [cancelReason, setCancelReason] = useState('')

  const next = getNextStatus(status)
  const previous = getPreviousStatus(status)
  const isTerminal = status === 'COMPLETED' || status === 'CANCELLED'

  function run(action: () => Promise<{ error?: string; success?: boolean }>) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result?.error) {
        setError(result.error)
      } else {
        setNote('')
        setCancelReason('')
        router.refresh()
      }
    })
  }

  if (isTerminal) {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          {status === 'COMPLETED' ? (
            <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          ) : (
            <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          This order is <span className="font-medium capitalize">{status.toLowerCase()}</span> and cannot be changed.
        </p>
      </div>
    )
  }

  const advanceLabel = ADVANCE_LABELS[status] ?? (next ? `Advance to ${STATUS_CONFIG[next]?.label ?? next}` : null)
  const previousLabel = previous ? STATUS_CONFIG[previous]?.label ?? previous : null

  return (
    <div className="space-y-5">
      {/* Forward actions */}
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {status === 'READY' ? 'Complete' : 'Next step'}
        </p>
        <div className="flex flex-col gap-2">
          {next && advanceLabel && (
            <Button
              disabled={isPending}
              onClick={() => run(() => advanceOrderStatus({ order_id: orderId, to_status: next }))}
              size="lg"
              className="w-full"
            >
              <ChevronRight aria-hidden="true" />
              {advanceLabel}
            </Button>
          )}
          {status === 'READY' && (
            <AlertDialog>
              <AlertDialogTrigger render={<Button disabled={isPending} size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700" />}>
                <CheckCircle aria-hidden="true" />
                Complete & Mark Paid
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Complete order & record payment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Payment is recorded on completion. Completed orders cannot be changed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Back</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => run(() => completeOrder({ order_id: orderId }))}
                  >
                    Confirm Completion
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        {status === 'READY' && (
          <p className="text-xs text-muted-foreground">Collect payment, then complete the order.</p>
        )}
      </div>

      {/* Backward action */}
      {previous && previousLabel && (
        <>
          <Separator />
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Move back</p>
            <Textarea
              placeholder={`Note required to move back to ${previousLabel}`}
              value={note}
              onChange={e => setNote(e.target.value)}
              aria-label="Backward transition note"
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
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Cancel</p>
        <Textarea
          placeholder="Cancellation reason"
          value={cancelReason}
          onChange={e => setCancelReason(e.target.value)}
          aria-label="Cancellation reason"
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

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </div>
  )
}
