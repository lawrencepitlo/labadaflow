'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActorByClerkId } from '@/lib/auth'
import { CreateServiceSchema, UpdateServiceSchema } from '@/lib/validation/service'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

export async function createService(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  const actor = await getActorByClerkId(userId)
  if (!actor || actor.role !== 'ADMIN') return { error: 'Forbidden — Admin only' }

  const raw = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || null,
    pricing_unit: formData.get('pricing_unit') as string,
    unit_price_cents: Number(formData.get('unit_price_cents')),
    sort_order: Number(formData.get('sort_order') ?? 0),
  }

  const parsed = CreateServiceSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Invalid input', details: parsed.error.issues }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('services')
    .insert(parsed.data)
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/services')
  return { success: true, id: data.id }
}

export async function updateService(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  const actor = await getActorByClerkId(userId)
  if (!actor || actor.role !== 'ADMIN') return { error: 'Forbidden — Admin only' }

  const raw = {
    id: formData.get('id') as string,
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || null,
    pricing_unit: formData.get('pricing_unit') as string,
    unit_price_cents: Number(formData.get('unit_price_cents')),
    sort_order: Number(formData.get('sort_order') ?? 0),
  }

  const parsed = UpdateServiceSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Invalid input' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('services')
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      pricing_unit: parsed.data.pricing_unit,
      unit_price_cents: parsed.data.unit_price_cents,
      sort_order: parsed.data.sort_order,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)

  if (error) return { error: error.message }

  revalidatePath('/services')
  return { success: true }
}

export async function toggleServiceActive(serviceId: string, isActive: boolean) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  if (!isUuid(serviceId) || typeof isActive !== 'boolean') return { error: 'Invalid input' }

  const actor = await getActorByClerkId(userId)
  if (!actor || actor.role !== 'ADMIN') return { error: 'Forbidden — Admin only' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('services')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', serviceId)

  if (error) return { error: error.message }

  revalidatePath('/services')
  return { success: true }
}
