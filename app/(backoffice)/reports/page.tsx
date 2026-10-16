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
import { ReportsCharts } from '@/components/app/reports-charts'

export default async function ReportsPage() {
  const report = await getReports()

  if (!report) {
    return (
      <EmptyState
        title="Unable to load reports"
        description="We encountered an issue computing business reports. Please refresh the page."
      />
    )
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

      {/* Summary — clean SaaS KPI grid */}
      <section aria-label="Report summary" className="mt-6">
        <div className="tnum grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-5">
          {metrics.map(c => (
            <div
              key={c.title}
              className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-border"
            >
              <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{c.title}</p>
              <p className="mt-2 truncate text-2xl font-bold tracking-tight text-foreground">{c.value}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{c.hint}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Visual Analytics & Breakdown */}
      <div className="mt-6">
        <ReportsCharts
          dailyTrend={report.dailyTrend}
          paymentBreakdown={report.paymentBreakdown}
          servicesBreakdown={report.ordersByService}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {/* Primary — where every order sits */}
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
          <div className="mb-4 flex items-baseline justify-between gap-2 border-b pb-3">
            <div>
              <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Orders by Stage</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Distribution across current active and historical stages</p>
            </div>
            <span className="tnum font-mono text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md">{totalOrders.toLocaleString()} total</span>
          </div>
          <div>
            {orderedStatuses.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No orders recorded yet.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border/70">
                <Table aria-label="Orders by status">
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-10 pl-4 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Station / Status</TableHead>
                      <TableHead className="h-10 pr-4 text-right text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Orders Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderedStatuses.map(status => (
                      <TableRow key={status} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="pl-4 py-3">
                          {['RECEIVED','WASHING','DRYING','FOLDING','READY','COMPLETED','CANCELLED'].includes(status) ? (
                            <StatusBadge status={status as OrderStatus} size="sm" />
                          ) : (
                            <span className="text-xs font-semibold">{status}</span>
                          )}
                        </TableCell>
                        <TableCell className="tnum pr-4 text-right text-xs font-bold text-foreground py-3">
                          {(report.statusBreakdown[status] ?? 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        {/* Secondary — revenue ranked by service */}
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
          <div className="mb-4 flex items-baseline justify-between gap-2 border-b pb-3">
            <div>
              <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Revenue by Service</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">All-time volume and revenue generated per service catalog item</p>
            </div>
            <span className="tnum font-mono text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md">
              {report.ordersByService.length === 1 ? '1 service' : `${report.ordersByService.length} services`}
            </span>
          </div>
          <div>
            {report.ordersByService.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No service data yet — it appears after the first completed items.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/70">
                <Table aria-label="Revenue by service" className="min-w-[22rem]">
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-10 pl-4 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Service</TableHead>
                      <TableHead className="h-10 text-center text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Items Processed</TableHead>
                      <TableHead className="h-10 pr-4 text-right text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.ordersByService.map(s => (
                      <TableRow key={s.service_name} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="max-w-[14rem] truncate pl-4 text-xs font-semibold text-foreground py-3">{s.service_name}</TableCell>
                        <TableCell className="tnum text-center text-xs text-muted-foreground py-3">{s.count.toLocaleString()}</TableCell>
                        <TableCell className="tnum pr-4 text-right text-xs font-bold text-foreground py-3">{formatMoney(s.revenue_cents)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
