import { getActor } from '@/lib/auth'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { getShopName, getDefaultDueWindowDays, getPageSize } from '@/lib/settings'

export default async function SettingsPage() {
  const actor = await getActor()

  if (!actor || actor.role !== 'ADMIN') {
    return <EmptyState title="Access Denied" description="Only administrators can view and modify system configuration." />
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Shop and operations configuration parameters"
      >
        <span className="inline-flex h-6 items-center rounded-md border border-border bg-muted/60 px-2.5 text-xs font-mono font-medium text-muted-foreground">
          Env Configured
        </span>
      </PageHeader>

      <div className="mt-6 max-w-2xl space-y-6">
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
          <div className="border-b pb-3 mb-4">
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Shop Identity</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Brand information shown across slips and customer tracking</p>
          </div>
          <dl className="tnum divide-y divide-border/60 text-xs">
            <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
              <dt className="text-muted-foreground">Shop Business Name</dt>
              <dd className="font-semibold text-foreground">{getShopName()}</dd>
            </div>
          </dl>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
          <div className="border-b pb-3 mb-4">
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Operational Defaults</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Default rules applied during order intake and listing pagination</p>
          </div>
          <dl className="tnum divide-y divide-border/60 text-xs">
            <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0">
              <dt className="text-muted-foreground">Default Target Due Window</dt>
              <dd className="font-semibold text-foreground">{getDefaultDueWindowDays()} days from intake</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5 last:pb-0">
              <dt className="text-muted-foreground">Orders & Customers Page Size</dt>
              <dd className="font-semibold text-foreground">{getPageSize()} records per page</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 sm:p-5 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground block mb-1">Configuration Note:</span>
          These operational parameters are defined in environment variables. To update these values, adjust{' '}
          <code className="rounded border bg-muted/50 px-1.5 py-0.5 font-mono text-[11px] text-foreground">NEXT_PUBLIC_SHOP_NAME</code>,{' '}
          <code className="rounded border bg-muted/50 px-1.5 py-0.5 font-mono text-[11px] text-foreground">DEFAULT_DUE_WINDOW_DAYS</code>, or{' '}
          <code className="rounded border bg-muted/50 px-1.5 py-0.5 font-mono text-[11px] text-foreground">PAGE_SIZE</code>{' '}
          in your environment settings.
        </div>
      </div>
    </>
  )
}
