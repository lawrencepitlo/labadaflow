'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  advanceOrderStatus,
  cancelOrder,
  completeOrder,
} from '@/lib/actions/orders'
import { getNextStatus, getPreviousStatus, type OrderStatus } from '@/lib/order-machine'
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
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
          {status === 'COMPLETED' ? (
            <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          This order is <span className="font-medium capitalize">{status.toLowerCase()}</span> and cannot be changed.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Forward actions */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Advance</p>
        <div className="flex flex-wrap gap-2">
          {next && (
            <Button
              disabled={isPending}
              onClick={() => run(() => advanceOrderStatus({ order_id: orderId, to_status: next }))}
              size="lg"
              className="gap-2"
            >
              <ChevronRight className="w-4 h-4" />
              Advance to {next}
            </Button>
          )}
          {status === 'READY' && (
            <Button
              disabled={isPending}
              onClick={() => run(() => completeOrder({ order_id: orderId }))}
              size="lg"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="w-4 h-4" />
              Complete & Mark Paid
            </Button>
          )}
        </div>
      </div>

      {/* Backward action */}
      {previous && (
        <>
          <Separator />
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Move back</p>
            <Textarea
              placeholder={`Note required to move back to ${previous}`}
              value={note}
              onChange={e => setNote(e.target.value)}
              aria-label="Backward transition note"
              rows={2}
            />
            <Button
              variant="outline"
              disabled={isPending || !note.trim()}
              onClick={() => run(() => advanceOrderStatus({ order_id: orderId, to_status: previous, note }))}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Move back to {previous}
            </Button>
          </div>
        </>
      )}

      {/* Cancel action */}
      <Separator />
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cancel</p>
        <Textarea
          placeholder="Cancellation reason"
          value={cancelReason}
          onChange={e => setCancelReason(e.target.value)}
          aria-label="Cancellation reason"
          rows={2}
        />
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive" disabled={isPending || !cancelReason.trim()} className="gap-2" />}>
            <XCircle className="w-4 h-4" />
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