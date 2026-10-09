/**
 * Data Access Layer — Orders
 * All order queries go through here with proper authorization.
 */
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { getActorByClerkId } from '@/lib/auth'
import { getCustomerByClerkId } from './customers'
import type { OrderStatus } from '@/lib/order-machine'

const PAGE_SIZE = 20

export interface OrderListItem {
  id: string
  order_number: string
  tracking_code: string
  status: OrderStatus
  source: 'WALK_IN' | 'PORTAL'
  total_cents: number
  received_at: string
  due_at: string | null
  created_at: string
  customer: {
    id: string
    full_name: string
    phone: string | null
  }
}

export interface OrderDetailDTO {
  id: string
  order_number: string
  tracking_code: string
  status: OrderStatus
  source: 'WALK_IN' | 'PORTAL'
  total_cents: number
  due_at: string | null
  notes: string | null
  cancel_reason: string | null
  received_at: string
  paid_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
  customer: {
    id: string
    full_name: string
    phone: string | null
    email: string | null
  }
  assigned_staff: {
    id: string
    full_name: string
  } | null
  created_by_user: {
    id: string
    full_name: string
  } | null
  items: OrderItemDTO[]
  events: OrderEventDTO[]
}

export interface OrderItemDTO {
  id: string
  service_id: string | null
  service_name: string
  pricing_unit: 'PER_KG' | 'PER_PIECE'
  unit_price_cents: number
  quantity: number
  line_total_cents: number
}

export interface OrderEventDTO {
  id: string
  from_status: OrderStatus | null
  to_status: OrderStatus
  note: string | null
  actor_name: string
  created_at: string
}

export interface OrdersListResult {
  orders: OrderListItem[]
  total: number
  page: number
  pageSize: number
}

