/**
 * Data Access Layer — Customers
 * All customer queries go through here with proper authorization.
 */
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { getActorByClerkId } from '@/lib/auth'

const PAGE_SIZE = 20

export interface CustomerListItem {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  archived_at: string | null
  created_at: string
  order_count: number
}

export interface CustomerDetail {
  id: string
  clerk_user_id: string | null
  full_name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface CustomersListResult {
  customers: CustomerListItem[]
  total: number
  page: number
  pageSize: number
}

export async function getCustomers(options: {
  search?: string
  showArchived?: boolean
  page?: number
}): Promise<CustomersListResult | null> {
  const { userId } = await auth()
  if (!userId) return null

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return null

  const supabase = await createClient()
  const page = options.page ?? 1
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('customers')
    .select('id, full_name, phone, email, archived_at, created_at', { count: 'exact' })

  // Filter archived
  if (!options.showArchived) {
    query = query.is('archived_at', null)
  }

  // Search. Strip PostgREST `or`-filter syntax characters (`,`/`(`/`)`) so a
  // search term can never corrupt the filter expression into a query error.
  if (options.search?.trim()) {
    const term = options.search.trim().replace(/[,()]/g, '')
    if (term) {
      query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`)
    }
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  const { data, count, error } = await query

  if (error || !data) return null

  // Get order counts for these customers
  const customerIds = data.map(c => c.id)
  const { data: orderCounts } = await supabase
    .from('orders')
    .select('customer_id')
    .in('customer_id', customerIds)

  const countMap: Record<string, number> = {}
  orderCounts?.forEach(o => {
    countMap[o.customer_id] = (countMap[o.customer_id] || 0) + 1
  })

  const customers: CustomerListItem[] = data.map(c => ({
    ...c,
    order_count: countMap[c.id] || 0,
  }))

  return {
    customers,
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  }
}

export async function getCustomerById(customerId: string): Promise<CustomerDetail | null> {
  const { userId } = await auth()
  if (!userId) return null

  const actor = await getActorByClerkId(userId)
  if (!actor) return null

  // Customers can only view their own record
  if (actor.role === 'CUSTOMER') {
    const customerRecord = await getCustomerByClerkId(userId)
    if (!customerRecord || customerRecord.id !== customerId) return null
  } else if (!['ADMIN', 'STAFF'].includes(actor.role)) {
    return null
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('customers')
    .select('id, clerk_user_id, full_name, phone, email, address, notes, archived_at, created_at, updated_at')
    .eq('id', customerId)
    .single()

  return data as CustomerDetail | null
}

export async function getOwnCustomerProfile() {
  const { userId } = await auth()
  if (!userId) return null

  const actor = await getActorByClerkId(userId)
  if (!actor || actor.role !== 'CUSTOMER') return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('customers')
    .select('id, full_name, phone, email, address, notes, created_at')
    .eq('clerk_user_id', userId)
    .single()

  return data
}

export async function getCustomerByClerkId(clerkUserId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('customers')
    .select('id, full_name, phone, email')
    .eq('clerk_user_id', clerkUserId)
    .single()

  return data
}

export async function checkDuplicatePhone(phone: string, excludeId?: string) {
  if (!phone?.trim()) return []

  const supabase = await createClient()
  let query = supabase
    .from('customers')
    .select('id, full_name, phone')
    .eq('phone', phone.trim())
    .is('archived_at', null)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data } = await query
  return data ?? []
}

/**
 * Get all customers for selection (e.g., order creation).
 * Returns minimal data: id, full_name, phone.
 */
export async function getCustomersForSelect(): Promise<{ id: string; full_name: string; phone: string | null }[]> {
  const { userId } = await auth()
  if (!userId) return []

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('customers')
    .select('id, full_name, phone')
    .is('archived_at', null)
    .order('full_name')

  return data ?? []
}
