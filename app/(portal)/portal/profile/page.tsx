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
      <PageHeader title="Profile" description="Your contact information" />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>
    </>
  )
}
