import { getUser } from "@/lib/auth"
import { all, get, run, update } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const customer = get('SELECT * FROM customers WHERE id = ? AND user_id = ?', params.id, user.id)
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 })

  const sales = all('SELECT * FROM sales WHERE customer_id = ? AND user_id = ? ORDER BY sale_date DESC', params.id, user.id)

  return NextResponse.json({
    data: {
      ...customer,
      total_purchases: sales.filter(s => !s.is_return).length,
      total_spent: sales.filter(s => !s.is_return).reduce((sum, s) => sum + Number(s.selling_price), 0),
      sales,
    }
  })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const data = update('customers', params.id, user.id, body)
  if (!data) return NextResponse.json({ error: "Customer not found" }, { status: 404 })
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  run('DELETE FROM customers WHERE id = ? AND user_id = ?', params.id, user.id)
  return NextResponse.json({ success: true })
}
