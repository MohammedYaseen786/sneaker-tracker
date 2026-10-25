import { getUser } from "@/lib/auth"
import { all, withCustomers } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'inventory'
  const dateFrom = searchParams.get('date_from') || ''
  const dateTo = searchParams.get('date_to') || ''

  let data: Record<string, unknown>[] = []
  let filename = ''

  if (type === 'inventory') {
    const products = all('SELECT * FROM products WHERE user_id = ? ORDER BY brand', user.id)
    data = products.map(p => ({
      SKU: p.sku || '',
      Brand: p.brand,
      Model: p.model,
      Colorway: p.colorway || '',
      Size: p.size || '',
      Gender: p.gender || '',
      Condition: p.condition || '',
      'Purchase Date': p.purchase_date || '',
      'Purchase Price': p.purchase_price,
      'Selling Price': p.selling_price,
      'Min Price': p.min_selling_price || '',
      Quantity: p.quantity,
      Supplier: p.supplier || '',
      Status: p.status,
      Notes: p.notes || '',
    }))
    filename = 'inventory'
  } else if (type === 'sales') {
    const where = ['user_id = ?']
    const params: unknown[] = [user.id]
    if (dateFrom) { where.push('sale_date >= ?'); params.push(dateFrom) }
    if (dateTo) { where.push('sale_date <= ?'); params.push(dateTo) }
    const sales = withCustomers(
      all(`SELECT * FROM sales WHERE ${where.join(' AND ')} ORDER BY sale_date DESC`, ...params),
      ['name'],
    )
    data = sales.map(s => ({
      Date: s.sale_date,
      Product: s.product_name || '',
      Brand: s.product_brand || '',
      Model: s.product_model || '',
      Size: s.product_size || '',
      Platform: s.platform,
      'Payment Method': s.payment_method || '',
      Customer: (s.customers as { name: string })?.name || '',
      'Selling Price': s.selling_price,
      'Purchase Cost': s.purchase_cost,
      'Shipping Cost': s.shipping_cost,
      'Packaging Cost': s.packaging_cost,
      Fees: s.fees,
      'Other Costs': s.other_costs,
      Profit: s.profit,
      'Is Return': s.is_return ? 'Yes' : 'No',
      Notes: s.notes || '',
    }))
    filename = 'sales'
  } else if (type === 'expenses') {
    const where = ['user_id = ?']
    const params: unknown[] = [user.id]
    if (dateFrom) { where.push('date >= ?'); params.push(dateFrom) }
    if (dateTo) { where.push('date <= ?'); params.push(dateTo) }
    const expenses = all(`SELECT * FROM expenses WHERE ${where.join(' AND ')} ORDER BY date DESC`, ...params)
    data = expenses.map(e => ({
      Date: e.date,
      Category: e.category,
      Amount: e.amount,
      Description: e.description || '',
    }))
    filename = 'expenses'
  }

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, filename)
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  })
}
