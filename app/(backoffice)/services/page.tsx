import { getServices } from '@/lib/data/services'
import { getActor } from '@/lib/auth'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { ServicesManager } from './services-manager'

export default async function ServicesPage() {
  const [services, actor] = await Promise.all([getServices(), getActor()])

  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) {
    return <EmptyState title="Access Denied" description="You do not have permission to view services." />
  }

  return (
    <>
      <PageHeader title="Services" description={actor.role === 'ADMIN' ? 'Manage your service catalog' : 'Available services'} />
      <ServicesManager services={services} canEdit={actor.role === 'ADMIN'} />
    </>
  )
}
