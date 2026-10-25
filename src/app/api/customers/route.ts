import { getUser } from "@/lib/auth"
import { all, get, insert, like } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where = ['c.user_id = ?']
  const params: unknown[] = [user.id]
  if (search) {
    where.push(`(c.name LIKE ? ESCAPE '\\' OR c.phone LIKE ? ESCAPE '\\' OR c.email LIKE ? ESCAPE '\\')`)
    params.push(like(search), like(search), like(search))
  }
  const whereSql = where.join(' AND ')

  const count = get(`SELECT COUNT(*) AS n FROM customers c WHERE ${whereSql}`, ...params)?.n ?? 0

  // Enrich with sales stats
  const data = all(
    `SELECT c.*,
       COUNT(s.id) AS total_purchases,
       COALESCE(SUM(s.selling_price), 0) AS total_spent,
       MAX(s.sale_date) AS last_purchase_date
     FROM customers c
     LEFT JOIN sales s ON s.customer_id = c.id AND s.is_return = 0
     WHERE ${whereSql}
     GROUP BY c.id
     ORDER BY c.created_at DESC
     LIMIT ? OFFSET ?`,
    ...params, limit, (page - 1) * limit,
  )

  return NextResponse.json({ data, count, page, limit })
}

export async function POST(request: NextRequest) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  if (!body.name) return NextResponse.json({ error: "Name is required" }, { status: 400 })

  const data = insert('customers', { ...body, user_id: user.id })
  return NextResponse.json({ data }, { status: 201 })
}
