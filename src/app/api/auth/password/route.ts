import { NextRequest, NextResponse } from "next/server"
import { run } from "@/lib/db"
import { getUser, hashPassword } from "@/lib/auth"

export async function PUT(request: NextRequest) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { password } = await request.json()
  if (!password || String(password).length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })

  run('UPDATE users SET password_hash = ? WHERE id = ?', hashPassword(String(password)), user.id)
  return NextResponse.json({ success: true })
}
