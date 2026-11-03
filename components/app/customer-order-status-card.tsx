'use client'

import { useState } from 'react'
import {
  PackageCheck,
  Waves,
  Wind,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Clock,
  Receipt,
  Copy,
  Check,
  Share2,
  Store,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { type OrderStatus, STATUS_CONFIG } from '@/lib/order-machine'
import { formatMoney } from '@/lib/money'
import { formatDate, formatDateTime, formatRelativeTime } from '@/lib/time'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface CustomerOrderStatusProps {
  order: {
    order_number: string
    tracking_code: string
    status: OrderStatus
    received_at: string
    due_at: string | null
    updated_at: string
    completed_at?: string | null
    cancelled_at?: string | null
    cancel_reason?: string | null
    total_cents?: number
    paid_at?: string | null
    payment_method?: 'CASH' | 'GCASH' | 'OTHER' | null
    customer_name?: string
    notes?: string | null
    items?: {
      service_name: string
      quantity: number
      pricing_unit: 'PER_KG' | 'PER_PIECE'
      line_total_cents: number
    }[]
    events?: { to_status: OrderStatus; created_at: string }[]
  }
}

const STAGES: {
  status: OrderStatus
  stepNumber: number
  label: string
  sublabel: string
  icon: typeof Waves
  color: string
  bgLight: string
  bgBorder: string
  pulseColor: string
  processDescription: string
}[] = [
  {
    status: 'RECEIVED',
    stepNumber: 1,
    label: 'Received & Weighed',
    sublabel: 'Counter Check-in',
    icon: PackageCheck,
    color: 'text-blue-600 dark:text-blue-400',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
    bgBorder: 'border-blue-200 dark:border-blue-800/60',
    pulseColor: 'bg-blue-500',
    processDescription: 'Your laundry has been checked in and weighed at the counter. Items have been tagged and placed in queue for washing.',
  },
  {
    status: 'WASHING',
    stepNumber: 2,
    label: 'Washing Cycle',
    sublabel: 'Washer Active',
    icon: Waves,
    color: 'text-sky-600 dark:text-sky-400',
    bgLight: 'bg-sky-50 dark:bg-sky-950/40',
    bgBorder: 'border-sky-200 dark:border-sky-800/60',
    pulseColor: 'bg-sky-500',
    processDescription: 'Inside the washing machine! Running a thorough wash and rinse cycle with detergent and fabric conditioner.',
  },
  {
    status: 'DRYING',
    stepNumber: 3,
    label: 'Drying Cycle',
    sublabel: 'Commercial Dryers',
    icon: Wind,
    color: 'text-amber-600 dark:text-amber-400',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    bgBorder: 'border-amber-200 dark:border-amber-800/60',
    pulseColor: 'bg-amber-500',
    processDescription: 'In the tumble dryer! Drying at fabric-safe temperatures to preserve garment softness and eliminate dampness.',
  },
  {
    status: 'FOLDING',
    stepNumber: 4,
    label: 'Folding & Packaging',
    sublabel: 'Quality Packaging',
    icon: Sparkles,
    color: 'text-purple-600 dark:text-purple-400',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40',
    bgBorder: 'border-purple-200 dark:border-purple-800/60',
    pulseColor: 'bg-purple-500',
    processDescription: 'Fresh from drying! Staff is folding, inspecting, pairing socks, and packaging your laundry into clean protective bags.',
  },
  {
    status: 'READY',
    stepNumber: 5,
    label: 'Ready for Pickup',
    sublabel: 'Waiting at Counter',
    icon: ShoppingBag,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    bgBorder: 'border-emerald-200 dark:border-emerald-800/60',
    pulseColor: 'bg-emerald-500',
    processDescription: 'Your laundry is 100% clean, folded, and bagged on our pickup shelf! Bring your tracking code or slip to claim.',
  },
]

export function CustomerOrderStatusCard({ order }: CustomerOrderStatusProps) {
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const isCancelled = order.status === 'CANCELLED'
  const isCompleted = order.status === 'COMPLETED'
  const isReady = order.status === 'READY'

  const currentStageIndex = STAGES.findIndex(s => s.status === order.status)
  const activeStage = STAGES[currentStageIndex] ?? (isCompleted ? STAGES[4] : STAGES[0])

  // Progress percentage calculation
  const progressPercent = isCompleted
    ? 100
    : isCancelled
      ? 0
      : Math.min(100, Math.max(15, ((currentStageIndex + 1) / STAGES.length) * 100))

  function handleCopyCode() {
    navigator.clipboard.writeText(order.tracking_code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  function handleShareLink() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({
        title: `Laundry Status — Order ${order.order_number}`,
        text: `Track laundry order ${order.order_number}: ${STATUS_CONFIG[order.status]?.label}`,
        url,
      }).catch(() => {
        copyFallback(url)
      })
    } else {
      copyFallback(url)
    }
  }

  function copyFallback(url: string) {
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="space-y-5">
      {/* Primary Hero Status Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-card shadow-sm dark:border-border">
        {/* Top Header Bar */}
        <div className="border-b border-border/70 bg-slate-50/70 px-5 py-3.5 dark:bg-muted/30 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Order #{order.order_number}
              </span>
              {order.customer_name && (
                <span className="text-xs text-muted-foreground">
                  · {order.customer_name}
                </span>
              )}
            </div>

            {/* Quick 1-Click Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs transition-colors hover:bg-muted/80 active:scale-95"
                title="Copy tracking code to clipboard"
              >
                {copiedCode ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="font-mono text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-mono">{order.tracking_code}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShareLink}
                className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-2xs transition-colors hover:bg-muted/80 hover:text-foreground active:scale-95"
                title="Share tracking link"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Share</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Status Callout Banner */}
        <div className="p-5 sm:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                {!isCancelled && !isCompleted && (
                  <span className="relative flex h-3 w-3">
                    <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', activeStage.pulseColor)} />
                    <span className={cn('relative inline-flex h-3 w-3 rounded-full', activeStage.pulseColor)} />
                  </span>
                )}
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Laundry Status
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {isCompleted ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Order Completed & Picked Up</span>
                ) : isCancelled ? (
                  <span className="text-rose-600 dark:text-rose-400">Order Cancelled</span>
                ) : (
                  <span>{activeStage.label}</span>
                )}
              </h1>

              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                {isCompleted
                  ? 'Your order has been collected and finalized. Thank you for washing with us!'
                  : isCancelled
                    ? (order.cancel_reason ? `Cancellation reason: ${order.cancel_reason}` : 'This order was cancelled. Please check at the shop counter if you have questions.')
                    : activeStage.processDescription}
              </p>
            </div>

            {/* Ready Callout or Target Estimated Time */}
            {isReady ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-center dark:border-emerald-800/60 dark:bg-emerald-950/40">
                <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  <Store className="h-4 w-4" />
                  Ready at Shop Counter!
                </div>
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  Please show code <span className="font-mono font-bold">{order.tracking_code}</span>
                </p>
              </div>
            ) : order.due_at && !isCompleted && !isCancelled ? (
              <div className="rounded-xl border border-border/80 bg-slate-50/70 p-4 text-center dark:bg-muted/40">
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Estimated Pickup Time
                </div>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {formatDate(order.due_at)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatRelativeTime(order.due_at)}
                </p>
              </div>
            ) : null}
          </div>

          {/* Progress Bar */}
          {!isCancelled && (
            <div className="mt-8 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground">Workflow Progress</span>
                <span className="font-semibold text-primary">{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
                <div
                  className="h-full rounded-full bg-linear-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Multi-stage Visual Stepper (Desktop & Mobile Responsive) */}
          {!isCancelled && (
            <div className="mt-8 border-t border-border/60 pt-6">
              <h2 className="sr-only">Process Stages</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {STAGES.map((s, idx) => {
                  const isCurrent = s.status === order.status
                  const isPassed = isCompleted || (!isCancelled && currentStageIndex > idx)
                  const Icon = s.icon

                  return (
                    <div
                      key={s.status}
                      className={cn(
                        'relative flex flex-col items-center rounded-xl border p-3 text-center transition-all',
                        isCurrent
                          ? cn('shadow-xs ring-2 ring-primary/30', s.bgLight, s.bgBorder)
                          : isPassed
                            ? 'border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                            : 'border-border/60 bg-background opacity-60'
                      )}
                    >
                      <div
                        className={cn(
                          'mb-2 flex h-8 w-8 items-center justify-center rounded-lg',
                          isCurrent
                            ? cn(s.color, 'bg-white shadow-2xs dark:bg-card')
                            : isPassed
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                              : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {isPassed && !isCurrent ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>

                      <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Step {s.stepNumber}
                      </span>
                      <span
                        className={cn(
                          'mt-0.5 text-xs font-semibold leading-tight',
                          isCurrent ? 'text-foreground' : isPassed ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'
                        )}
                      >
                        {s.label}
                      </span>

                      {isCurrent && (
                        <span className="mt-1.5 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          Active Now
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details & Counter Slip Information */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Order Items & Services Breakdown */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-card p-5 shadow-xs dark:border-border sm:p-6">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Receipt className="h-4 w-4 text-primary" />
              Items & Services
            </h2>
            {order.items && order.items.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {order.items.length} line item{order.items.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <div className="mt-3.5 divide-y divide-border/60">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{item.service_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {item.pricing_unit === 'PER_KG' ? 'kg' : 'pcs'}
                    </p>
                  </div>
                  <span className="font-mono font-semibold text-foreground">
                    {formatMoney(item.line_total_cents)}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-3 text-xs text-muted-foreground">
                Laundry items logged at intake.
              </p>
            )}
          </div>

          {/* Payment & Balance Row */}
          {typeof order.total_cents === 'number' && (
            <div className="mt-4 border-t border-border/80 pt-4">
              <div className="flex items-center justify-between text-base font-bold">
                <span className="text-foreground">Total Amount</span>
                <span className="font-mono text-primary">{formatMoney(order.total_cents)}</span>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs dark:bg-muted/40">
                <span className="font-medium text-muted-foreground">Payment Status:</span>
                {order.paid_at ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Paid in Full {order.payment_method ? `(${order.payment_method})` : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Balance due at counter
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Counter Intake & Dates Summary */}
        <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-card p-5 shadow-xs dark:border-border sm:p-6">
          <div>
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Store className="h-4 w-4 text-primary" />
                Counter Claim Information
              </h2>
            </div>

            <dl className="mt-3.5 divide-y divide-border/60 text-xs">
              <div className="flex items-center justify-between py-2.5 first:pt-0">
                <dt className="text-muted-foreground">Counter Intake Date</dt>
                <dd className="font-medium text-foreground">{formatDateTime(order.received_at)}</dd>
              </div>

              {order.due_at && (
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-muted-foreground">Estimated Ready</dt>
                  <dd className="font-semibold text-foreground">{formatDate(order.due_at)}</dd>
                </div>
              )}

              <div className="flex items-center justify-between py-2.5">
                <dt className="text-muted-foreground">Last Stage Update</dt>
                <dd className="font-medium text-foreground">{formatRelativeTime(order.updated_at)}</dd>
              </div>

              {order.notes && (
                <div className="py-2.5">
                  <dt className="text-muted-foreground">Intake Notes</dt>
                  <dd className="mt-1 rounded-lg bg-muted/40 p-2 text-foreground italic">
                    {order.notes}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="mt-4 rounded-xl bg-primary/5 border border-primary/15 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-0.5">💡 How to claim your laundry:</p>
            When your status shows <strong className="text-emerald-600">Ready for Pickup</strong>, simply walk in to our counter and show tracking code <span className="font-mono font-bold text-foreground">{order.tracking_code}</span>.
          </div>
        </div>
      </div>

      {/* Expandable Activity Log / Timeline */}
      {order.events && order.events.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-card dark:border-border">
          <button
            type="button"
            onClick={() => setShowHistory(prev => !prev)}
            className="flex w-full items-center justify-between px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground hover:bg-muted/40 transition-colors"
          >
            <span>Timeline & Stage History ({order.events.length} event{order.events.length === 1 ? '' : 's'})</span>
            {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showHistory && (
            <div className="border-t border-border/70 p-5 bg-slate-50/50 dark:bg-muted/20">
              <ol className="relative ml-2 space-y-4 border-l border-border/80">
                {order.events.map((evt, idx) => {
                  const stageMeta = STAGES.find(s => s.status === evt.to_status)
                  return (
                    <li key={idx} className="ml-4">
                      <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {stageMeta?.label ?? evt.to_status}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDateTime(evt.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {stageMeta?.processDescription ?? 'Stage updated.'}
                      </p>
                    </li>
                  )
                })}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
