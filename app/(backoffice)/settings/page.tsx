import { getActor } from '@/lib/auth'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
      <PageHeader title="Settings" description="Environment-driven configuration — no database changes needed" />
      <Card className="max-w-2xl gap-0 py-0">
        <CardHeader className="px-4 py-3 sm:px-6">
          <CardTitle className="text-sm">Configuration</CardTitle>
          <CardDescription>Read from server environment at runtime</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <dl className="divide-y divide-border">
            {settings.map(s => (
              <div key={s.label} className="flex items-center justify-between gap-4 py-3">
                <dt className="text-sm text-muted-foreground">{s.label}</dt>
                <dd className="text-sm font-medium tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
          <p className="border-t border-border pt-3 text-xs text-muted-foreground">
            Settings are configured via environment variables. Update <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">.env.local</code> and restart the dev server to change them.
          </p>
        </CardContent>
      </Card>
    </>
  )
}
