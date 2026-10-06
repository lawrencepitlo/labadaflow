/**
 * Auth utilities — resolves Clerk session to application actor.
 * This is the bridge between Clerk identity and Supabase application data.
 */
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER'

export interface Actor {
  id: string
  clerk_user_id: string
  role: UserRole
  full_name: string
  email: string
  is_active: boolean
}

/**
 * Get the current authenticated actor from Clerk session + Supabase users table.
 * Returns null if unauthenticated or user not found/inactive.
 */
export async function getActor(): Promise<Actor | null> {
  const { userId } = await auth()
  if (!userId) return null

  return getActorByClerkId(userId)
}

/**
 * Get actor by Clerk user ID.
 */
export async function getActorByClerkId(clerkUserId: string): Promise<Actor | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('id, clerk_user_id, role, full_name, email, is_active')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (!data || !data.is_active) return null
  return data as Actor
}

/**
 * Require authentication — throws if no session.
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error('UNAUTHENTICATED')
  return userId
}

/**
 * Require a specific role — returns the actor or throws.
 */
export async function requireRole(...roles: UserRole[]): Promise<Actor> {
  const actor = await getActor()
  if (!actor) throw new Error('FORBIDDEN')
  if (!roles.includes(actor.role)) throw new Error('FORBIDDEN')
  return actor
}

/**
 * Check if actor has one of the given roles.
 */
export function hasRole(actor: Actor, ...roles: UserRole[]): boolean {
  return roles.includes(actor.role)
}
