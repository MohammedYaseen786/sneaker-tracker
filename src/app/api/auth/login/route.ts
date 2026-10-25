import { NextRequest, NextResponse } from "next/server"
import { get } from "@/lib/db"
import { startSession, verifyPassword } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()
  const user = get('SELECT * FROM users WHERE email = ?', String(email || '').trim().toLowerCase())

  if (!user || !verifyPassword(String(password || ''), user.password_hash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
  }

  startSession(user.id)
  return NextResponse.json({ user: { id: user.id, email: user.email } })
}
