'use client'

import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatMoney } from '@/lib/money'

interface DailyTrendItem {
  date: string
  day_name: string
  label: string
  revenue_cents: number
  completed_orders: number
  created_orders: number
}

interface PaymentBreakdownItem {
  method: string
  count: number
  total_cents: number
}

interface ServiceBreakdownItem {
  service_name: string
  count: number
  revenue_cents: number
}

interface ReportsChartsProps {
  dailyTrend: DailyTrendItem[]
  paymentBreakdown: PaymentBreakdownItem[]
  servicesBreakdown: ServiceBreakdownItem[]
}

const trendConfig = {
  revenue: {
    label: 'Revenue (₱)',
    color: '#0ea5e9',
  },
} satisfies ChartConfig

const paymentColors: Record<string, string> = {
  CASH: '#10b981', // emerald
  GCASH: '#0ea5e9', // sky blue
  OTHER: '#8b5cf6', // purple
}

export function ReportsCharts({
  dailyTrend,
  paymentBreakdown,
  servicesBreakdown,
}: ReportsChartsProps) {
  const trendData = React.useMemo(() => {
    return dailyTrend.map(d => ({
      ...d,
      revenue: Math.round(d.revenue_cents / 100),
    }))
  }, [dailyTrend])

  const paymentData = React.useMemo(() => {
    return paymentBreakdown.map(p => ({
      ...p,
      amount: Math.round(p.total_cents / 100),
    }))
  }, [paymentBreakdown])

  const topServices = React.useMemo(() => {
    return servicesBreakdown.slice(0, 6).map(s => ({
      name: s.service_name,
      revenue: Math.round(s.revenue_cents / 100),
      count: s.count,
    }))
  }, [servicesBreakdown])

  return (
    <div className="mt-4 space-y-4">
      {/* 14-day Revenue trend */}
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b">
          <div>
            <CardTitle className="text-[13px]">14-Day Revenue Trajectory</CardTitle>
            <CardDescription>Daily revenue & completed laundry orders</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-4">
          {trendData.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">No recent trend data.</p>
          ) : (
            <ChartContainer config={trendConfig} className="h-[240px] w-full">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={11}
                  className="text-muted-foreground font-mono"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickFormatter={(val: number) => `₱${val}`}
                  className="text-muted-foreground font-mono"
                />
                <ChartTooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, item) => {
                        const payload = item.payload as DailyTrendItem
                        return (
                          <div className="space-y-1 font-mono text-xs">
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Revenue:</span>
                              <span className="font-semibold text-foreground">₱{Number(value).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Orders closed:</span>
                              <span className="font-medium text-foreground">{payload.completed_orders}</span>
                            </div>
                          </div>
                        )
                      }}
                    />
                  }
                />
                <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Two columns: Payment Breakdown + Top Services */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Payment Methods */}
        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="px-4 py-3 border-b">
            <CardTitle className="text-[13px]">Payment Method Breakdown</CardTitle>
            <CardDescription>Share of revenue by settlement type</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {paymentData.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">No payments recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {paymentData.map(p => {
                  const totalAll = paymentData.reduce((s, x) => s + x.total_cents, 0)
                  const pct = totalAll > 0 ? Math.round((p.total_cents / totalAll) * 100) : 0
                  const color = paymentColors[p.method] || '#64748b'
                  return (
                    <div key={p.method} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 font-medium">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                            aria-hidden="true"
                          />
                          {p.method} ({p.count} orders)
                        </span>
                        <span className="font-mono font-semibold">
                          {formatMoney(p.total_cents)} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Services by Revenue */}
        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="px-4 py-3 border-b">
            <CardTitle className="text-[13px]">Top Services by Revenue</CardTitle>
            <CardDescription>Highest grossing offerings</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {topServices.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">No completed service data yet.</p>
            ) : (
              <div className="space-y-3">
                {topServices.map((svc, i) => {
                  const maxRevenue = topServices[0]?.revenue || 1
                  const pct = Math.round((svc.revenue / maxRevenue) * 100)
                  return (
                    <div key={svc.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="truncate font-medium max-w-[200px]">
                          {i + 1}. {svc.name}
                        </span>
                        <span className="font-mono font-semibold">
                          ₱{svc.revenue.toLocaleString()} ({svc.count} orders)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-sky-500/80 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
