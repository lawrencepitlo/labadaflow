import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getActorByClerkId } from '@/lib/auth'
import { getCustomerByClerkId } from '@/lib/data/customers'
import { syncUser } from '@/lib/actions/team'
import { PortalShell } from './portal-shell'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await syncUser()

  const actor = await getActorByClerkId(userId)
  if (!actor) redirect('/sign-in')

  if (actor.role !== 'CUSTOMER') {
    redirect(actor.role === 'ADMIN' || actor.role === 'STAFF' ? '/dashboard' : '/sign-in')
  }

  const customer = await getCustomerByClerkId(userId)

  return <PortalShell customerName={customer?.full_name ?? actor.full_name}>{children}</PortalShell>
}
