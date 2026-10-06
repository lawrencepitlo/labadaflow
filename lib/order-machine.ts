/**
 * Order state machine — single source of truth for valid transitions.
 *
 * RECEIVED → WASHING → DRYING → FOLDING → READY → COMPLETED
 *
 * Backward transitions go exactly one step backward (require note).
 * Any non-terminal status can be CANCELLED (requires reason).
 * COMPLETED and CANCELLED are terminal.
 */

export type OrderStatus =
  | 'RECEIVED'
  | 'WASHING'
  | 'DRYING'
  | 'FOLDING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED'

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'RECEIVED',
  'WASHING',
  'DRYING',
  'FOLDING',
  'READY',
  'COMPLETED',
]

export const TERMINAL_STATUSES: OrderStatus[] = ['COMPLETED', 'CANCELLED']

const FORWARD_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  RECEIVED: 'WASHING',
  WASHING: 'DRYING',
  DRYING: 'FOLDING',
  FOLDING: 'READY',
  READY: 'COMPLETED', // handled by complete_order RPC, not generic advance
}

const BACKWARD_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  WASHING: 'RECEIVED',
  DRYING: 'WASHING',
  FOLDING: 'DRYING',
  READY: 'FOLDING',
}

export interface TransitionResult {
  valid: boolean
  isBackward: boolean
  isCancellation: boolean
  reason?: string
}

export function validateTransition(
  from: OrderStatus,
  to: OrderStatus
): TransitionResult {
  // Terminal statuses cannot transition
  if (from === 'COMPLETED' || from === 'CANCELLED') {
    return {
      valid: false,
      isBackward: false,
      isCancellation: false,
      reason: 'Terminal status cannot transition',
    }
  }

  // Cancellation from any non-terminal status
  if (to === 'CANCELLED') {
    return { valid: true, isBackward: false, isCancellation: true }
  }

  // Forward transition
  if (FORWARD_TRANSITIONS[from] === to) {
    return { valid: true, isBackward: false, isCancellation: false }
  }

  // Backward transition
  if (BACKWARD_TRANSITIONS[from] === to) {
    return { valid: true, isBackward: true, isCancellation: false }
  }

  return {
    valid: false,
    isBackward: false,
    isCancellation: false,
    reason: `${from} → ${to} is not a valid transition`,
  }
}

/**
 * Get the next forward status for a given status.
 * Returns null for terminal statuses or READY (use complete_order instead).
 */
export function getNextStatus(current: OrderStatus): OrderStatus | null {
  if (current === 'READY') return null // Completion is a special action
  return FORWARD_TRANSITIONS[current] ?? null
}

/**
 * Get the previous status for backward transitions.
 */
export function getPreviousStatus(current: OrderStatus): OrderStatus | null {
  return BACKWARD_TRANSITIONS[current] ?? null
}

/**
 * Check if a status is terminal (COMPLETED or CANCELLED).
 */
export function isTerminalStatus(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

/**
 * Check if order items can be edited at the current status.
 * Items are only editable while RECEIVED.
 */
export function canEditItems(status: OrderStatus): boolean {
  return status === 'RECEIVED'
}

/**
 * Status display labels with icons.
 */
export const STATUS_CONFIG: Record<OrderStatus, {
  label: string
  color: string
  bgColor: string
  textColor: string
  description: string
}> = {
  RECEIVED: {
    label: 'Received',
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-950',
    textColor: 'text-blue-700 dark:text-blue-300',
    description: 'Order received and awaiting processing',
  },
  WASHING: {
    label: 'Washing',
    color: 'cyan',
    bgColor: 'bg-cyan-100 dark:bg-cyan-950',
    textColor: 'text-cyan-700 dark:text-cyan-300',
    description: 'Items are being washed',
  },
  DRYING: {
    label: 'Drying',
    color: 'amber',
    bgColor: 'bg-amber-100 dark:bg-amber-950',
    textColor: 'text-amber-700 dark:text-amber-300',
    description: 'Items are being dried',
  },
  FOLDING: {
    label: 'Folding',
    color: 'purple',
    bgColor: 'bg-purple-100 dark:bg-purple-950',
    textColor: 'text-purple-700 dark:text-purple-300',
    description: 'Items are being folded',
  },
  READY: {
    label: 'Ready',
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-950',
    textColor: 'text-green-700 dark:text-green-300',
    description: 'Ready for pickup',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'emerald',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    description: 'Order completed and paid',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'red',
    bgColor: 'bg-red-100 dark:bg-red-950',
    textColor: 'text-red-700 dark:text-red-300',
    description: 'Order has been cancelled',
  },
}
