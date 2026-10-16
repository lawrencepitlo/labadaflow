import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getActor, fetchActorDirect } from '@/lib/auth'
import { syncUser } from '@/lib/actions/team'
import { BackofficeShell } from './backoffice-shell'

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Only run syncUser when the users row is missing
  let actor = await getActor()
  if (!actor) {
    await syncUser()
    actor = await fetchActorDirect(userId)
  }

  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) {
    redirect('/portal')
  }

  return (
    <BackofficeShell actor={actor}>
      {children}
    </BackofficeShell>
  )
}
