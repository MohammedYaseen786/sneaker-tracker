import { getUser } from "@/lib/auth"
import { all, like } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const dateFrom = searchParams.get('date_from') || ''
  const dateTo = searchParams.get('date_to') || ''
  const brand = searchParams.get('brand') || ''
  const platform = searchParams.get('platform') || ''
  const type = searchParams.get('type') || 'overview'

  const salesWhere = ['user_id = ?', 'is_return = 0']
  const salesParams: unknown[] = [user.id]
  const expensesWhere = ['user_id = ?']
  const expensesParams: unknown[] = [user.id]

  if (dateFrom) {
    salesWhere.push('sale_date >= ?'); salesParams.push(dateFrom)
    expensesWhere.push('date >= ?'); expensesParams.push(dateFrom)
  }
  if (dateTo) {
    salesWhere.push('sale_date <= ?'); salesParams.push(dateTo)
    expensesWhere.push('date <= ?'); expensesParams.push(dateTo)
  }
  if (brand) { salesWhere.push(`product_brand LIKE ? ESCAPE '\\'`); salesParams.push(like(brand)) }
  if (platform) { salesWhere.push('platform = ?'); salesParams.push(platform) }

  const sales = all(`SELECT * FROM sales WHERE ${salesWhere.join(' AND ')}`, ...salesParams)
  const expenses = all(`SELECT * FROM expenses WHERE ${expensesWhere.join(' AND ')}`, ...expensesParams)

  const totalRevenue = sales?.reduce((sum, s) => sum + Number(s.selling_price), 0) || 0
  const totalProfit = sales?.reduce((sum, s) => sum + Number(s.profit), 0) || 0
  const totalCost = sales?.reduce((sum, s) => sum + Number(s.purchase_cost), 0) || 0
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
  const netProfit = totalProfit - totalExpenses
  const totalSales = sales?.length || 0
  const avgProfit = totalSales > 0 ? totalProfit / totalSales : 0

  // Determine granularity based on date span
  const allDateStrings = [
    ...(sales?.map(s => s.sale_date.slice(0, 10)) || []),
    ...(expenses?.map(e => e.date.slice(0, 10)) || []),
  ].filter(Boolean).sort()
  let granularity = 'day'
  if (allDateStrings.length >= 2) {
    const first = new Date(allDateStrings[0])
    const last = new Date(allDateStrings[allDateStrings.length - 1])
    const spanDays = (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24)
    granularity = spanDays > 60 ? 'month' : 'day'
  }

  // By period (daily or monthly)
  const byMonth: Record<string, { date: string; revenue: number; profit: number; sales: number; expenses: number }> = {}
  sales?.forEach(s => {
    const key = granularity === 'day' ? s.sale_date.slice(0, 10) : s.sale_date.slice(0, 7)
    if (!byMonth[key]) byMonth[key] = { date: key, revenue: 0, profit: 0, sales: 0, expenses: 0 }
    byMonth[key].revenue += Number(s.selling_price)
    byMonth[key].profit += Number(s.profit)
    byMonth[key].sales += 1
  })
  expenses?.forEach(e => {
    const key = granularity === 'day' ? e.date.slice(0, 10) : e.date.slice(0, 7)
    if (!byMonth[key]) byMonth[key] = { date: key, revenue: 0, profit: 0, sales: 0, expenses: 0 }
    byMonth[key].expenses += Number(e.amount)
  })

  // By brand
  const byBrand: Record<string, { brand: string; revenue: number; profit: number; units: number }> = {}
  sales?.forEach(s => {
    const brand = s.product_brand || 'Unknown'
    if (!byBrand[brand]) byBrand[brand] = { brand, revenue: 0, profit: 0, units: 0 }
    byBrand[brand].revenue += Number(s.selling_price)
    byBrand[brand].profit += Number(s.profit)
    byBrand[brand].units += 1
  })

  // By platform
  const byPlatform: Record<string, { platform: string; revenue: number; profit: number; units: number }> = {}
  sales?.forEach(s => {
    const platform = s.platform || 'Other'
    if (!byPlatform[platform]) byPlatform[platform] = { platform, revenue: 0, profit: 0, units: 0 }
    byPlatform[platform].revenue += Number(s.selling_price)
    byPlatform[platform].profit += Number(s.profit)
    byPlatform[platform].units += 1
  })

  // By model
  const byModel: Record<string, { model: string; brand: string; revenue: number; profit: number; units: number }> = {}
  sales?.forEach(s => {
    const model = s.product_model || 'Unknown'
    if (!byModel[model]) byModel[model] = { model, brand: s.product_brand || '', revenue: 0, profit: 0, units: 0 }
    byModel[model].revenue += Number(s.selling_price)
    byModel[model].profit += Number(s.profit)
    byModel[model].units += 1
  })

  // Expense breakdown
  const byExpenseCategory: Record<string, { category: string; amount: number }> = {}
  expenses?.forEach(e => {
    if (!byExpenseCategory[e.category]) byExpenseCategory[e.category] = { category: e.category, amount: 0 }
    byExpenseCategory[e.category].amount += Number(e.amount)
  })

  return NextResponse.json({
    summary: { totalRevenue, totalProfit, totalCost, totalExpenses, netProfit, totalSales, avgProfit },
    granularity,
    by_month: Object.values(byMonth).sort((a, b) => a.date.localeCompare(b.date)),
    by_brand: Object.values(byBrand).sort((a, b) => b.revenue - a.revenue),
    by_platform: Object.values(byPlatform).sort((a, b) => b.revenue - a.revenue),
    by_model: Object.values(byModel).sort((a, b) => b.revenue - a.revenue).slice(0, 20),
    by_expense_category: Object.values(byExpenseCategory).sort((a, b) => b.amount - a.amount),
    sales: sales || [],
  })
}
