import { z } from 'zod/v4'

/**
 * Merge line items with identical service_id by summing quantities.
 */
export function mergeServiceItems<T extends { service_id: string; quantity: number }>(items: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of items) {
    const existing = map.get(item.service_id)
    if (existing) {
      existing.quantity = Math.round((Number(existing.quantity) + Number(item.quantity)) * 1000) / 1000
    } else {
      map.set(item.service_id, { ...item, quantity: Number(item.quantity) })
    }
  }
  return Array.from(map.values())
}

export const PaymentMethodEnum = z.enum(['CASH', 'GCASH', 'OTHER'])
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>

export const CreateOrderSchema = z.object({
  customer_id: z.string().uuid(),
  source: z.enum(['WALK_IN', 'PORTAL']).default('WALK_IN'),
  assigned_to: z.string().uuid().optional().nullable(),
  due_at: z.string().datetime().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  items: z.preprocess(
    val => (Array.isArray(val) ? mergeServiceItems(val) : val),
    z.array(z.object({
      service_id: z.string().uuid(),
      quantity: z.number().positive('Quantity must be positive').max(100000, 'Quantity is too large'),
    })).min(1, 'At least one item is required')
  ),
})

export const UpdateOrderItemsSchema = z.object({
  order_id: z.string().uuid(),
  items: z.preprocess(
    val => (Array.isArray(val) ? mergeServiceItems(val) : val),
    z.array(z.object({
      service_id: z.string().uuid(),
      quantity: z.number().positive('Quantity must be positive').max(100000, 'Quantity is too large'),
    })).min(1, 'At least one item is required')
  ),
})

export const AdvanceStatusSchema = z.object({
  order_id: z.string().uuid(),
  to_status: z.enum(['RECEIVED', 'WASHING', 'DRYING', 'FOLDING', 'READY']),
  note: z.string().max(500).optional(),
})

export const CancelOrderSchema = z.object({
  order_id: z.string().uuid(),
  cancel_reason: z.string().min(1, 'Reason is required').max(500),
})

export const CompleteOrderSchema = z.object({
  order_id: z.string().uuid(),
  payment_method: PaymentMethodEnum,
})

export const ReopenOrderSchema = z.object({
  order_id: z.string().uuid(),
  note: z.string().min(1, 'Note is required to reopen order').max(500),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
export type UpdateOrderItemsInput = z.infer<typeof UpdateOrderItemsSchema>
export type AdvanceStatusInput = z.infer<typeof AdvanceStatusSchema>
export type CancelOrderInput = z.infer<typeof CancelOrderSchema>
export type CompleteOrderInput = z.infer<typeof CompleteOrderSchema>
export type ReopenOrderInput = z.infer<typeof ReopenOrderSchema>
