import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getActorByClerkId } from '@/lib/auth'
import { syncUser } from '@/lib/actions/team'
import { BackofficeShell } from './backoffice-shell'

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  // Sync user to Supabase if not exists
  await syncUser()

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) {
    redirect('/portal')
  }

  return (
    <BackofficeShell actor={actor}>
      {children}
    </BackofficeShell>
  )
}
