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
  Square,
  X,
  ExternalLink,
  Plus,
  ListFilter,
  PackageCheck,
  Sparkles,
  RotateCcw,
  Search,
} from 'lucide-react'
import { cn } from 'cn'

interface ColumnConfig {
  status: OrderStatus
  label: string
  actionLabel: string
  nextStatus: OrderStatus | 'COMPLETED'
  dotClass: string
  headerBg: string
}

const COLUMNS: ColumnConfig[] = [
  {
    status: 'RECEIVED',
    label: 'Received',
    actionLabel: 'Start Wash',
    nextStatus: 'WASHING',
    dotClass: 'bg-blue-500 shadow-blue-500/30',
    headerBg: 'bg-blue-500/5 text-blue-700 dark:text-blue-300',
  },
  {
    status: 'WASHING',
    label: 'Washing',
    actionLabel: 'Move to Dryer',
    nextStatus: 'DRYING',
    dotClass: 'bg-sky-500 shadow-sky-500/30',
    headerBg: 'bg-sky-500/5 text-sky-700 dark:text-sky-300',
  },
  {
    status: 'DRYING',
    label: 'Drying',
    actionLabel: 'Move to Fold',
    nextStatus: 'FOLDING',
    dotClass: 'bg-amber-500 shadow-amber-500/30',
    headerBg: 'bg-amber-500/5 text-amber-700 dark:text-amber-300',
  },
  {
    status: 'FOLDING',
    label: 'Folding',
    actionLabel: 'Mark Ready',
    nextStatus: 'READY',
    dotClass: 'bg-purple-500 shadow-purple-500/30',
    headerBg: 'bg-purple-500/5 text-purple-700 dark:text-purple-300',
  },
  {
    status: 'READY',
    label: 'Ready for Pickup',
    actionLabel: 'Complete & Pay',
    nextStatus: 'COMPLETED',
    dotClass: 'bg-emerald-500 shadow-emerald-500/30',
    headerBg: 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
  },
]