export async function getOrders(options: {
  search?: string
  status?: string
  page?: number
}): Promise<OrdersListResult | null> {
  const { userId } = await auth()
  if (!userId) return null

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return null

  const supabase = await createClient()
  const page = options.page ?? 1
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('orders')
    .select(`
      id, order_number, tracking_code, status, source, total_cents, received_at, due_at, created_at,
      customer:customers!inner(id, full_name, phone)
    `, { count: 'exact' })

  // Filter by status
  if (options.status && options.status !== 'ALL') {
    query = query.eq('status', options.status)
  }

  // Search by order number or customer name.
  // Strip PostgREST `or`-filter syntax characters (`,`/`(`/`)`) so a search
  // term can never corrupt the filter expression into a query error (which
  // would surface as an "Access Denied" empty state for an authorized user).
  if (options.search?.trim()) {
    const term = options.search.trim().replace(/[,()]/g, '')
    if (term) {
      query = query.or(`order_number.ilike.%${term}%,tracking_code.ilike.%${term}%,customers.full_name.ilike.%${term}%`)
    }
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  const { data, count, error } = await query

  if (error || !data) return null

  const orders: OrderListItem[] = data.map(o => ({
    id: o.id,
    order_number: o.order_number,
    tracking_code: o.tracking_code,
    status: o.status as OrderStatus,
    source: o.source as 'WALK_IN' | 'PORTAL',
    total_cents: o.total_cents,
    received_at: o.received_at,
    due_at: o.due_at,
    created_at: o.created_at,
    customer: (Array.isArray(o.customer) ? o.customer[0] : o.customer) as OrderListItem['customer'],
  }))

  return {
    orders,
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  }
}

export async function getOrderById(orderId: string): Promise<OrderDetailDTO | null> {
  const { userId } = await auth()
  if (!userId) return null

  const actor = await getActorByClerkId(userId)
  if (!actor) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select(`
      id, order_number, tracking_code, status, source, total_cents, due_at, notes,
      received_at, paid_at, completed_at, cancelled_at, cancel_reason, created_at, updated_at,
      customer:customers!customer_id(id, full_name, phone, email),
      assigned_staff:users!assigned_to(id, full_name),
      created_by_user:users!created_by(id, full_name),
      items:order_items(id, service_id, service_name, pricing_unit, unit_price_cents, quantity, line_total_cents),
      events:order_status_events(id, from_status, to_status, note, actor_name, created_at)
    `)
    .eq('id', orderId)
    .order('created_at', { referencedTable: 'order_status_events', ascending: true })
    .single()

  if (!data) return null

  // Customer role: can only see own orders
  if (actor.role === 'CUSTOMER') {
    const customerRecord = await getCustomerByClerkId(userId)
    if (!customerRecord || customerRecord.id !== (data as unknown as OrderDetailDTO).customer?.id) return null
  } else if (!['ADMIN', 'STAFF'].includes(actor.role)) {
    return null
  }

  return data as unknown as OrderDetailDTO
}

/**
 * Get orders for a specific customer (portal view).
 */
export async function getCustomerOrders(options: {
  page?: number
}): Promise<OrdersListResult | null> {
  const { userId } = await auth()
  if (!userId) return null

  const actor = await getActorByClerkId(userId)
  if (!actor || actor.role !== 'CUSTOMER') return null

  const customerRecord = await getCustomerByClerkId(userId)
  if (!customerRecord) return null

  const supabase = await createClient()
  const page = options.page ?? 1
  const offset = (page - 1) * PAGE_SIZE

  const { data, count } = await supabase
    .from('orders')
    .select(`
      id, order_number, tracking_code, status, source, total_cents, received_at, due_at, created_at,
      customer:customers!inner(id, full_name, phone)
    `, { count: 'exact' })
    .eq('customer_id', customerRecord.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (!data) return null

  const orders: OrderListItem[] = data.map(o => ({
    id: o.id,
    order_number: o.order_number,
    tracking_code: o.tracking_code,
    status: o.status as OrderStatus,
    source: o.source as 'WALK_IN' | 'PORTAL',
    total_cents: o.total_cents,
    received_at: o.received_at,
    due_at: o.due_at,
    created_at: o.created_at,
    customer: (Array.isArray(o.customer) ? o.customer[0] : o.customer) as OrderListItem['customer'],
  }))

  return {
    orders,
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  }
}

/**
 * Get orders for a specific customer (staff view, admin/staff only).
 */
export async function getOrdersByCustomerForStaff(customerId: string) {
  const { userId } = await auth()
  if (!userId) return []

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select('id, order_number, status, total_cents, received_at, created_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(50)

  return data ?? []
}

/**
 * Get order by tracking code (public tracking — no PII, no staff info).
 * Returns customer-safe progress history (status + timestamp only).
 */
export async function getOrderByTrackingCode(trackingCode: string) {
  const supabase = await createClient()
  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, status, received_at, due_at, updated_at')
    .eq('tracking_code', trackingCode.trim())
    .single()

  if (!order) return null

  const { data: events } = await supabase
    .from('order_status_events')
    .select('to_status, created_at')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true })

  return {
    ...order,
    events: (events ?? []) as { to_status: OrderStatus; created_at: string }[],
  }
}

/**
 * Dashboard stats.
 */
export async function getDashboardStats() {
  const { userId } = await auth()
  if (!userId) return null

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return null

  const supabase = await createClient()

  // Get order counts by status
  const { data: statusCounts } = await supabase
    .from('orders')
    .select('status')

  const counts: Record<string, number> = {}
  statusCounts?.forEach((o: { status: string }) => {
    counts[o.status] = (counts[o.status] || 0) + 1
  })

  // Get recent orders with service summary + due info for operational overview
  const { data: recentOrders } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, total_cents, received_at, due_at, updated_at, created_at,
      customer:customers!customer_id(id, full_name),
      items:order_items(service_name, quantity)
    `)
    .order('created_at', { ascending: false })
    .limit(8)

  // Get today's revenue (completed orders)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { data: todayCompleted } = await supabase
    .from('orders')
    .select('total_cents')
    .eq('status', 'COMPLETED')
    .gte('completed_at', today.toISOString())

  const todayRevenue = todayCompleted?.reduce((sum: number, o: { total_cents: number }) => sum + o.total_cents, 0) ?? 0

  // Total customers
  const { count: customerCount } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .is('archived_at', null)

  return {
    statusCounts: counts,
    totalOrders: statusCounts?.length ?? 0,
    activeOrders: statusCounts?.filter((o: { status: string }) => !['COMPLETED', 'CANCELLED'].includes(o.status)).length ?? 0,
    todayRevenue,
    customerCount: customerCount ?? 0,
    recentOrders: recentOrders ?? [],
  }
}
