/**
 * Data Access Layer — Orders
 * All order queries go through here with proper authorization.
 */
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { getActorByClerkId } from '@/lib/auth'
import { getCustomerByClerkId } from './customers'
import type { OrderStatus } from '@/lib/order-machine'
import type { Database } from '@/lib/supabase/database.types'

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
  payment_method: 'CASH' | 'GCASH' | 'OTHER' | null
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
    query = query.eq('status', options.status as Database['public']['Enums']['order_status'])
  }

  // Search by order number or customer name.
  // Strip PostgREST `or`-filter syntax characters (`,`/`(`/`)`) so a search
  // term can never corrupt the filter expression into a query error (which
  // would surface as an "Access Denied" empty state for an authorized user).
  // Search by order number, tracking code, or customer name
  if (options.search?.trim()) {
    const term = options.search.trim().replace(/[,()]/g, '')
    if (term) {
      // Find matching customer IDs first since PostgREST cannot use dotted paths in .or()
      const { data: matchedCustomers } = await supabase
        .from('customers')
        .select('id')
        .ilike('full_name', `%${term}%`)

      const custIds = (matchedCustomers ?? []).map(c => c.id)
      let orClause = `order_number.ilike.%${term}%,tracking_code.ilike.%${term}%`
      if (custIds.length > 0) {
        orClause += `,customer_id.in.(${custIds.join(',')})`
      }
      query = query.or(orClause)
    }
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  const { data, count, error } = await query

  if (error || !data) {
    if (error) console.error('getOrders query error:', error)
    return null
  }

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
      id, order_number, tracking_code, status, source, total_cents, due_at, notes, payment_method,
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

export type BoardOrder = OrderListItem

/**
 * Get active orders for the Kanban staff board.
 * Statuses: RECEIVED, WASHING, DRYING, FOLDING, READY.
 */
export async function getBoardOrders(): Promise<BoardOrder[]> {
  const { userId } = await auth()
  if (!userId) return []

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, tracking_code, status, source, total_cents, received_at, due_at, created_at,
      customer:customers!customer_id(id, full_name, phone)
    `)
    .in('status', ['RECEIVED', 'WASHING', 'DRYING', 'FOLDING', 'READY'])
    .order('due_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (error || !data) return []

  return data.map(o => ({
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
}

/**
 * Get order by tracking code (public tracking — no PII, no staff info).
 * Returns customer-safe progress history (status + timestamp only).
 */
export async function getOrderByTrackingCode(trackingCode: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_tracking', {
    p_code: trackingCode.trim(),
  })

  if (error || !data) return null

  const order = data as {
    order_number: string
    status: OrderStatus
    received_at: string
    due_at: string | null
    updated_at: string
    events: { to_status: OrderStatus; created_at: string }[]
  }

  return order
}

/**
 * Dashboard stats computed in SQL/RPC using Asia/Manila day boundaries.
 */
export async function getDashboardStats() {
  const { userId } = await auth()
  if (!userId) return null

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return null

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_dashboard_metrics')

  if (error || !data) {
    if (error) console.error('get_dashboard_metrics RPC error:', error)
    return null
  }

  const metrics = data as {
    overdue_count: number
    ready_count: number
    in_progress_count: number
    received_count: number
    today_orders_count: number
    today_revenue_cents: number
    total_orders: number
    active_orders: number
    customer_count: number
    status_counts: Record<string, number>
    recent_orders: Array<{
      id: string
      order_number: string
      status: string
      total_cents: number
      received_at: string
      due_at: string | null
      updated_at: string
      created_at: string
      customer: { id: string; full_name: string }
      items: Array<{ service_name: string; quantity: number }>
    }>
    daily_trend?: Array<{
      date: string
      day_name: string
      label: string
      revenue_cents: number
      completed_orders: number
      created_orders: number
    }>
  }

  return {
    statusCounts: metrics.status_counts ?? {},
    totalOrders: metrics.total_orders ?? 0,
    activeOrders: metrics.active_orders ?? 0,
    todayRevenue: metrics.today_revenue_cents ?? 0,
    todayOrders: metrics.today_orders_count ?? 0,
    overdueCount: metrics.overdue_count ?? 0,
    readyCount: metrics.ready_count ?? 0,
    inProgressCount: metrics.in_progress_count ?? 0,
    receivedCount: metrics.received_count ?? 0,
    customerCount: metrics.customer_count ?? 0,
    recentOrders: metrics.recent_orders ?? [],
    dailyTrend: metrics.daily_trend ?? [],
  }
}
