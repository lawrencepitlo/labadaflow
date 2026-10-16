'use client'

import * as React from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
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

interface DashboardChartsProps {
  dailyTrend: DailyTrendItem[]
  statusCounts: Record<string, number>
}

const chartConfig = {
  revenue: {
    label: 'Revenue (₱)',
    color: 'var(--chart-1, #0ea5e9)',
  },
  orders: {
    label: 'Orders',
    color: 'var(--chart-2, #10b981)',
  },
} satisfies ChartConfig

export function DashboardRevenueChart({ dailyTrend }: { dailyTrend: DailyTrendItem[] }) {
  const chartData = React.useMemo(() => {
    return dailyTrend.map(d => ({
      ...d,
      revenue: Math.round(d.revenue_cents / 100),
    }))
  }, [dailyTrend])

  const totalWeekRevenue = React.useMemo(() => {
    return dailyTrend.reduce((sum, d) => sum + d.revenue_cents, 0)
  }, [dailyTrend])

  const totalCompleted = React.useMemo(() => {
    return dailyTrend.reduce((sum, d) => sum + d.completed_orders, 0)
  }, [dailyTrend])

  return (
    <Card className="mt-4 gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b">
        <div>
          <CardTitle className="text-[13px]">Revenue & Volume Trend</CardTitle>
          <CardDescription>Past 7 days performance (Asia/Manila)</CardDescription>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tracking-tight">{formatMoney(totalWeekRevenue)}</p>
          <p className="text-[11px] text-muted-foreground">{totalCompleted} completed orders</p>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-4">
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">No revenue recorded in the last 7 days.</p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
                </linearGradient>
              </defs>
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
                tickFormatter={(value: number) => `₱${value}`}
                className="text-muted-foreground font-mono"
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      if (name === 'revenue') {
                        return (
                          <div className="flex items-center justify-between gap-4 font-mono">
                            <span className="text-muted-foreground">Revenue:</span>
                            <span className="font-semibold text-foreground">₱{Number(value).toLocaleString()}</span>
                          </div>
                        )
                      }
                      return (
                        <div className="flex items-center justify-between gap-4 font-mono">
                          <span className="text-muted-foreground">Completed:</span>
                          <span className="font-semibold text-foreground">{value}</span>
                        </div>
                      )
                    }}
                  />
                }
              />
              <Area
                dataKey="revenue"
                type="monotone"
                fill="url(#fillRevenue)"
                fillOpacity={0.4}
                stroke="#0ea5e9"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
