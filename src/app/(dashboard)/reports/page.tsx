"use client"

import { useState, useEffect, useCallback } from "react"
import { Download, RefreshCw, TrendingUp, Banknote, BarChart2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"

const COLORS = ['#d946ef', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899']

const formatMonth = (str: string) => {
  if (!str) return ''
  const [y, m] = str.split('-')
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

const formatDay = (str: string) => {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface ReportData {
  summary: { totalRevenue: number; totalProfit: number; totalExpenses: number; netProfit: number; totalSales: number; avgProfit: number }
  granularity: 'day' | 'month'
  by_month: Array<{ date: string; revenue: number; profit: number; sales: number; expenses: number }>
  by_brand: Array<{ brand: string; revenue: number; profit: number; units: number }>
  by_platform: Array<{ platform: string; revenue: number; profit: number; units: number }>
  by_model: Array<{ model: string; brand: string; revenue: number; profit: number; units: number }>
  by_expense_category: Array<{ category: string; amount: number }>
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [platform, setPlatform] = useState('')
  const [brand, setBrand] = useState('')

  const fetchReports = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo, platform, brand })
    const res = await fetch(`/api/reports?${params}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [dateFrom, dateTo, platform, brand])

  useEffect(() => { fetchReports() }, [fetchReports])

  const handleExport = (type: string) => {
    const params = new URLSearchParams({ type, date_from: dateFrom, date_to: dateTo })
    window.open(`/api/export?${params}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const summary = data?.summary

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Business performance overview</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('sales')}>
            <Download className="h-4 w-4 mr-2" />Export Sales
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('expenses')}>
            <Download className="h-4 w-4 mr-2" />Export Expenses
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">From Date</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To Date</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Platform</Label>
              <Select value={platform} onValueChange={v => setPlatform(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="All Platforms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {['In-store', 'Instagram', 'WhatsApp', 'Website', 'Marketplace', 'Other'].map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Brand</Label>
              <Input placeholder="Filter by brand..." value={brand} onChange={e => setBrand(e.target.value)} className="w-40" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(summary?.totalRevenue || 0), color: 'text-foreground', bg: 'bg-blue-500/10', icon: Banknote },
          { label: 'Gross Profit', value: formatCurrency(summary?.totalProfit || 0), color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: TrendingUp },
          { label: 'Expenses', value: formatCurrency(summary?.totalExpenses || 0), color: 'text-red-400', bg: 'bg-red-500/10', icon: BarChart2 },
          { label: 'Net Profit', value: formatCurrency(summary?.netProfit || 0), color: (summary?.netProfit || 0) >= 0 ? 'text-brand-400' : 'text-red-400', bg: 'bg-brand-500/10', icon: TrendingUp },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
                </div>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly">Monthly Trend</TabsTrigger>
          <TabsTrigger value="brand">By Brand</TabsTrigger>
          <TabsTrigger value="platform">By Platform</TabsTrigger>
          <TabsTrigger value="model">Top Models</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue, Profit & Expenses Over Time</CardTitle>
              <CardDescription>
                {(data?.by_month || []).length} {data?.granularity === 'day' ? 'days' : 'months'} of data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(data?.by_month || []).length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={data?.by_month || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tickFormatter={data?.granularity === 'day' ? formatDay : formatMonth} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} formatter={(v: number) => formatCurrency(v)} labelFormatter={data?.granularity === 'day' ? formatDay : formatMonth} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} dot={true} name="Revenue" />
                    <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={true} name="Profit" />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={true} strokeDasharray="4 4" name="Expenses" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-48 items-center justify-center text-muted-foreground">No data for selected period</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Revenue by Brand</CardTitle></CardHeader>
              <CardContent>
                {(data?.by_brand || []).length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data?.by_brand || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="brand" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="revenue" fill="#8b5cf6" radius={[4,4,0,0]} name="Revenue" />
                      <Bar dataKey="profit" fill="#10b981" radius={[4,4,0,0]} name="Profit" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-48 items-center justify-center text-muted-foreground">No data</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Brand Performance Table</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Brand</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.by_brand || []).map(row => (
                      <TableRow key={row.brand}>
                        <TableCell className="font-medium">{row.brand}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                        <TableCell className="text-right text-emerald-400">{formatCurrency(row.profit)}</TableCell>
                        <TableCell className="text-right">{row.units}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="platform" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Sales Distribution by Platform</CardTitle></CardHeader>
              <CardContent>
                {(data?.by_platform || []).length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={data?.by_platform || []} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="revenue" nameKey="platform">
                        {(data?.by_platform || []).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} formatter={(v: number) => formatCurrency(v)} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-48 items-center justify-center text-muted-foreground">No data</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Platform Performance</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Platform</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.by_platform || []).map(row => (
                      <TableRow key={row.platform}>
                        <TableCell className="font-medium">{row.platform}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                        <TableCell className="text-right text-emerald-400">{formatCurrency(row.profit)}</TableCell>
                        <TableCell className="text-right">{row.units}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="model" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Top Models by Revenue</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.by_model || []).map((row, i) => {
                    const margin = row.revenue > 0 ? (row.profit / row.revenue * 100).toFixed(1) : '0'
                    return (
                      <TableRow key={row.model}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{row.model}</TableCell>
                        <TableCell className="text-muted-foreground">{row.brand}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                        <TableCell className="text-right text-emerald-400">{formatCurrency(row.profit)}</TableCell>
                        <TableCell className="text-right">
                          <span className={Number(margin) >= 0 ? 'text-emerald-400' : 'text-red-400'}>{margin}%</span>
                        </TableCell>
                        <TableCell className="text-right">{row.units}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Expense Breakdown</CardTitle></CardHeader>
              <CardContent>
                {(data?.by_expense_category || []).length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={data?.by_expense_category || []} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="amount" nameKey="category">
                        {(data?.by_expense_category || []).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} formatter={(v: number) => formatCurrency(v)} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-48 items-center justify-center text-muted-foreground">No expenses</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Expenses by Category</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(data?.by_expense_category || []).map((row, i) => {
                    const total = (data?.by_expense_category || []).reduce((s, r) => s + r.amount, 0)
                    const pct = total > 0 ? (row.amount / total * 100).toFixed(1) : '0'
                    return (
                      <div key={row.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{row.category}</span>
                          <span>{formatCurrency(row.amount)} <span className="text-muted-foreground">({pct}%)</span></span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
