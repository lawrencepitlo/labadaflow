'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActorByClerkId } from '@/lib/auth'
import { getCustomerByClerkId } from '@/lib/data/customers'
import { z } from 'zod/v4'

const UpdateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).trim(),
  phone: z.string().max(20).optional().nullable(),
  email: z.union([z.string().email(), z.literal('')]).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
})

export async function updateOwnProfile(input: {
  full_name: string
  phone?: string | null
  email?: string | null
  address?: string | null
}) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  const actor = await getActorByClerkId(userId)
  if (!actor || actor.role !== 'CUSTOMER') return { error: 'Forbidden' }

  const customer = await getCustomerByClerkId(userId)
  if (!customer) return { error: 'Customer record not linked' }

  const parsed = UpdateProfileSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('customers')
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', customer.id)
    .eq('clerk_user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/portal/profile')
  return { success: true }
}
