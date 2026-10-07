import { getOwnCustomerProfile } from '@/lib/data/customers'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileForm } from './profile-form'

export default async function PortalProfilePage() {
  const profile = await getOwnCustomerProfile()

  if (!profile) {
    return (
      <EmptyState
        title="No customer record linked"
        description="Your account is not linked to a customer record yet. Please contact the shop."
      />
    )
  }

  return (
    <>
      <PageHeader title="Profile" description="Your contact information for pickups and order updates" />
      <Card className="max-w-2xl gap-0 py-0">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-[13px]">Edit Profile</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>
    </>
  )
}
