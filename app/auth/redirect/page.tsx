import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getActor, fetchActorDirect } from '@/lib/auth'
import { syncUser } from '@/lib/actions/team'

export const dynamic = 'force-dynamic'

export default async function AuthRedirectPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  let actor = await getActor()
  if (!actor) {
    try {
      await syncUser()
      actor = await fetchActorDirect(userId)
    } catch (err) {
      console.error('Error during auth redirect sync:', err)
    }
  }

  // Backoffice roles go to dashboard
  if (actor && (actor.role === 'ADMIN' || actor.role === 'STAFF')) {
    redirect('/dashboard')
  }

  // Customer or newly created users go directly to customer portal orders
  redirect('/portal/orders')
}
