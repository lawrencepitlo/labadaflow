import { z } from 'zod/v4'

export const CreateCustomerSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(100).trim(),
  phone: z.string().max(20).optional().nullable(),
  email: z.union([z.string().email('Invalid email'), z.literal('')]).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

export const UpdateCustomerSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1, 'Name is required').max(100).trim(),
  phone: z.string().max(20).optional().nullable(),
  email: z.union([z.string().email('Invalid email'), z.literal('')]).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>
