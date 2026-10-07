import { getReports } from '@/lib/data/reports'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { StatusBadge } from '@/components/app/status-badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
    { title: 'Orders today', value: report.ordersToday.toString(), hint: 'created today' },
    { title: 'Orders this week', value: report.ordersThisWeek.toString(), hint: 'last 7 days' },
    { title: 'Revenue today', value: formatMoney(report.revenueToday), hint: 'completed today' },
    { title: 'Revenue this week', value: formatMoney(report.revenueThisWeek), hint: 'last 7 days' },
    { title: 'Total revenue', value: formatMoney(report.revenueTotal), hint: 'all completed orders' },
  ]

  const orderedStatuses = [
    ...ORDER_STATUS_FLOW.filter(s => report.statusBreakdown[s] != null),
    ...Object.keys(report.statusBreakdown).filter(s => !(ORDER_STATUS_FLOW as string[]).includes(s)),
  ]

  return (
    <>
      <PageHeader title="Reports" description="Today, this week, and lifetime shop performance" />

      <section aria-label="Report metrics">
        <div className="tnum grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3 xl:grid-cols-5">
          {metrics.map(c => (
            <div key={c.title} className="bg-card p-4">
              <p className="truncate text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{c.title}</p>
              <p className="mt-1 truncate text-xl font-semibold tracking-tight">{c.value}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <Card className="gap-0 py-0">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-[13px]">Revenue by Service</CardTitle>
            <CardDescription>Ranked by lifetime revenue</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {report.ordersByService.length === 0 ? (
              <p className="py-3 text-center text-[13px] text-muted-foreground">No service data yet — it appears after the first completed items.</p>
            ) : (
              <div className="overflow-hidden rounded-md border">
                <Table aria-label="Revenue by service">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-9 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Service</TableHead>
                      <TableHead className="h-9 text-center text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Items sold</TableHead>
                      <TableHead className="h-9 text-right text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.ordersByService.map(s => (
                      <TableRow key={s.service_name} className="hover:bg-muted/40">
                        <TableCell className="text-[13px] font-medium">{s.service_name}</TableCell>
                        <TableCell className="tnum text-center text-[13px] text-muted-foreground">{s.count}</TableCell>
                        <TableCell className="tnum text-right text-[13px] font-semibold">{formatMoney(s.revenue_cents)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-[13px]">Orders by Status</CardTitle>
            <CardDescription>Where every order sits in the workflow</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {orderedStatuses.length === 0 ? (
              <p className="py-3 text-center text-[13px] text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="overflow-hidden rounded-md border">
                <Table aria-label="Orders by status">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-9 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Status</TableHead>
                      <TableHead className="h-9 text-right text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderedStatuses.map(status => (
                      <TableRow key={status} className="hover:bg-muted/40">
                        <TableCell>
                          {['RECEIVED','WASHING','DRYING','FOLDING','READY','COMPLETED','CANCELLED'].includes(status) ? (
                            <StatusBadge status={status as OrderStatus} size="sm" />
                          ) : (
                            <span className="text-[13px] font-medium">{status}</span>
                          )}
                        </TableCell>
                        <TableCell className="tnum text-right text-[13px] font-medium">
                          {report.statusBreakdown[status]}
                        </TableCell>
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
