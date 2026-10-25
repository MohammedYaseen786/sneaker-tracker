import { NextRequest, NextResponse } from "next/server"
import { get, insert } from "@/lib/db"
import { hashPassword, startSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()
  const cleanEmail = String(email || '').trim().toLowerCase()

  if (!cleanEmail || !cleanEmail.includes('@')) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 })
  if (!password || String(password).length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
  if (get('SELECT id FROM users WHERE email = ?', cleanEmail)) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
  }

  const user = insert('users', { email: cleanEmail, password_hash: hashPassword(String(password)) })
  startSession(user.id)
  return NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 })
}
