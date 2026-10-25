import { getUser } from "@/lib/auth"
import { all, get, withCustomers } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString().slice(0, 10)
  const today = new Date().toISOString().slice(0, 10)
  const sixMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().slice(0, 10)

  // All sales
  const sales = all('SELECT * FROM sales WHERE user_id = ? AND is_return = 0', user.id)
  const expenses = all('SELECT * FROM expenses WHERE user_id = ?', user.id)
  const products = all('SELECT * FROM products WHERE user_id = ?', user.id)

  const totalRevenue = sales?.reduce((sum, s) => sum + Number(s.selling_price), 0) || 0
  const totalProfit = sales?.reduce((sum, s) => sum + Number(s.profit), 0) || 0
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
  const totalPairsSold = sales?.length || 0
  const stockOnHand = products?.filter(p => p.status === 'In Stock').reduce((sum, p) => sum + p.quantity, 0) || 0
  const stockValue = products?.filter(p => p.status === 'In Stock').reduce((sum, p) => sum + (Number(p.purchase_price) * p.quantity), 0) || 0

  const monthlySales = sales?.filter(s => s.sale_date >= startOfMonth) || []
  const monthlyRevenue = monthlySales.reduce((sum, s) => sum + Number(s.selling_price), 0)
  const monthlyProfit = monthlySales.reduce((sum, s) => sum + Number(s.profit), 0)

  const weeklySales = sales?.filter(s => s.sale_date >= startOfWeek) || []
  const weeklyRevenue = weeklySales.reduce((sum, s) => sum + Number(s.selling_price), 0)
  const weeklyProfit = weeklySales.reduce((sum, s) => sum + Number(s.profit), 0)

  // Monthly chart data (last 6 months)
  const chartData: Record<string, { date: string; revenue: number; profit: number; sales: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    chartData[key] = { date: key, revenue: 0, profit: 0, sales: 0 }
  }

  sales?.forEach(s => {
    const key = s.sale_date.slice(0, 7)
    if (chartData[key]) {
      chartData[key].revenue += Number(s.selling_price)
      chartData[key].profit += Number(s.profit)
      chartData[key].sales += 1
    }
  })

  // Top products
  const productSales: Record<string, { name: string; brand: string; revenue: number; profit: number; units_sold: number }> = {}
  sales?.forEach(s => {
    const name = s.product_name || `${s.product_brand} ${s.product_model}` || 'Unknown'
    if (!productSales[name]) {
      productSales[name] = { name, brand: s.product_brand || '', revenue: 0, profit: 0, units_sold: 0 }
    }
    productSales[name].revenue += Number(s.selling_price)
    productSales[name].profit += Number(s.profit)
    productSales[name].units_sold += 1
  })
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Platform breakdown
  const platformData: Record<string, number> = {}
  sales?.forEach(s => {
    platformData[s.platform] = (platformData[s.platform] || 0) + 1
  })

  // Brand breakdown
  const brandData: Record<string, number> = {}
  products?.forEach(p => {
    brandData[p.brand] = (brandData[p.brand] || 0) + p.quantity
  })

  // Low stock alerts
  const settings = get('SELECT low_stock_threshold, aging_days_threshold FROM user_settings WHERE user_id = ?', user.id)
  const lowStockThreshold = settings?.low_stock_threshold || 2

  const lowStockItems = products?.filter(p => p.status === 'In Stock' && p.quantity > 0 && p.quantity <= lowStockThreshold) || []

  // Recent sales
  const recentSales = withCustomers(
    all('SELECT * FROM sales WHERE user_id = ? ORDER BY created_at DESC LIMIT 5', user.id),
    ['name'],
  )

  return NextResponse.json({
    stats: {
      total_revenue: totalRevenue,
      total_profit: totalProfit,
      total_cost: totalRevenue - totalProfit,
      total_pairs_sold: totalPairsSold,
      stock_on_hand: stockOnHand,
      total_stock_value: stockValue,
      total_expenses: totalExpenses,
      net_profit: totalProfit - totalExpenses,
      monthly_revenue: monthlyRevenue,
      monthly_profit: monthlyProfit,
      weekly_revenue: weeklyRevenue,
      weekly_profit: weeklyProfit,
    },
    chart_data: Object.values(chartData),
    top_products: topProducts,
    platform_data: Object.entries(platformData).map(([name, value]) => ({ name, value })),
    brand_data: Object.entries(brandData).map(([name, value]) => ({ name, value })),
    low_stock_items: lowStockItems,
    recent_sales: recentSales || [],
  })
}
