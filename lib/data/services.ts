/**
 * Data Access Layer — Services
 * All service queries go through here with proper authorization.
 */
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { getActorByClerkId } from '@/lib/auth'

export interface ServiceItem {
  id: string
  name: string
  description: string | null
  pricing_unit: 'PER_KG' | 'PER_PIECE'
  unit_price_cents: number
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

/**
 * Get all services (admin sees all, staff sees active only).
 */
export async function getServices(): Promise<ServiceItem[]> {
  const { userId } = await auth()
  if (!userId) return []

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return []

  const supabase = await createClient()
  let query = supabase
    .from('services')
    .select('id, name, description, pricing_unit, unit_price_cents, is_active, sort_order, created_at, updated_at')
    .order('sort_order')
    .order('name')

  // Staff only sees active services
  if (actor.role === 'STAFF') {
    query = query.eq('is_active', true)
  }

  const { data } = await query
  return (data ?? []) as ServiceItem[]
}

/**
 * Get active services for order creation.
 */
export async function getActiveServices(): Promise<ServiceItem[]> {
  const { userId } = await auth()
  if (!userId) return []

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('services')
    .select('id, name, description, pricing_unit, unit_price_cents, is_active, sort_order, created_at, updated_at')
    .eq('is_active', true)
    .order('sort_order')
    .order('name')

  return (data ?? []) as ServiceItem[]
}

/**
 * Get service by ID (admin only for editing).
 */
export async function getServiceById(serviceId: string): Promise<ServiceItem | null> {
  const { userId } = await auth()
  if (!userId) return null

  const actor = await getActorByClerkId(userId)
  if (!actor || actor.role !== 'ADMIN') return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('services')
    .select('id, name, description, pricing_unit, unit_price_cents, is_active, sort_order, created_at, updated_at')
    .eq('id', serviceId)
    .single()

  return data as ServiceItem | null
}
