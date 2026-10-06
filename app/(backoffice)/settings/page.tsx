import { getActor } from '@/lib/auth'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getShopName, getDefaultDueWindowDays, getPageSize } from '@/lib/settings'

export default async function SettingsPage() {
  const actor = await getActor()

  if (!actor || actor.role !== 'ADMIN') {
    return <EmptyState title="Access Denied" description="Only admins can view settings." />
  }

  const settings = [
    { label: 'Shop name', value: getShopName() },
    { label: 'Default due window (days)', value: String(getDefaultDueWindowDays()) },
    { label: 'Pagination size', value: String(getPageSize()) },
  ]

  return (
    <>
      <PageHeader title="Settings" description="System configuration (environment-driven)" />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {settings.map(s => (
            <div key={s.label} className="flex justify-between border-b pb-2 text-sm">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="font-medium">{s.value}</span>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-2">
            Settings are configured via environment variables. Update <code>.env.local</code> and restart the dev server to change them.
          </p>
        </CardContent>
      </Card>
    </>
  )
}
