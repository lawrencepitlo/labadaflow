import Link from 'next/link'
import { getActor } from '@/lib/auth'
import { getActiveServices } from '@/lib/data/services'
import { getOwnCustomerProfile } from '@/lib/data/customers'
import { PageHeader } from '@/components/app/page-header'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { PortalOrderForm } from './portal-order-form'

export default async function NewPortalOrderPage() {
  const [actor, profile, services] = await Promise.all([
    getActor(),
    getOwnCustomerProfile(),
    getActiveServices(),
  ])

  return (
    <>
      <div className="mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground"
          render={<Link href="/portal/orders" aria-label="Back to orders" />}
        >
          <ChevronLeft aria-hidden="true" />
          My Orders
        </Button>
      </div>

      <PageHeader
        title="Book Laundry Online"
        description="Select your garments, customize washing notes, and receive an instant QR Drop-off Pass."
      />

      <div className="mt-4">
        <PortalOrderForm
          services={services}
          customerPhone={profile?.phone}
          customerName={actor?.full_name}
          customerEmail={actor?.email}
        />
      </div>
    </>
  )
}
