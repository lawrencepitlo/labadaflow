'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { advanceOrderStatus, completeOrder } from '@/lib/actions/orders'
import { getNextStatus, STATUS_CONFIG, type OrderStatus } from '@/lib/order-machine'
import { Button } from '@/components/ui/button'
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
  className?: string
}

/**
 * The single next step for an order — rendered in the page header so the
 * current action is never buried. Terminal orders render nothing.
 */
export function OrderPrimaryAction({ orderId, status, className }: OrderPrimaryActionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const next = getNextStatus(status)
  const isTerminal = status === 'COMPLETED' || status === 'CANCELLED'

  function run(action: () => Promise<{ error?: string; success?: boolean }>) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result?.error) {
        setError(result.error)
      } else {
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
        <AlertDialog>
          <AlertDialogTrigger render={<Button disabled={isPending} />}>
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
      {error && <span className="text-xs text-destructive" role="alert">{error}</span>}
    </span>
  )
}
