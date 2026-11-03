import { PageHeader } from '@/components/app/page-header'
import { getCustomersForSelect } from '@/lib/data/customers'
import { getActiveServices } from '@/lib/data/services'
import { getDefaultDueWindowDays } from '@/lib/settings'
import { NewOrderForm } from './new-order-form'

export default async function NewOrderPage() {
  const [customers, services] = await Promise.all([
    getCustomersForSelect(),
    getActiveServices(),
  ])
  const defaultDueDays = getDefaultDueWindowDays()

  return (
    <>
      <PageHeader title="New Walk-in Order" description="Counter walk-in intake — customer, weighed laundry items, and estimated pickup." />
      <NewOrderForm
        customers={customers}
        services={services}
        defaultDueDays={defaultDueDays}
      />
    </>
  )
}
