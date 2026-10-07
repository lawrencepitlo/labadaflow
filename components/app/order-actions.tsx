'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  advanceOrderStatus,
  cancelOrder,
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
import { ChevronLeft, XCircle } from 'lucide-react'
import { OrderPrimaryAction } from '@/components/app/order-primary-action'
import { STATUS_DOT_CLASS } from '@/components/app/status-badge'
import { cn } from 'cn'

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
      <p className="flex items-center gap-1.5 py-2 text-[13px] text-muted-foreground">
        <span
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_DOT_CLASS[status])}
          aria-hidden="true"
        />
        This order is {status.toLowerCase()} and cannot be changed.
      </p>
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
        <OrderPrimaryAction orderId={orderId} status={status} className="w-full" />
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
