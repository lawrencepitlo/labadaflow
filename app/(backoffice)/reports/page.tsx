import { getReports } from '@/lib/data/reports'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { StatusBadge } from '@/components/app/status-badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatMoney } from '@/lib/money'
import { CalendarDays, DollarSign, ShoppingCart, TrendingUp, Wallet } from 'lucide-react'
import { ORDER_STATUS_FLOW, type OrderStatus } from '@/lib/order-machine'

export default async function ReportsPage() {
  const report = await getReports()

  if (!report) {
    return <EmptyState title="Access Denied" description="You do not have permission to view reports." />
  }

  const cards = [
    { title: 'Orders today', value: report.ordersToday.toString(), hint: 'created today', icon: ShoppingCart },
    { title: 'Orders this week', value: report.ordersThisWeek.toString(), hint: 'last 7 days', icon: CalendarDays },
    { title: 'Revenue today', value: formatMoney(report.revenueToday), hint: 'completed today', icon: DollarSign },
    { title: 'Revenue this week', value: formatMoney(report.revenueThisWeek), hint: 'last 7 days', icon: TrendingUp },
    { title: 'Total revenue', value: formatMoney(report.revenueTotal), hint: 'all completed orders', icon: Wallet },
  ]

  const orderedStatuses = [
    ...ORDER_STATUS_FLOW.filter(s => report.statusBreakdown[s] != null),
    ...Object.keys(report.statusBreakdown).filter(s => !(ORDER_STATUS_FLOW as string[]).includes(s)),
  ]

  return (
    <>
      <PageHeader title="Reports" description="Today, this week, and lifetime shop performance" />

      <section aria-label="Report metrics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {cards.map(c => (
          <Card key={c.title} className="gap-0 py-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <c.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </span>
                <p className="truncate text-xs font-medium text-muted-foreground">{c.title}</p>
              </div>
              <p className="mt-3 truncate text-2xl font-semibold tracking-tight tabular-nums sm:text-[1.75rem]">
                {c.value}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{c.hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="gap-0 py-0">
          <CardHeader className="px-4 py-3 sm:px-6">
            <CardTitle className="text-sm">Revenue by Service</CardTitle>
            <CardDescription>Ranked by lifetime revenue</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            {report.ordersByService.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No service data yet — it appears after the first completed items.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <Table aria-label="Revenue by service">
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Service</TableHead>
                      <TableHead className="text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Items sold</TableHead>
                      <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.ordersByService.map(s => (
                      <TableRow key={s.service_name} className="hover:bg-muted/40">
                        <TableCell className="text-sm font-medium">{s.service_name}</TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground tabular-nums">{s.count}</TableCell>
                        <TableCell className="text-right text-sm font-semibold tabular-nums">{formatMoney(s.revenue_cents)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardHeader className="px-4 py-3 sm:px-6">
            <CardTitle className="text-sm">Orders by Status</CardTitle>
            <CardDescription>Where every order sits in the workflow</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            {orderedStatuses.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <Table aria-label="Orders by status">
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</TableHead>
                      <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderedStatuses.map(status => (
                      <TableRow key={status} className="hover:bg-muted/40">
                        <TableCell>
                          {['RECEIVED','WASHING','DRYING','FOLDING','READY','COMPLETED','CANCELLED'].includes(status) ? (
                            <StatusBadge status={status as OrderStatus} size="sm" />
                          ) : (
                            <span className="text-sm font-medium">{status}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular-nums">
                            {report.statusBreakdown[status]}
                          </span>
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
