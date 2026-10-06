/**
 * Data Access Layer — Reports (Admin and Staff)
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
}

export async function getReports(): Promise<ReportData | null> {
  const { userId } = await auth()
  if (!userId) return null

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return null

  const supabase = await createClient()

  const now = new Date()
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0)
  const startOfWeek = new Date(startOfToday); startOfWeek.setDate(startOfWeek.getDate() - 6)

  const [{ data: createdOrders }, { data: completed }, { data: items }, { data: statuses }] =
    await Promise.all([
      supabase.from('orders').select('created_at'),
      supabase.from('orders').select('total_cents, completed_at').eq('status', 'COMPLETED'),
      supabase.from('order_items').select('service_name, quantity, line_total_cents'),
      supabase.from('orders').select('status'),
    ])

  const countSince = (rows: { created_at?: string }[] | null, since: Date) =>
    rows?.filter(r => r.created_at && new Date(r.created_at) >= since).length ?? 0

  type CompletedRow = { total_cents: number; completed_at: string | null }
  const revenueSince = (rows: CompletedRow[] | null, since: Date) =>
    rows?.filter(r => r.completed_at && new Date(r.completed_at) >= since)
      .reduce((s, r) => s + r.total_cents, 0) ?? 0

  type ItemRow = { service_name: string; quantity: number; line_total_cents: number }
  const byService = new Map<string, { count: number; revenue_cents: number }>()
  ;(items as ItemRow[] | null)?.forEach(i => {
    const entry = byService.get(i.service_name) ?? { count: 0, revenue_cents: 0 }
    entry.count += 1
    entry.revenue_cents += i.line_total_cents
    byService.set(i.service_name, entry)
  })

  const statusBreakdown: Record<string, number> = {}
  ;(statuses as { status: string }[] | null)?.forEach(s => {
    statusBreakdown[s.status] = (statusBreakdown[s.status] || 0) + 1
  })

  return {
    ordersToday: countSince(createdOrders, startOfToday),
    ordersThisWeek: countSince(createdOrders, startOfWeek),
    revenueToday: revenueSince(completed, startOfToday),
    revenueThisWeek: revenueSince(completed, startOfWeek),
    revenueTotal: (completed as CompletedRow[] | null)?.reduce((s, r) => s + r.total_cents, 0) ?? 0,
    ordersByService: Array.from(byService.entries())
      .map(([service_name, v]) => ({ service_name, ...v }))
      .sort((a, b) => b.revenue_cents - a.revenue_cents),
    statusBreakdown,
  }
}
