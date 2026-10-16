'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { BoardOrder } from '@/lib/data/orders'
import type { OrderStatus } from '@/lib/order-machine'
import { advanceOrderStatus, completeOrder, batchAdvanceOrders } from '@/lib/actions/orders'
import { formatMoney } from '@/lib/money'
import { formatDate } from '@/lib/time'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChevronRight,
  AlertTriangle,
  Clock,
  Phone,
  CheckSquare,
  X,
  ExternalLink,
} from 'lucide-react'
import { cn } from 'cn'

interface ColumnConfig {
  status: OrderStatus
  label: string
  actionLabel: string
  nextStatus: OrderStatus | 'COMPLETED'
  colorClass: string
}

const COLUMNS: ColumnConfig[] = [
  { status: 'RECEIVED', label: 'Received', actionLabel: 'Start Washing', nextStatus: 'WASHING', colorClass: 'border-blue-500/20 bg-blue-500/5 text-blue-700 dark:text-blue-300' },
  { status: 'WASHING', label: 'Washing', actionLabel: 'Start Drying', nextStatus: 'DRYING', colorClass: 'border-sky-500/20 bg-sky-500/5 text-sky-700 dark:text-sky-300' },
  { status: 'DRYING', label: 'Drying', actionLabel: 'Start Folding', nextStatus: 'FOLDING', colorClass: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-700 dark:text-indigo-300' },
  { status: 'FOLDING', label: 'Folding', actionLabel: 'Mark Ready', nextStatus: 'READY', colorClass: 'border-violet-500/20 bg-violet-500/5 text-violet-700 dark:text-violet-300' },
  { status: 'READY', label: 'Ready for Pickup', actionLabel: 'Complete Order', nextStatus: 'COMPLETED', colorClass: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300' },
]

export function BoardView({ initialOrders }: { initialOrders: BoardOrder[] }) {
  const router = useRouter()
  const [orders, setOrders] = useState<BoardOrder[]>(initialOrders)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<OrderStatus>('RECEIVED')
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Payment complete modal state
  const [completingOrder, setCompletingOrder] = useState<BoardOrder | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'GCASH' | 'OTHER'>('CASH')

  // Batch complete modal state
  const [batchCompleteOpen, setBatchCompleteOpen] = useState(false)
  const [batchPaymentMethod, setBatchPaymentMethod] = useState<'CASH' | 'GCASH' | 'OTHER'>('CASH')

  // Keep local state in sync when server props refresh
  if (initialOrders !== orders && !isPending && selectedIds.length === 0) {
    // If not actively mutating
  }

  const now = Date.now()

  function getColumnOrders(status: OrderStatus) {
    return orders.filter(o => o.status === status)
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function selectAllInColumn(status: OrderStatus) {
    const colIds = getColumnOrders(status).map(o => o.id)
    const allSelected = colIds.every(id => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !colIds.includes(id)))
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...colIds])))
    }
  }

  function clearSelection() {
    setSelectedIds([])
  }

  // Single card advance
  function handleAdvance(order: BoardOrder) {
    const col = COLUMNS.find(c => c.status === order.status)
    if (!col) return

    if (col.nextStatus === 'COMPLETED') {
      setCompletingOrder(order)
      setPaymentMethod('CASH')
      return
    }

    const previousOrders = [...orders]
    const nextStatus = col.nextStatus

    // Optimistic UI
    setOrders(prev =>
      prev.map(o => (o.id === order.id ? { ...o, status: nextStatus } : o))
    )
    setErrorMessage(null)

    startTransition(async () => {
      const res = await advanceOrderStatus({
        order_id: order.id,
        to_status: nextStatus,
      })

      if (res?.error) {
        setOrders(previousOrders)
        setErrorMessage(`Failed to advance ${order.order_number}: ${res.error}`)
      } else {
        router.refresh()
      }
    })
  }

  // Confirm single completion with payment
  function handleConfirmComplete() {
    if (!completingOrder) return
    const order = completingOrder
    const previousOrders = [...orders]

    // Optimistic UI: remove from board since COMPLETED is not shown
    setOrders(prev => prev.filter(o => o.id !== order.id))
    setSelectedIds(prev => prev.filter(id => id !== order.id))
    setCompletingOrder(null)
    setErrorMessage(null)

    startTransition(async () => {
      const res = await completeOrder({
        order_id: order.id,
        payment_method: paymentMethod,
      })

      if (res?.error) {
        setOrders(previousOrders)
        setErrorMessage(`Failed to complete ${order.order_number}: ${res.error}`)
      } else {
        router.refresh()
      }
    })
  }

  // Batch advance
  function handleBatchAdvance() {
    const selectedOrders = orders.filter(o => selectedIds.includes(o.id))
    if (selectedOrders.length === 0) return

    // If any selected orders are READY, they require payment selection
    const hasReady = selectedOrders.some(o => o.status === 'READY')
    if (hasReady) {
      setBatchCompleteOpen(true)
      return
    }

    executeBatchAdvance('CASH')
  }

  function executeBatchAdvance(methodForReady: 'CASH' | 'GCASH' | 'OTHER') {
    const selectedOrders = orders.filter(o => selectedIds.includes(o.id))
    if (selectedOrders.length === 0) return

    const previousOrders = [...orders]
    const itemsToAdvance = selectedOrders.map(o => {
      const col = COLUMNS.find(c => c.status === o.status)
      const nextStatus = col?.nextStatus || 'READY'
      return {
        order_id: o.id,
        to_status: nextStatus,
        payment_method: nextStatus === 'COMPLETED' ? methodForReady : undefined,
      }
    })

    // Optimistic update
    setOrders(prev =>
      prev
        .map(o => {
          if (!selectedIds.includes(o.id)) return o
          const col = COLUMNS.find(c => c.status === o.status)
          const nextStatus = col?.nextStatus || 'READY'
          if (nextStatus === 'COMPLETED') return null
          return { ...o, status: nextStatus }
        })
        .filter(Boolean) as BoardOrder[]
    )
    setSelectedIds([])
    setBatchCompleteOpen(false)
    setErrorMessage(null)

    startTransition(async () => {
      const res = await batchAdvanceOrders(itemsToAdvance)
      if (res?.error) {
        setOrders(previousOrders)
        setErrorMessage(res.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Staff Operations Board</h1>
          <p className="text-xs text-muted-foreground">
            Track and advance active laundry orders across workflow stages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" render={<Link href="/orders" />}>
            List View
          </Button>
          <Button size="sm" render={<Link href="/orders/new" />}>
            New Order
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-destructive hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mobile column tabs (<768px) */}
      <div className="flex overflow-x-auto rounded-lg border bg-muted/40 p-1 md:hidden">
        {COLUMNS.map(col => {
          const count = getColumnOrders(col.status).length
          const isActive = activeTab === col.status
          return (
            <button
              key={col.status}
              type="button"
              onClick={() => setActiveTab(col.status)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span>{col.label}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-semibold',
                  isActive ? 'bg-muted text-foreground' : 'bg-muted/80 text-muted-foreground'
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Mobile single column active view */}
      <div className="md:hidden">
        {COLUMNS.filter(c => c.status === activeTab).map(col => {
          const colOrders = getColumnOrders(col.status)
          return (
            <div key={col.status} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {col.label} ({colOrders.length})
                </span>
                {colOrders.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => selectAllInColumn(col.status)}
                  >
                    Select All
                  </Button>
                )}
              </div>
              {colOrders.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                  No orders in {col.label.toLowerCase()}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {colOrders.map(order => renderCard(order, col))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Desktop 5-column horizontal grid (>= 768px) */}
      <div className="hidden md:grid md:grid-cols-5 md:gap-3 lg:gap-4 items-start">
        {COLUMNS.map(col => {
          const colOrders = getColumnOrders(col.status)
          const allSelected =
            colOrders.length > 0 && colOrders.every(o => selectedIds.includes(o.id))

          return (
            <div
              key={col.status}
              className="flex flex-col rounded-lg border bg-muted/20 min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b bg-card px-3 py-2.5 rounded-t-lg">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="truncate text-xs font-semibold uppercase tracking-wider text-foreground">
                    {col.label}
                  </span>
                  <Badge variant="secondary" className="h-5 px-1.5 text-[11px] font-mono">
                    {colOrders.length}
                  </Badge>
                </div>
                {colOrders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => selectAllInColumn(col.status)}
                    title={allSelected ? 'Deselect all' : 'Select all'}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <CheckSquare
                      className={cn(
                        'h-3.5 w-3.5',
                        allSelected ? 'text-primary' : 'text-muted-foreground/60'
                      )}
                    />
                  </button>
                )}
              </div>

              {/* Cards List */}
              <div className="flex-1 space-y-2 p-2 overflow-y-auto max-h-[calc(100vh-220px)]">
                {colOrders.length === 0 ? (
                  <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border/60 text-[11px] text-muted-foreground">
                    Empty
                  </div>
                ) : (
                  colOrders.map(order => renderCard(order, col))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating Action Bar for Multi-select */}
      {selectedIds.length > 0 && (
        <div
          role="region"
          aria-label="Bulk actions"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full border bg-background/95 px-4 py-2.5 shadow-xl backdrop-blur ring-1 ring-border"
        >
          <span className="text-xs font-medium text-foreground">
            {selectedIds.length} order{selectedIds.length === 1 ? '' : 's'} selected
          </span>
          <div className="h-4 w-px bg-border" />
          <Button
            size="sm"
            disabled={isPending}
            onClick={handleBatchAdvance}
            className="h-8 gap-1 rounded-full text-xs"
          >
            <ChevronRight className="h-3.5 w-3.5" />
            Advance Selected
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={clearSelection}
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Single Complete Order Dialog */}
      {completingOrder && (
        <Dialog open={!!completingOrder} onOpenChange={open => !open && setCompletingOrder(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Order & Collect Payment</DialogTitle>
              <DialogDescription>
                Record final payment and mark order {completingOrder.order_number} as completed.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="text-sm font-semibold">{completingOrder.customer.full_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Amount Due</p>
                  <p className="text-base font-bold text-foreground">
                    {formatMoney(completingOrder.total_cents)}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Payment Method</label>
                <Select
                  value={paymentMethod}
                  onValueChange={val => setPaymentMethod(val as 'CASH' | 'GCASH' | 'OTHER')}
                >
                  <SelectTrigger className="w-full">
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
                onClick={() => setCompletingOrder(null)}
              >
                Cancel
              </Button>
              <Button disabled={isPending} onClick={handleConfirmComplete}>
                Confirm & Complete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Batch Complete Dialog for items that include READY */}
      <Dialog open={batchCompleteOpen} onOpenChange={setBatchCompleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Batch Advance Selection</DialogTitle>
            <DialogDescription>
              Some selected orders are in Ready for Pickup and will be marked as Completed. Select
              the payment method for completed orders.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-foreground">Payment Method for Completed Orders</label>
            <Select
              value={batchPaymentMethod}
              onValueChange={val => setBatchPaymentMethod(val as 'CASH' | 'GCASH' | 'OTHER')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="GCASH">GCash</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => setBatchCompleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={isPending}
              onClick={() => executeBatchAdvance(batchPaymentMethod)}
            >
              Advance All Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  function renderCard(order: BoardOrder, col: ColumnConfig) {
    const isSelected = selectedIds.includes(order.id)
    const isOverdue =
      order.due_at != null &&
      !['COMPLETED', 'CANCELLED'].includes(order.status) &&
      new Date(order.due_at).getTime() < now

    return (
      <div
        key={order.id}
        className={cn(
          'group relative flex flex-col justify-between rounded-lg border bg-card p-3 shadow-2xs transition-all hover:border-foreground/30',
          isSelected && 'border-primary ring-1 ring-primary/30 bg-primary/[0.02]',
          isOverdue && 'border-amber-500/40'
        )}
      >
        <div className="space-y-2">
          {/* Card top: checkbox, order number, due/overdue status */}
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleSelect(order.id)}
                aria-label={`Select ${order.order_number}`}
                className="h-4 w-4"
              />
              <Link
                href={`/orders/${order.id}`}
                className="font-mono text-xs font-semibold hover:underline flex items-center gap-1 text-foreground"
              >
                {order.order_number}
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
              </Link>
            </div>
            {isOverdue ? (
              <Badge
                variant="destructive"
                className="shrink-0 text-[10px] px-1.5 py-0 h-4 bg-amber-600 dark:bg-amber-500 hover:bg-amber-600 text-white gap-1"
              >
                <AlertTriangle className="h-2.5 w-2.5" />
                Overdue
              </Badge>
            ) : order.due_at ? (
              <span className="shrink-0 text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(order.due_at)}
              </span>
            ) : null}
          </div>

          {/* Customer info */}
          <div className="text-xs">
            <p className="font-medium text-foreground truncate">{order.customer.full_name}</p>
            {order.customer.phone && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Phone className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{order.customer.phone}</span>
              </p>
            )}
          </div>
        </div>

        {/* Card footer: price & one-tap advance */}
        <div className="mt-3 flex items-center justify-between border-t pt-2">
          <span className="text-xs font-semibold text-foreground">
            {formatMoney(order.total_cents)}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => handleAdvance(order)}
            className="h-6 px-2 text-[11px] gap-1 hover:bg-accent"
          >
            <span>{col.actionLabel}</span>
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }
}
