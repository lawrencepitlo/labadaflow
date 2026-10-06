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
      <PageHeader title="New Order" description="Create a new laundry order" />
      <NewOrderForm customers={customers} services={services} />
    </>
  )
}