export function BoardView({ initialOrders }: { initialOrders: BoardOrder[] }) {
  const router = useRouter()
  const [orders, setOrders] = useState<BoardOrder[]>(initialOrders)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [desktopFilter, setDesktopFilter] = useState<'ALL' | OrderStatus>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<OrderStatus>('RECEIVED')
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Payment complete modal state
  const [completingOrder, setCompletingOrder] = useState<BoardOrder | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'GCASH' | 'OTHER'>('CASH')

  // Batch complete modal state
  const [batchCompleteOpen, setBatchCompleteOpen] = useState(false)
  const [batchPaymentMethod, setBatchPaymentMethod] = useState<'CASH' | 'GCASH' | 'OTHER'>('CASH')

  const now = Date.now()

  function getColumnOrders(status: OrderStatus) {
    return orders.filter(o => {
      if (o.status !== status) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchNum = o.order_number.toLowerCase().includes(q)
        const matchCust = o.customer.full_name.toLowerCase().includes(q)
        const matchPhone = o.customer.phone?.toLowerCase().includes(q)
        if (!matchNum && !matchCust && !matchPhone) return false
      }
      return true
    })
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function selectAllInColumn(status: OrderStatus) {
    const colIds = getColumnOrders(status).map(o => o.id)
    const allSelected = colIds.length > 0 && colIds.every(id => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !colIds.includes(id)))
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...colIds])))
    }
  }

  function clearSelection() {
    setSelectedIds([])
  }

  // Single card step backward / revert
  function handleRevert(order: BoardOrder) {
    const prevMap: Partial<Record<OrderStatus, OrderStatus>> = {
      WASHING: 'RECEIVED',
      DRYING: 'WASHING',
      FOLDING: 'DRYING',
      READY: 'FOLDING',
    }
    const prevStatus = prevMap[order.status as OrderStatus]
    if (!prevStatus) return

    const previousOrders = [...orders]
    // Optimistic UI
    setOrders(prev =>
      prev.map(o => (o.id === order.id ? { ...o, status: prevStatus } : o))
    )
    setErrorMessage(null)

    startTransition(async () => {
      const res = await advanceOrderStatus({
        order_id: order.id,
        to_status: prevStatus,
        note: 'Reverted station step on board',
      })

      if (res?.error) {
        setOrders(previousOrders)
        setErrorMessage(`Failed to revert ${order.order_number}: ${res.error}`)
      } else {
        router.refresh()
      }
    })
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

    // Optimistic UI: remove from board since COMPLETED is not shown on active board
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

  const overdueCount = orders.filter(
    o => o.due_at && new Date(o.due_at).getTime() < now
  ).length

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Top Header & Context Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Operations Board</h1>
            <Badge variant="secondary" className="px-2 py-0.5 text-xs font-semibold">
              {orders.length} Active
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Move laundry loads across shop stations in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" render={<Link href="/orders" />} className="h-9 gap-1.5 text-xs font-medium">
            <ListFilter className="h-3.5 w-3.5 text-muted-foreground" />
            Orders List
          </Button>
          <Button size="sm" render={<Link href="/orders/new" />} className="h-9 gap-1.5 text-xs font-medium">
            <Plus className="h-3.5 w-3.5" />
            New Intake
          </Button>
        </div>
      </div>

      {/* Interactive Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDesktopFilter('ALL')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors outline-none',
              desktopFilter === 'ALL'
                ? 'bg-foreground text-background shadow-xs'
                : 'border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <span>All Stations</span>
            <span
              className={cn(
                'tnum rounded-md px-1.5 py-0.2 text-[10px] font-semibold',
                desktopFilter === 'ALL' ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground'
              )}
            >
              {orders.length}
            </span>
          </button>

          {COLUMNS.map(col => {
            const count = getColumnOrders(col.status).length
            const active = desktopFilter === col.status
            return (
              <button
                key={col.status}
                type="button"
                onClick={() => setDesktopFilter(col.status)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors outline-none',
                  active
                    ? 'bg-foreground text-background shadow-xs'
                    : 'border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                <span className={cn('h-2 w-2 rounded-full ring-2 ring-current/20', col.dotClass)} />
                <span>{col.label}</span>
                <span
                  className={cn(
                    'tnum rounded-md px-1.5 py-0.2 text-[10px] font-semibold',
                    active ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search box to narrow cards */}
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Filter board by name or #…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-8 w-full rounded-lg border border-border/70 bg-muted/30 pl-8 pr-3 text-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:bg-background"
          />
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mobile Stage Switcher (<768px) */}
      <div className="flex overflow-x-auto gap-1 rounded-xl border bg-muted/40 p-1.5 md:hidden">
        {COLUMNS.map(col => {
          const count = getColumnOrders(col.status).length
          const isActive = activeTab === col.status
          return (
            <button
              key={col.status}
              type="button"
              onClick={() => setActiveTab(col.status)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', col.dotClass)} />
              <span>{col.label}</span>
              <span className="rounded-full bg-muted/80 px-1.5 py-0.2 text-[10px] font-mono">
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Mobile Active Column View */}
      <div className="md:hidden">
        {COLUMNS.filter(c => c.status === activeTab).map(col => {
          const colOrders = getColumnOrders(col.status)
          return (
            <div key={col.status} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {col.label} · {colOrders.length} order{colOrders.length === 1 ? '' : 's'}
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
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-10 text-center">
                  <PackageCheck className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm font-medium text-foreground">No orders in {col.label.toLowerCase()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Loads moved to this station will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {colOrders.map(order => renderCard(order, col))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Desktop 5-Column Spacious Board (>= 768px) */}
      <div className="hidden md:flex gap-4 xl:gap-5 overflow-x-auto pb-6 items-start">
        {COLUMNS.filter(col => desktopFilter === 'ALL' || col.status === desktopFilter).map(col => {
          const colOrders = getColumnOrders(col.status)
          const allSelected =
            colOrders.length > 0 && colOrders.every(o => selectedIds.includes(o.id))

          return (
            <div
              key={col.status}
              className={cn(
                'flex-1 flex flex-col rounded-2xl border border-border/70 bg-muted/30 dark:bg-zinc-900/30 p-2.5 shadow-2xs',
                desktopFilter === 'ALL' ? 'min-w-[280px] max-w-[340px]' : 'max-w-2xl mx-auto'
              )}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-2 mb-2 rounded-xl bg-background/80 backdrop-blur-xs border border-border/40">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn('h-2.5 w-2.5 rounded-full ring-2 ring-current/20', col.dotClass)} />
                  <span className="truncate text-xs font-bold tracking-tight text-foreground uppercase">
                    {col.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-mono font-semibold text-foreground">
                    {colOrders.length}
                  </span>
                  {colOrders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => selectAllInColumn(col.status)}
                      title={allSelected ? 'Deselect column' : 'Select column'}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      {allSelected ? (
                        <CheckSquare className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-muted-foreground/60" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-3 p-1 min-h-[520px] max-h-[calc(100vh-230px)] overflow-y-auto">
                {colOrders.length === 0 ? (
                  <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 text-center p-4">
                    <Sparkles className="h-5 w-5 text-muted-foreground/30 mb-1.5" />
                    <p className="text-xs font-medium text-muted-foreground">All clear</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">No orders waiting</p>
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
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3.5 rounded-full border border-border/80 bg-background/95 px-5 py-2.5 shadow-2xl backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10"
        >
          <span className="text-xs font-semibold text-foreground">
            {selectedIds.length} order{selectedIds.length === 1 ? '' : 's'} selected
          </span>
          <div className="h-4 w-px bg-border" />
          <Button
            size="sm"
            disabled={isPending}
            onClick={handleBatchAdvance}
            className="h-8 gap-1.5 rounded-full text-xs font-medium px-4 shadow-xs"
          >
            <span>Advance Stage</span>
            <ChevronRight className="h-3.5 w-3.5" />
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

      {/* Single Complete Order & Payment Dialog */}
      {completingOrder && (
        <Dialog open={!!completingOrder} onOpenChange={open => !open && setCompletingOrder(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Order & Collect Payment</DialogTitle>
              <DialogDescription>
                Record final customer payment and complete order #{completingOrder.order_number}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{completingOrder.customer.full_name}</p>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">{completingOrder.order_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Due</p>
                  <p className="text-lg font-extrabold text-foreground tabular-nums">
                    {formatMoney(completingOrder.total_cents)}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Payment Method</label>
                <Select
                  value={paymentMethod}
                  onValueChange={val => setPaymentMethod(val as 'CASH' | 'GCASH' | 'OTHER')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash Payment</SelectItem>
                    <SelectItem value="GCASH">GCash / Digital QR</SelectItem>
                    <SelectItem value="OTHER">Card / Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => setCompletingOrder(null)}
              >
                Cancel
              </Button>
              <Button disabled={isPending} onClick={handleConfirmComplete} className="gap-1.5">
                <PackageCheck className="h-4 w-4" />
                Collect Payment & Complete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Batch Complete Dialog for items that include READY */}
      <Dialog open={batchCompleteOpen} onOpenChange={setBatchCompleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Advance Selected Orders</DialogTitle>
            <DialogDescription>
              Some selected orders are in Ready for Pickup and will be marked as Completed. Select
              the payment method to record.
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
                <SelectItem value="CASH">Cash Payment</SelectItem>
                <SelectItem value="GCASH">GCash</SelectItem>
                <SelectItem value="OTHER">Card / Other</SelectItem>
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
          'group relative flex flex-col justify-between rounded-xl border bg-card p-3.5 shadow-xs transition-all duration-150 hover:shadow-md hover:border-foreground/30',
          isSelected && 'border-primary ring-2 ring-primary/30 bg-primary/[0.02]',
          isOverdue && 'border-amber-500/50 bg-amber-500/[0.02]'
        )}
      >
        <div className="space-y-2.5">
          {/* Card Top: Selection Checkbox, Order Number, Due Badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleSelect(order.id)}
                aria-label={`Select ${order.order_number}`}
                className="h-4 w-4 rounded"
              />
              <Link
                href={`/orders/${order.id}`}
                className="font-mono text-xs font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1 group-hover:underline"
              >
                {order.order_number}
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
              </Link>
            </div>

            {isOverdue ? (
              <Badge
                variant="destructive"
                className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 h-4.5 bg-amber-600 dark:bg-amber-500 text-white gap-1"
              >
                <AlertTriangle className="h-2.5 w-2.5" />
                Overdue
              </Badge>
            ) : order.due_at ? (
              <span className="shrink-0 text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground/70" />
                {formatDate(order.due_at)}
              </span>
            ) : null}
          </div>

          {/* Customer Details */}
          <div className="pt-0.5">
            <p className="text-sm font-semibold text-foreground tracking-tight line-clamp-1">
              {order.customer.full_name}
            </p>
            {order.customer.phone && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-1 font-mono">
                <Phone className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                <span>{order.customer.phone}</span>
              </p>
            )}
          </div>
        </div>

        {/* Card Footer: Total Price & Quick Action */}
        <div className="mt-3.5 flex items-center justify-between border-t pt-2.5">
          <div className="leading-tight">
            <span className="block text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Amount</span>
            <span className="text-sm font-bold text-foreground tabular-nums">
              {formatMoney(order.total_cents)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {order.status !== 'RECEIVED' && (
              <Button
                variant="ghost"
                size="icon-sm"
                title="Undo / Step backward"
                disabled={isPending}
                onClick={() => handleRevert(order)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Revert to previous stage"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => handleAdvance(order)}
              className="h-7.5 px-3 text-xs font-medium rounded-lg gap-1 shadow-2xs hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <span>{col.actionLabel}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
