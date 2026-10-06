import { z } from 'zod/v4'

export const CreateOrderSchema = z.object({
  customer_id: z.string().uuid(),
  source: z.enum(['WALK_IN', 'PORTAL']),
  assigned_to: z.string().uuid().optional().nullable(),
  due_at: z.string().datetime().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(z.object({
    service_id: z.string().uuid(),
    quantity: z.number().positive('Quantity must be positive'),
  })).min(1, 'At least one item is required'),
})

export const UpdateOrderItemsSchema = z.object({
  order_id: z.string().uuid(),
  items: z.array(z.object({
    service_id: z.string().uuid(),
    quantity: z.number().positive('Quantity must be positive'),
  })).min(1, 'At least one item is required'),
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
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
export type UpdateOrderItemsInput = z.infer<typeof UpdateOrderItemsSchema>
export type AdvanceStatusInput = z.infer<typeof AdvanceStatusSchema>
export type CancelOrderInput = z.infer<typeof CancelOrderSchema>
export type CompleteOrderInput = z.infer<typeof CompleteOrderSchema>
