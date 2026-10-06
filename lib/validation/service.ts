import { z } from 'zod/v4'

export const CreateServiceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  description: z.string().max(500).optional().nullable(),
  pricing_unit: z.enum(['PER_KG', 'PER_PIECE']),
  unit_price_cents: z.number().int().min(0).max(99999999),
  sort_order: z.number().int().default(0),
})

export const UpdateServiceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100).trim(),
  description: z.string().max(500).optional().nullable(),
  pricing_unit: z.enum(['PER_KG', 'PER_PIECE']),
  unit_price_cents: z.number().int().min(0).max(99999999),
  sort_order: z.number().int().default(0),
})

export type CreateServiceInput = z.infer<typeof CreateServiceSchema>
export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>
