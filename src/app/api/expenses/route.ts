import { getUser } from "@/lib/auth"
import { all, get, insert } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || ''
  const dateFrom = searchParams.get('date_from') || ''
  const dateTo = searchParams.get('date_to') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where = ['user_id = ?']
  const params: unknown[] = [user.id]
  if (category) { where.push('category = ?'); params.push(category) }
  if (dateFrom) { where.push('date >= ?'); params.push(dateFrom) }
  if (dateTo) { where.push('date <= ?'); params.push(dateTo) }
  const whereSql = where.join(' AND ')

  const count = get(`SELECT COUNT(*) AS n FROM expenses WHERE ${whereSql}`, ...params)?.n ?? 0
  const data = all(
    `SELECT * FROM expenses WHERE ${whereSql} ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?`,
    ...params, limit, (page - 1) * limit,
  )

  return NextResponse.json({ data, count, page, limit })
}

export async function POST(request: NextRequest) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  if (!body.category) return NextResponse.json({ error: "Category is required" }, { status: 400 })

  const data = insert('expenses', { ...body, user_id: user.id })
  return NextResponse.json({ data }, { status: 201 })
}
