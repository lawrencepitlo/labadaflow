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
  if (!userId) redirect('/login')

  await syncUser()

  const actor = await getActorByClerkId(userId)
  if (!actor) redirect('/login')

  if (actor.role !== 'CUSTOMER') {
    redirect(actor.role === 'ADMIN' || actor.role === 'STAFF' ? '/dashboard' : '/login')
  }

  const customer = await getCustomerByClerkId(userId)

  return <PortalShell customerName={customer?.full_name ?? actor.full_name}>{children}</PortalShell>
}
