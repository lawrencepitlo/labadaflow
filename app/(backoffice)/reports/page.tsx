import { getReports } from '@/lib/data/reports'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { StatusBadge } from '@/components/app/status-badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatMoney } from '@/lib/money'
import { ORDER_STATUS_FLOW, type OrderStatus } from '@/lib/order-machine'

export default async function ReportsPage() {
  const report = await getReports()

  if (!report) {
    return <EmptyState title="Access Denied" description="You do not have permission to view reports." />
  }

  const metrics = [
    { title: 'Orders today', value: report.ordersToday.toLocaleString(), hint: 'Created today' },
    { title: 'Orders this week', value: report.ordersThisWeek.toLocaleString(), hint: 'Created last 7 days' },
    { title: 'Revenue today', value: formatMoney(report.revenueToday), hint: 'Completed today' },
    { title: 'Revenue this week', value: formatMoney(report.revenueThisWeek), hint: 'Completed last 7 days' },
    { title: 'Total revenue', value: formatMoney(report.revenueTotal), hint: 'All completed orders' },
  ]

  const orderedStatuses = [
    ...ORDER_STATUS_FLOW.filter(s => report.statusBreakdown[s] != null),
    ...Object.keys(report.statusBreakdown).filter(s => !(ORDER_STATUS_FLOW as string[]).includes(s)),
  ]
  const totalOrders = orderedStatuses.reduce((sum, s) => sum + (report.statusBreakdown[s] ?? 0), 0)

  return (
    <>
      <PageHeader title="Reports" description="Today, this week, and lifetime shop performance" />

      {/* Fixed reporting windows — mirrors the backend semantics, presentation only */}
      <p className="mb-3 text-xs text-muted-foreground">
        Today starts at local midnight · Week covers the last 7 days · Revenue counts completed orders only.
      </p>

      {/* Summary — one quiet strip, no KPI cards */}
      <section aria-label="Report summary">
        <div className="tnum grid grid-cols-2 overflow-hidden rounded-lg border bg-card sm:grid-cols-3 xl:grid-cols-5">
          {metrics.map(c => (
            <div
              key={c.title}
              className="p-4 odd:border-r sm:odd:border-r-0 sm:[&:not(:first-child)]:border-l sm:[&:nth-child(n+4)]:border-t xl:[&:nth-child(n+4)]:border-t-0 [&:nth-child(n+3)]:border-t sm:[&:nth-child(n+3)]:border-t-0 [&:nth-child(2n)]:border-r-0 sm:[&:nth-child(2n)]:border-r-0"
            >
              <p className="truncate text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{c.title}</p>
              <p className="mt-1 truncate text-xl font-semibold tracking-tight">{c.value}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {/* Primary — where every order sits */}
        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="px-4 py-3">
            <div>
              <CardTitle className="text-[13px]">Orders by status</CardTitle>
              <CardDescription>Where every order sits in the workflow</CardDescription>
            </div>
            <CardAction>
              <span className="tnum text-xs text-muted-foreground">{totalOrders.toLocaleString()} total</span>
            </CardAction>
          </CardHeader>
          <CardContent className="p-0">
            {orderedStatuses.length === 0 ? (
              <p className="border-t px-4 py-4 text-center text-[13px] text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="border-t">
                <Table aria-label="Orders by status">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-9 pl-4 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Status</TableHead>
                      <TableHead className="h-9 pr-4 text-right text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderedStatuses.map(status => (
                      <TableRow key={status} className="hover:bg-muted/40">
                        <TableCell className="pl-4">
                          {['RECEIVED','WASHING','DRYING','FOLDING','READY','COMPLETED','CANCELLED'].includes(status) ? (
                            <StatusBadge status={status as OrderStatus} size="sm" />
                          ) : (
                            <span className="text-[13px] font-medium">{status}</span>
                          )}
                        </TableCell>
                        <TableCell className="tnum pr-4 text-right text-[13px] font-medium">
                          {(report.statusBreakdown[status] ?? 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Secondary — revenue ranked by service */}
        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="px-4 py-3">
            <div>
              <CardTitle className="text-[13px]">Revenue by service</CardTitle>
              <CardDescription>Ranked by lifetime revenue</CardDescription>
            </div>
            <CardAction>
              <span className="tnum text-xs text-muted-foreground">
                {report.ordersByService.length === 1 ? '1 service' : `${report.ordersByService.length} services`}
              </span>
            </CardAction>
          </CardHeader>
          <CardContent className="p-0">
            {report.ordersByService.length === 0 ? (
              <p className="border-t px-4 py-4 text-center text-[13px] text-muted-foreground">No service data yet — it appears after the first completed items.</p>
            ) : (
              <div className="overflow-x-auto border-t">
                <Table aria-label="Revenue by service" className="min-w-[22rem]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-9 pl-4 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Service</TableHead>
                      <TableHead className="h-9 text-center text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Items sold</TableHead>
                      <TableHead className="h-9 pr-4 text-right text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.ordersByService.map(s => (
                      <TableRow key={s.service_name} className="hover:bg-muted/40">
                        <TableCell className="max-w-[12rem] truncate pl-4 text-[13px] font-medium">{s.service_name}</TableCell>
                        <TableCell className="tnum text-center text-[13px] text-muted-foreground">{s.count.toLocaleString()}</TableCell>
                        <TableCell className="tnum pr-4 text-right text-[13px] font-semibold">{formatMoney(s.revenue_cents)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
