import { PageHeader } from '@/components/app/page-header'
import { getCustomersForSelect } from '@/lib/data/customers'
import { getActiveServices } from '@/lib/data/services'
import { NewOrderForm } from './new-order-form'

export default async function NewOrderPage() {
  const [customers, services] = await Promise.all([
    getCustomersForSelect(),
    getActiveServices(),
  ])

  return (
    <>
      <PageHeader title="New Order" description="Walk-in intake — customer, items, and pickup estimate." />
      <NewOrderForm customers={customers} services={services} />
    </>
  )
}
