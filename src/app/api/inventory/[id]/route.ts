import { getUser } from "@/lib/auth"
import { get, run, update } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const data = get('SELECT * FROM products WHERE id = ? AND user_id = ?', params.id, user.id)
  if (!data) return NextResponse.json({ error: "Product not found" }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const data = update('products', params.id, user.id, body)
  if (!data) return NextResponse.json({ error: "Product not found" }, { status: 404 })
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  run('DELETE FROM products WHERE id = ? AND user_id = ?', params.id, user.id)
  return NextResponse.json({ success: true })
}
