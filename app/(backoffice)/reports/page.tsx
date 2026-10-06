import { getReports } from '@/lib/data/reports'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatMoney } from '@/lib/money'
import { CalendarDays, DollarSign, ShoppingCart, TrendingUp, BarChart3 } from 'lucide-react'

export default async function ReportsPage() {
  const report = await getReports()

  if (!report) {
    return <EmptyState title="Access Denied" description="You do not have permission to view reports." />
  }

  const cards = [
    { title: 'Orders today', value: report.ordersToday.toString(), icon: ShoppingCart, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
    { title: 'Orders this week', value: report.ordersThisWeek.toString(), icon: CalendarDays, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/40' },
    { title: 'Revenue today', value: formatMoney(report.revenueToday), icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { title: 'Revenue this week', value: formatMoney(report.revenueThisWeek), icon: TrendingUp, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
    { title: 'Total revenue', value: formatMoney(report.revenueTotal), icon: BarChart3, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40' },
  ]

  return (
    <>
      <PageHeader title="Reports" description="Operational summary and insights" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        {cards.map(c => (
          <Card key={c.title} className="border-2 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{c.title}</p>
                  <p className="text-2xl font-bold mt-2 tracking-tight">{c.value}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${c.bg}`}>
                  <c.icon className={`w-4 h-4 ${c.color}`} aria-hidden="true" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader className="px-6 py-4">
            <CardTitle className="text-lg">Revenue by Service</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {report.ordersByService.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No service data yet.</p>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Service</TableHead>
                      <TableHead className="font-semibold text-center">Items sold</TableHead>
                      <TableHead className="font-semibold text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.ordersByService.map(s => (
                      <TableRow key={s.service_name}>
                        <TableCell className="font-medium">{s.service_name}</TableCell>
                        <TableCell className="text-center text-muted-foreground">{s.count}</TableCell>
                        <TableCell className="text-right font-semibold">{formatMoney(s.revenue_cents)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="px-6 py-4">
            <CardTitle className="text-lg">Orders by Status</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {Object.keys(report.statusBreakdown).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No orders yet.</p>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(report.statusBreakdown).map(([status, count]) => (
                      <TableRow key={status}>
                        <TableCell className="font-medium">{status}</TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-semibold">
                            {count}
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
