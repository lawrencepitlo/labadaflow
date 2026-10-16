/**
 * Data Access Layer — Reports (Admin and Staff)
 * Aggregations computed directly in PostgreSQL via RPC with Asia/Manila boundaries.
 */
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { getActorByClerkId } from '@/lib/auth'

export interface ReportData {
  ordersToday: number
  ordersThisWeek: number
  revenueToday: number
  revenueThisWeek: number
  revenueTotal: number
  ordersByService: { service_name: string; count: number; revenue_cents: number }[]
  statusBreakdown: Record<string, number>
  dailyTrend: {
    date: string
    day_name: string
    label: string
    revenue_cents: number
    completed_orders: number
    created_orders: number
  }[]
  paymentBreakdown: {
    method: string
    count: number
    total_cents: number
  }[]
}

export async function getReports(): Promise<ReportData | null> {
  const { userId } = await auth()
  if (!userId) return null

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return null

  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_reports_data')

  if (error || !data) {
    if (error) console.error('get_reports_data RPC error:', error)
    return null
  }

  const row = data as {
    orders_today: number
    orders_this_week: number
    revenue_today: number
    revenue_this_week: number
    revenue_total: number
    orders_by_service: { service_name: string; count: number; revenue_cents: number }[]
    status_breakdown: Record<string, number>
    daily_trend: {
      date: string
      day_name: string
      label: string
      revenue_cents: number
      completed_orders: number
      created_orders: number
    }[]
    payment_breakdown: {
      method: string
      count: number
      total_cents: number
    }[]
  }

  return {
    ordersToday: row.orders_today ?? 0,
    ordersThisWeek: row.orders_this_week ?? 0,
    revenueToday: row.revenue_today ?? 0,
    revenueThisWeek: row.revenue_this_week ?? 0,
    revenueTotal: row.revenue_total ?? 0,
    ordersByService: row.orders_by_service ?? [],
    statusBreakdown: row.status_breakdown ?? {},
    dailyTrend: row.daily_trend ?? [],
    paymentBreakdown: row.payment_breakdown ?? [],
  }
}
