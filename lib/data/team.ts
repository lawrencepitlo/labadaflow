/**
 * Data Access Layer — Team (Users)
 * Admin-only team management queries.
 */
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { getActorByClerkId } from '@/lib/auth'

export interface TeamMember {
  id: string
  clerk_user_id: string
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER'
  full_name: string
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Get all team members (admin only).
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  const { userId } = await auth()
  if (!userId) return []

  const actor = await getActorByClerkId(userId)
  if (!actor || actor.role !== 'ADMIN') return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('id, clerk_user_id, role, full_name, email, is_active, created_at, updated_at')
    .order('created_at', { ascending: false })

  return (data ?? []) as TeamMember[]
}

/**
 * Get staff members for assignment dropdowns.
 */
export async function getStaffForAssignment(): Promise<{ id: string; full_name: string }[]> {
  const { userId } = await auth()
  if (!userId) return []

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('id, full_name')
    .in('role', ['ADMIN', 'STAFF'])
    .eq('is_active', true)
    .order('full_name')

  return data ?? []
}
