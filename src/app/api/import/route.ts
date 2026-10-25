import { getUser } from "@/lib/auth"
import { all, insert, transaction, type Row } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { parseExcelFile, mapRowsToProducts, mapRowsToSales, mapRowsToExpenses } from "@/lib/excel"

function tryInsert(table: string, row: Row): string | null {
  try {
    insert(table, row)
    return null
  } catch (err) {
    return err instanceof Error ? err.message : String(err)
  }
}

export async function POST(request: NextRequest) {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'parse'

  if (action === 'parse') {
    // Parse file and return headers + preview rows
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const { headers, rows } = parseExcelFile(buffer)
    const preview = rows.slice(0, 5)

    return NextResponse.json({ headers, preview, total_rows: rows.length, filename: file.name })
  }

  if (action === 'import') {
    // Actually import the data
    const body = await request.json()
    const { data: fileData, mapping, import_type, filename } = body

    if (!fileData || !mapping || !import_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let imported = 0
    let failed = 0
    const errors: string[] = []

    const record = (table: string, row: Row, valid: boolean) => {
      if (!valid) { failed++; return }
      const error = tryInsert(table, row)
      if (error) { failed++; errors.push(error) } else { imported++ }
    }

    try {
      transaction(() => {
        if (import_type === 'inventory') {
          for (const product of mapRowsToProducts(fileData, mapping, user.id)) {
            record('products', product, Boolean(product.brand && product.model))
          }
        } else if (import_type === 'sales') {
          for (const sale of mapRowsToSales(fileData, mapping, user.id)) {
            record('sales', sale, Boolean(sale.selling_price))
          }
        } else if (import_type === 'expenses') {
          for (const expense of mapRowsToExpenses(fileData, mapping, user.id)) {
            record('expenses', expense, Boolean(expense.amount))
          }
        }
      })
    } catch (err) {
      return NextResponse.json({ error: "Import failed", details: String(err) }, { status: 500 })
    }

    // Log the import
    insert('imported_files', {
      user_id: user.id,
      filename: filename || 'unknown',
      file_type: 'excel',
      import_type,
      records_imported: imported,
      records_failed: failed,
      status: failed === 0 ? 'completed' : 'completed_with_errors',
      error_details: errors.length > 0 ? { errors: errors.slice(0, 10) } : null,
    })

    return NextResponse.json({ imported, failed, errors: errors.slice(0, 10) })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}

export async function GET() {
  const user = getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const data = all('SELECT * FROM imported_files WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', user.id)
  return NextResponse.json({ data })
}
