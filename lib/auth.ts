/**
 * Auth utilities — resolves Clerk session to application actor.
 * This is the bridge between Clerk identity and Supabase application data.
 */
import { cache } from 'react'
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
 * Direct unmemoized query for actor, used when syncUser has just mutated the row
 * within the same server request.
 */
export async function fetchActorDirect(clerkUserId: string): Promise<Actor | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('id, clerk_user_id, role, full_name, email, is_active')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()

  if (!data || !data.is_active) return null
  return data as Actor
}

/**
 * Get actor by Clerk user ID, wrapped in React cache() so it runs once per request.
 */
export const getActorByClerkId = cache(async (clerkUserId: string): Promise<Actor | null> => {
  return fetchActorDirect(clerkUserId)
})

/**
 * Get the current authenticated actor from Clerk session + Supabase users table.
 * Returns null if unauthenticated or user not found/inactive.
 * Wrapped in React cache() so it deduplicates within a single server request.
 */
export const getActor = cache(async (): Promise<Actor | null> => {
  const { userId } = await auth()
  if (!userId) return null

  return getActorByClerkId(userId)
})

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
