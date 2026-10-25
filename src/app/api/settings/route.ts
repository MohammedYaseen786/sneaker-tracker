import { getUser } from "@/lib/auth"
import { get, insert, run } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

function getOrCreateSettings(userId: string) {
  return get('SELECT * FROM user_settings WHERE user_id = ?', userId)
    // Other defaults come from the table definition; currency is set here because
    // databases created before the switch to rands still have a USD column default
    ?? insert('user_settings', { user_id: userId, currency: 'ZAR', currency_symbol: 'R' })
}

export async function GET() {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  return NextResponse.json({ data: getOrCreateSettings(user.id) })
}

export async function PUT(request: NextRequest) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const existing = getOrCreateSettings(user.id)

  const fields = ['business_name', 'currency', 'currency_symbol', 'default_markup', 'theme', 'low_stock_threshold', 'aging_days_threshold', 'email_notifications']
  const updates = fields.filter(f => body[f] !== undefined)
  if (updates.length > 0) {
    run(
      `UPDATE user_settings SET ${updates.map(f => `${f} = ?`).join(', ')}, updated_at = ? WHERE id = ?`,
      ...updates.map(f => body[f]), new Date().toISOString(), existing.id,
    )
  }

  return NextResponse.json({ data: get('SELECT * FROM user_settings WHERE id = ?', existing.id) })
}
