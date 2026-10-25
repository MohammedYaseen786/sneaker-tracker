import { getUser } from "@/lib/auth"
import { all, get, run } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const data = all('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', user.id)
  const unread = get('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0', user.id)?.n ?? 0
  return NextResponse.json({ data, unread })
}

export async function PUT(request: NextRequest) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { id, is_read } = body

  if (id === 'all') {
    run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', user.id)
  } else {
    run('UPDATE notifications SET is_read = ? WHERE id = ? AND user_id = ?', Boolean(is_read), id, user.id)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (id === 'all') {
    run('DELETE FROM notifications WHERE user_id = ?', user.id)
  } else if (id) {
    run('DELETE FROM notifications WHERE id = ? AND user_id = ?', id, user.id)
  }

  return NextResponse.json({ success: true })
}
