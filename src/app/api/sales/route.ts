import { getUser } from "@/lib/auth"
import { all, get, insert, like, run, transaction, withCustomers } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { calculateProfit } from "@/lib/utils"

export async function GET(request: NextRequest) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const platform = searchParams.get('platform') || ''
  const dateFrom = searchParams.get('date_from') || ''
  const dateTo = searchParams.get('date_to') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where = ['user_id = ?']
  const params: unknown[] = [user.id]
  if (search) {
    where.push(`(product_name LIKE ? ESCAPE '\\' OR product_brand LIKE ? ESCAPE '\\' OR product_model LIKE ? ESCAPE '\\')`)
    params.push(like(search), like(search), like(search))
  }
  if (platform) { where.push('platform = ?'); params.push(platform) }
  if (dateFrom) { where.push('sale_date >= ?'); params.push(dateFrom) }
  if (dateTo) { where.push('sale_date <= ?'); params.push(dateTo) }
  const whereSql = where.join(' AND ')

  const count = get(`SELECT COUNT(*) AS n FROM sales WHERE ${whereSql}`, ...params)?.n ?? 0
  const sales = all(
    `SELECT * FROM sales WHERE ${whereSql} ORDER BY sale_date DESC, created_at DESC LIMIT ? OFFSET ?`,
    ...params, limit, (page - 1) * limit,
  )

  return NextResponse.json({ data: withCustomers(sales), count, page, limit })
}

export async function POST(request: NextRequest) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()

  // Calculate profit
  const profit = calculateProfit(
    Number(body.selling_price) || 0,
    Number(body.purchase_cost) || 0,
    Number(body.shipping_cost) || 0,
    Number(body.packaging_cost) || 0,
    Number(body.other_costs) || 0,
    Number(body.fees) || 0,
  )

  const data = transaction(() => {
    // Snapshot product info
    let productInfo: Record<string, string> = {}
    const product = body.product_id
      ? get('SELECT brand, model, size, colorway, quantity, status FROM products WHERE id = ? AND user_id = ?', body.product_id, user.id)
      : undefined
    if (product) {
      productInfo = {
        product_name: `${product.brand} ${product.model}${product.colorway ? ` ${product.colorway}` : ''}`,
        product_brand: product.brand,
        product_model: product.model,
        product_size: product.size || '',
      }
    }

    const sale = insert('sales', {
      ...body,
      ...productInfo,
      user_id: user.id,
      profit,
      product_id: product ? body.product_id : null,
      customer_id: body.customer_id || null,
    })

    // Update product quantity if linked
    if (product && !body.is_return) {
      const newQty = Math.max(0, product.quantity - 1)
      run(
        'UPDATE products SET quantity = ?, status = ?, updated_at = ? WHERE id = ?',
        newQty, newQty === 0 ? 'Sold' : product.status, new Date().toISOString(), body.product_id,
      )
    }

    return sale
  })

  return NextResponse.json({ data }, { status: 201 })
}
