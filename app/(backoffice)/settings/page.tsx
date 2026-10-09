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

  return (
    <>
      <PageHeader
        title="Settings"
        description="Workspace configuration — read-only, set via environment"
      >
        <span className="inline-flex h-6 items-center rounded-md border bg-muted/40 px-2 text-[11px] font-medium text-muted-foreground">
          Read-only
        </span>
      </PageHeader>

      <div className="max-w-2xl space-y-4">
        <Card className="gap-0 py-0">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-[13px]">Shop</CardTitle>
            <CardDescription>Identity shown across the workspace</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <dl className="tnum divide-y divide-border text-[13px]">
              <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                <dt className="text-xs text-muted-foreground">Shop name</dt>
                <dd className="truncate font-medium">{getShopName()}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-[13px]">Operations</CardTitle>
            <CardDescription>Defaults applied when creating orders and lists</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <dl className="tnum divide-y divide-border text-[13px]">
              <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0">
                <dt className="text-xs text-muted-foreground">Default due window</dt>
                <dd className="font-medium">{getDefaultDueWindowDays()} days</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5 last:pb-0">
                <dt className="text-xs text-muted-foreground">Pagination size</dt>
                <dd className="font-medium">{getPageSize()} per page</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <p className="rounded-lg border bg-muted/30 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          These values come from the server environment. To change them, update{' '}
          <code className="rounded border bg-muted/40 px-1 py-0.5 font-mono text-[11px]">.env.local</code>{' '}
          and restart the server — no database changes needed.
        </p>
      </div>
    </>
  )
}
