import { getUser } from "@/lib/auth"
import { UPLOADS_DIR } from "@/lib/db"
import { ALLOWED_EXTENSIONS } from "@/lib/uploads"
import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

// Serves files saved by /api/upload. Users can only read their own uploads.
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [owner] = params.path
  const target = path.resolve(UPLOADS_DIR, ...params.path)
  if (owner !== user.id || !target.startsWith(path.resolve(UPLOADS_DIR) + path.sep)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const ext = path.extname(target).slice(1).toLowerCase()
  const contentType = ALLOWED_EXTENSIONS[ext]
  if (!contentType) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const data = await fs.readFile(target)
    return new NextResponse(data, {
      headers: { 'Content-Type': contentType, 'Cache-Control': 'private, max-age=31536000, immutable' },
    })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
