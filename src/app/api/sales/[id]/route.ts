import { getUser } from "@/lib/auth"
import { get, run, transaction, update, withCustomers } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { calculateProfit } from "@/lib/utils"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sale = get('SELECT * FROM sales WHERE id = ? AND user_id = ?', params.id, user.id)
  if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 })
  return NextResponse.json({ data: withCustomers([sale], ['*'])[0] })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const profit = calculateProfit(
    Number(body.selling_price) || 0,
    Number(body.purchase_cost) || 0,
    Number(body.shipping_cost) || 0,
    Number(body.packaging_cost) || 0,
    Number(body.other_costs) || 0,
    Number(body.fees) || 0,
  )

  const data = update('sales', params.id, user.id, {
    ...body,
    profit,
    product_id: body.product_id || null,
    customer_id: body.customer_id || null,
  })

  if (!data) return NextResponse.json({ error: "Sale not found" }, { status: 404 })
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  transaction(() => {
    // Get the sale before deleting to restore stock if needed
    const sale = get('SELECT product_id, is_return FROM sales WHERE id = ? AND user_id = ?', params.id, user.id)
    run('DELETE FROM sales WHERE id = ? AND user_id = ?', params.id, user.id)

    // Restore product stock if this was a real sale (not a return)
    if (sale?.product_id && !sale.is_return) {
      run(
        `UPDATE products SET quantity = quantity + 1, status = 'In Stock', updated_at = ? WHERE id = ? AND user_id = ?`,
        new Date().toISOString(), sale.product_id, user.id,
      )
    }
  })

  return NextResponse.json({ success: true })
}
