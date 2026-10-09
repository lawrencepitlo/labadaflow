'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActorByClerkId } from '@/lib/auth'
import { CreateCustomerSchema, UpdateCustomerSchema } from '@/lib/validation/customer'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

export async function createCustomer(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return { error: 'Forbidden' }

  const raw = {
    full_name: formData.get('full_name') as string,
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || null,
    address: (formData.get('address') as string) || null,
    notes: (formData.get('notes') as string) || null,
  }

  const parsed = CreateCustomerSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Invalid input', details: parsed.error.issues }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customers')
    .insert(parsed.data)
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/customers')
  return { success: true, id: data.id }
}

export async function updateCustomer(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return { error: 'Forbidden' }

  const raw = {
    id: formData.get('id') as string,
    full_name: formData.get('full_name') as string,
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || null,
    address: (formData.get('address') as string) || null,
    notes: (formData.get('notes') as string) || null,
  }

  const parsed = UpdateCustomerSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Invalid input' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('customers')
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      address: parsed.data.address,
      notes: parsed.data.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)

  if (error) return { error: error.message }

  revalidatePath(`/customers/${parsed.data.id}`)
  revalidatePath('/customers')
  return { success: true }
}

export async function archiveCustomer(customerId: string) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  if (!isUuid(customerId)) return { error: 'Invalid input' }

  const actor = await getActorByClerkId(userId)
  if (!actor || actor.role !== 'ADMIN') return { error: 'Forbidden — Admin only' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('customers')
    .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', customerId)

  if (error) return { error: error.message }

  revalidatePath(`/customers/${customerId}`)
  revalidatePath('/customers')
  return { success: true }
}

export async function restoreCustomer(customerId: string) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  if (!isUuid(customerId)) return { error: 'Invalid input' }

  const actor = await getActorByClerkId(userId)
  if (!actor || actor.role !== 'ADMIN') return { error: 'Forbidden — Admin only' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('customers')
    .update({ archived_at: null, updated_at: new Date().toISOString() })
    .eq('id', customerId)

  if (error) return { error: error.message }

  revalidatePath(`/customers/${customerId}`)
  revalidatePath('/customers')
  return { success: true }
}
