'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActorByClerkId } from '@/lib/auth'

export async function updateUserRole(targetUserId: string, newRole: 'ADMIN' | 'STAFF' | 'CUSTOMER') {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  const actor = await getActorByClerkId(userId)
  if (!actor || actor.role !== 'ADMIN') return { error: 'Forbidden — Admin only' }

  const supabase = await createClient()

  // Get target user
  const { data: targetUser } = await supabase
    .from('users')
    .select('id, clerk_user_id, role')
    .eq('id', targetUserId)
    .single()

  if (!targetUser) return { error: 'User not found' }

  // Prevent admin from changing their own role
  if (targetUser.clerk_user_id === userId) {
    return { error: 'Cannot change your own role' }
  }

  // Update Supabase first
  const { error: dbError } = await supabase
    .from('users')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', targetUserId)

  if (dbError) return { error: dbError.message }

  // Update Clerk publicMetadata
  try {
    const clerk = await clerkClient()
    await clerk.users.updateUserMetadata(targetUser.clerk_user_id, {
      publicMetadata: { role: newRole },
    })
  } catch {
    // Rollback Supabase if Clerk fails
    await supabase
      .from('users')
      .update({ role: targetUser.role, updated_at: new Date().toISOString() })
      .eq('id', targetUserId)
    return { error: 'Failed to sync role with authentication provider' }
  }

  revalidatePath('/team')
  return { success: true }
}

export async function toggleUserActive(targetUserId: string, isActive: boolean) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  const actor = await getActorByClerkId(userId)
  if (!actor || actor.role !== 'ADMIN') return { error: 'Forbidden — Admin only' }

  const supabase = await createClient()

  // Get target user
  const { data: targetUser } = await supabase
    .from('users')
    .select('id, clerk_user_id')
    .eq('id', targetUserId)
    .single()

  if (!targetUser) return { error: 'User not found' }

  // Prevent self-deactivation
  if (targetUser.clerk_user_id === userId) {
    return { error: 'Cannot deactivate your own account' }
  }

  const { error } = await supabase
    .from('users')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', targetUserId)

  if (error) return { error: error.message }

  revalidatePath('/team')
  return { success: true }
}

/**
 * Sync a Clerk user to Supabase users table.
 * Called when a user first accesses the app after login.
 */
export async function syncUser() {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  const supabase = await createClient()

  // Check if user already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id, role')
    .eq('clerk_user_id', userId)
    .single()

  if (existing) return { success: true, role: existing.role }

  // Get user info from Clerk
  try {
    const clerk = await clerkClient()
    const clerkUser = await clerk.users.getUser(userId)
    const role = (clerkUser.publicMetadata?.role as string) || 'CUSTOMER'
    const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.emailAddresses?.[0]?.emailAddress || 'Unknown'
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || ''

    const { data, error } = await supabase
      .from('users')
      .insert({
        clerk_user_id: userId,
        role,
        full_name: fullName,
        email,
      })
      .select('id, role')
      .single()

    if (error) {
      // Handle race condition — user might have been created by another request
      if (error.code === '23505') {
        const { data: retry } = await supabase
          .from('users')
          .select('id, role')
          .eq('clerk_user_id', userId)
          .single()
        return { success: true, role: retry?.role }
      }
      return { error: error.message }
    }

    return { success: true, role: data.role }
  } catch {
    return { error: 'Failed to sync user' }
  } finally {
    // Link customer record by email on first login (non-blocking)
    try {
      const clerk = await clerkClient()
      const clerkUser = await clerk.users.getUser(userId)
      const email = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase()
      if (email) {
        const supabase2 = await createClient()
        const { data: matches } = await supabase2
          .from('customers')
          .select('id, clerk_user_id')
          .ilike('email', email)
          .is('clerk_user_id', null)
        if (matches && matches.length > 0) {
          await supabase2
            .from('customers')
            .update({ clerk_user_id: userId, updated_at: new Date().toISOString() })
            .eq('id', matches[0].id)
        }
      }
    } catch {
      // Linking is best-effort; do not block access
    }
  }
}
