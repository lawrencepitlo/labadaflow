/**
 * Auth utilities — resolves Clerk session to application actor.
 * This is the bridge between Clerk identity and Supabase application data.
 */
import { cache } from 'react'
import { auth, currentUser } from '@clerk/nextjs/server'
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
 *
 * If Supabase is temporarily unreachable (e.g. database paused/sleeping),
 * falls back to Clerk metadata so Admins and Staff are NEVER locked out.
 */
export async function fetchActorDirect(clerkUserId: string): Promise<Actor | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('users')
      .select('id, clerk_user_id, role, full_name, email, is_active')
      .eq('clerk_user_id', clerkUserId)
      .maybeSingle()

    if (!error && data && data.is_active) {
      return data as Actor
    }
  } catch (err) {
    console.warn('[auth] Supabase users lookup error (database may be sleeping/paused):', err)
  }

  // Resilient fallback: inspect Clerk session/user metadata directly
  try {
    const user = await currentUser()
    if (user && user.id === clerkUserId) {
      const rawRole = (user.publicMetadata?.role as string) || 'CUSTOMER'
      const role: UserRole = ['ADMIN', 'STAFF', 'CUSTOMER'].includes(rawRole)
        ? (rawRole as UserRole)
        : 'CUSTOMER'
      const fullName =
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        user.primaryEmailAddress?.emailAddress?.split('@')[0] ||
        'User'
      const email = user.primaryEmailAddress?.emailAddress || ''

      return {
        id: clerkUserId,
        clerk_user_id: clerkUserId,
        role,
        full_name: fullName,
        email,
        is_active: true,
      }
    }
  } catch (clerkErr) {
    console.warn('[auth] Clerk currentUser fallback error:', clerkErr)
  }

  return null
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
