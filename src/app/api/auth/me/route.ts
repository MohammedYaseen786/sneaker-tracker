import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth"

export async function GET() {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ user })
}
