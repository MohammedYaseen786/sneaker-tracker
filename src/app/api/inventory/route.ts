import { getUser } from "@/lib/auth"
import { all, get, insert, like } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const brand = searchParams.get('brand') || ''
  const condition = searchParams.get('condition') || ''
  const size = searchParams.get('size') || ''
  const sortBy = searchParams.get('sort_by') || 'created_at'
  const sortOrder = searchParams.get('sort_order') || 'desc'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where = ['user_id = ?']
  const params: unknown[] = [user.id]

  if (search) {
    where.push(`(brand LIKE ? ESCAPE '\\' OR model LIKE ? ESCAPE '\\' OR sku LIKE ? ESCAPE '\\' OR colorway LIKE ? ESCAPE '\\')`)
    params.push(like(search), like(search), like(search), like(search))
  }
  if (status) { where.push('status = ?'); params.push(status) }
  if (brand) { where.push(`brand LIKE ? ESCAPE '\\'`); params.push(like(brand)) }
  if (condition) { where.push('condition = ?'); params.push(condition) }
  if (size) { where.push('size = ?'); params.push(size) }

  const validSortFields = ['created_at', 'brand', 'model', 'purchase_price', 'selling_price', 'quantity', 'purchase_date']
  const safeSort = validSortFields.includes(sortBy) ? sortBy : 'created_at'
  const direction = sortOrder === 'asc' ? 'ASC' : 'DESC'

  const whereSql = where.join(' AND ')
  const count = get(`SELECT COUNT(*) AS n FROM products WHERE ${whereSql}`, ...params)?.n ?? 0
  const data = all(
    `SELECT * FROM products WHERE ${whereSql} ORDER BY ${safeSort} ${direction} LIMIT ? OFFSET ?`,
    ...params, limit, (page - 1) * limit,
  )

  return NextResponse.json({ data, count, page, limit })
}

export async function POST(request: NextRequest) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  if (!body.brand || !body.model) return NextResponse.json({ error: "Brand and model are required" }, { status: 400 })

  const data = insert('products', { ...body, user_id: user.id })

  // Check for low stock notification
  const settings = get('SELECT low_stock_threshold FROM user_settings WHERE user_id = ?', user.id)
  const threshold = settings?.low_stock_threshold || 2
  if (data.quantity <= threshold && data.status === 'In Stock') {
    insert('notifications', {
      user_id: user.id,
      title: 'Low Stock Alert',
      message: `${data.brand} ${data.model} (Size ${data.size}) has only ${data.quantity} pair(s) left.`,
      type: 'low_stock',
      related_id: data.id,
      related_type: 'product',
    })
  }

  return NextResponse.json({ data }, { status: 201 })
}
