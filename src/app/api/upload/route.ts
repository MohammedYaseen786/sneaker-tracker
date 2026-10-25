import { getUser } from "@/lib/auth"
import { UPLOADS_DIR } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import fs from "fs/promises"
import path from "path"
import { ALLOWED_EXTENSIONS } from "@/lib/uploads"

const MAX_BYTES = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const bucket = formData.get('bucket') === 'receipts' ? 'receipts' : 'product-images'

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (!ALLOWED_EXTENSIONS[ext]) return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File is larger than 10MB" }, { status: 400 })

  const relative = `${user.id}/${bucket}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`
  const target = path.join(UPLOADS_DIR, relative)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, Buffer.from(await file.arrayBuffer()))

  return NextResponse.json({ url: `/api/files/${relative}`, path: relative })
}
