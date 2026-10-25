"use client"

import { useState, useEffect } from "react"
import {
  TrendingUp, TrendingDown, Banknote, Package,
  ShoppingCart, AlertTriangle, ArrowUpRight, Clock
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"

interface DashboardData {
  stats: {
    total_revenue: number
    total_profit: number
    total_pairs_sold: number
    stock_on_hand: number
    total_stock_value: number
    total_expenses: number
    net_profit: number
    monthly_revenue: number
    monthly_profit: number
    weekly_revenue: number
    weekly_profit: number
  }
  chart_data: Array<{ date: string; revenue: number; profit: number; sales: number }>
  top_products: Array<{ name: string; brand: string; revenue: number; profit: number; units_sold: number }>
  platform_data: Array<{ name: string; value: number }>
  brand_data: Array<{ name: string; value: number }>
  low_stock_items: Array<{ id: string; brand: string; model: string; size: string; quantity: number }>
  recent_sales: Array<{
    id: string; product_name: string; product_brand: string; selling_price: number;
    profit: number; sale_date: string; platform: string; customers: { name: string } | null
  }>
}

const COLORS = ['#d946ef', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']

const formatMonth = (str: string) => {
  if (!str) return ''
  const [year, month] = str.split('-')
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl" />)}
        </div>
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    )
  }

  const stats = data?.stats

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.total_revenue || 0),
      subtext: `${formatCurrency(stats?.monthly_revenue || 0)} this month`,
      icon: Banknote,
      trend: "up",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Net Profit",
      value: formatCurrency(stats?.net_profit || 0),
      subtext: `${formatCurrency(stats?.monthly_profit || 0)} this month`,
      icon: TrendingUp,
      trend: (stats?.net_profit || 0) >= 0 ? "up" : "down",
      color: (stats?.net_profit || 0) >= 0 ? "text-brand-400" : "text-red-400",
      bg: (stats?.net_profit || 0) >= 0 ? "bg-brand-500/10" : "bg-red-500/10",
    },
    {
      title: "Pairs Sold",
      value: stats?.total_pairs_sold?.toString() || "0",
      subtext: `${formatCurrency(stats?.weekly_revenue || 0)} this week`,
      icon: ShoppingCart,
      trend: "up",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Stock on Hand",
      value: stats?.stock_on_hand?.toString() || "0",
      subtext: `${formatCurrency(stats?.total_stock_value || 0)} value`,
      icon: Package,
      trend: "neutral",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your sneaker business at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ title, value, subtext, icon: Icon, trend, color, bg }) => (
          <Card key={title} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                  <p className="text-2xl font-bold tracking-tight">{value}</p>
                  <p className="text-xs text-muted-foreground">{subtext}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue & Profit Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Revenue & Profit</CardTitle>
            <CardDescription>Last 6 months performance</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data?.chart_data || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={formatMonth} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }}
                  formatter={(v: number) => formatCurrency(v)}
                  labelFormatter={formatMonth}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="url(#colorRevenue)" strokeWidth={2} name="Revenue" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#colorProfit)" strokeWidth={2} name="Profit" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Platform Breakdown */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Sales by Platform</CardTitle>
            <CardDescription>Where you sell most</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {(data?.platform_data || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={data?.platform_data || []} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                    {(data?.platform_data || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[240px] items-center justify-center text-muted-foreground text-sm">No sales data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.top_products || []).length > 0 ? (
              <div className="space-y-3">
                {(data?.top_products || []).map((product, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.units_sold} sold · {formatCurrency(product.profit)} profit</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-400">{formatCurrency(product.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">No sales data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Low Stock Alerts</CardTitle>
              {(data?.low_stock_items || []).length > 0 && (
                <Badge variant="warning">{data?.low_stock_items.length} items</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {(data?.low_stock_items || []).length > 0 ? (
              <div className="space-y-3">
                {(data?.low_stock_items || []).map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.brand} {item.model}</p>
                      <p className="text-xs text-muted-foreground">Size {item.size || '?'}</p>
                    </div>
                    <Badge variant="warning">{item.quantity} left</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                <div className="text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>All stocked up!</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Sales</CardTitle>
              <CardDescription>Latest transactions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(data?.recent_sales || []).length > 0 ? (
            <div className="space-y-3">
              {(data?.recent_sales || []).map(sale => (
                <div key={sale.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-lg">
                    👟
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{sale.product_name || `${sale.product_brand} Sneaker`}</p>
                    <p className="text-xs text-muted-foreground">
                      {sale.platform} · {formatDate(sale.sale_date)}
                      {sale.customers?.name && ` · ${sale.customers.name}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(sale.selling_price)}</p>
                    <p className={`text-xs ${sale.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {sale.profit >= 0 ? '+' : ''}{formatCurrency(sale.profit)} profit
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
              <div className="text-center">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No sales yet. Add your first sale!</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
