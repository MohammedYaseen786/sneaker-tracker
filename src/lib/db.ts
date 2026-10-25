import path from "path"
import fs from "fs"
import { randomUUID } from "crypto"
import { SCHEMA } from "./schema"

// Local SQLite database using Node's built-in `node:sqlite` module (Node 22.13+).
// Loaded at runtime so webpack doesn't try to bundle it.

type SqlValue = string | number | bigint | null | Uint8Array
export type Row = Record<string, any>

interface StatementSync {
  run(...params: SqlValue[]): { changes: number | bigint; lastInsertRowid: number | bigint }
  get(...params: SqlValue[]): Row | undefined
  all(...params: SqlValue[]): Row[]
}

interface DatabaseSync {
  exec(sql: string): void
  prepare(sql: string): StatementSync
  close(): void
}

export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data")
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads")

const BOOLEAN_COLUMNS = new Set(["is_return", "is_read", "email_notifications"])
const JSON_COLUMNS = new Set(["error_details"])

const globalForDb = globalThis as unknown as { __soleDb?: DatabaseSync; __soleColumns?: Map<string, Map<string, string>> }

export function getDb(): DatabaseSync {
  if (globalForDb.__soleDb) return globalForDb.__soleDb

  const sqlite = (process as any).getBuiltinModule?.("node:sqlite")
  if (!sqlite) {
    throw new Error("SoleTracker needs Node.js 22.13 or newer (for the built-in SQLite module).")
  }

  fs.mkdirSync(DATA_DIR, { recursive: true })
  const db: DatabaseSync = new sqlite.DatabaseSync(path.join(DATA_DIR, "soletracker.db"))
  db.exec("PRAGMA journal_mode = WAL;")
  db.exec("PRAGMA foreign_keys = ON;")
  db.exec(SCHEMA)

  globalForDb.__soleDb = db
  return db
}

function columnsOf(table: string): Map<string, string> {
  if (!globalForDb.__soleColumns) globalForDb.__soleColumns = new Map()
  let cols = globalForDb.__soleColumns.get(table)
  if (!cols) {
    cols = new Map()
    for (const c of getDb().prepare(`PRAGMA table_info(${table})`).all()) {
      cols.set(c.name, String(c.type).toUpperCase())
    }
    if (cols.size === 0) throw new Error(`Unknown table: ${table}`)
    globalForDb.__soleColumns.set(table, cols)
  }
  return cols
}

function toSql(value: unknown): SqlValue {
  if (value === undefined || value === null) return null
  if (typeof value === "boolean") return value ? 1 : 0
  if (typeof value === "number" || typeof value === "string" || typeof value === "bigint") return value
  if (value instanceof Uint8Array) return value
  return JSON.stringify(value)
}

/** Converts SQLite values back to the shapes the app expects (booleans, JSON). */
export function decode<T extends Row | undefined>(row: T): T {
  if (!row) return row
  const out: Row = { ...row }
  for (const key of Object.keys(out)) {
    if (BOOLEAN_COLUMNS.has(key) && out[key] !== null) out[key] = Boolean(out[key])
    else if (JSON_COLUMNS.has(key) && typeof out[key] === "string") {
      try { out[key] = JSON.parse(out[key]) } catch { /* leave as text */ }
    }
  }
  return out as T
}

export function all(sql: string, ...params: unknown[]): Row[] {
  return getDb().prepare(sql).all(...params.map(toSql)).map(r => decode(r))
}

export function get(sql: string, ...params: unknown[]): Row | undefined {
  return decode(getDb().prepare(sql).get(...params.map(toSql)))
}

export function run(sql: string, ...params: unknown[]) {
  return getDb().prepare(sql).run(...params.map(toSql))
}

/** Runs fn inside a transaction; rolls back if it throws. */
export function transaction<T>(fn: () => T): T {
  const db = getDb()
  db.exec("BEGIN")
  try {
    const result = fn()
    db.exec("COMMIT")
    return result
  } catch (err) {
    db.exec("ROLLBACK")
    throw err
  }
}

/** Keeps only real columns of `table`; blank strings in numeric columns become `blank`. */
function pick(table: string, values: Row, blank: "omit" | "null") {
  const cols = columnsOf(table)
  const entries: [string, SqlValue][] = []
  for (const [key, value] of Object.entries(values)) {
    const type = cols.get(key)
    if (!type || value === undefined) continue
    if (value === "" && (type === "REAL" || type === "INTEGER")) {
      if (blank === "null") entries.push([key, null])
      continue
    }
    entries.push([key, toSql(value)])
  }
  return entries
}

export function insert(table: string, values: Row): Row {
  const now = new Date().toISOString()
  const cols = columnsOf(table)
  const row: Row = { id: randomUUID(), ...values }
  if (cols.has("created_at")) row.created_at = now
  if (cols.has("updated_at")) row.updated_at = now

  const entries = pick(table, row, "omit")
  const sql = `INSERT INTO ${table} (${entries.map(([k]) => k).join(", ")}) VALUES (${entries.map(() => "?").join(", ")})`
  run(sql, ...entries.map(([, v]) => v))
  return get(`SELECT * FROM ${table} WHERE id = ?`, row.id)!
}

/** Updates the row with this id owned by userId and returns it, or undefined if not found. */
export function update(table: string, id: string, userId: string, values: Row): Row | undefined {
  const cols = columnsOf(table)
  const { id: _id, user_id: _uid, created_at: _c, ...rest } = values
  const row: Row = { ...rest }
  if (cols.has("updated_at")) row.updated_at = new Date().toISOString()

  const entries = pick(table, row, "null")
  if (entries.length > 0) {
    run(
      `UPDATE ${table} SET ${entries.map(([k]) => `${k} = ?`).join(", ")} WHERE id = ? AND user_id = ?`,
      ...entries.map(([, v]) => v), id, userId,
    )
  }
  return get(`SELECT * FROM ${table} WHERE id = ? AND user_id = ?`, id, userId)
}

/** Attaches `customers` (like Supabase's `select('*, customers(...)')`) to sales rows. */
export function withCustomers(sales: Row[], fields = ["id", "name", "phone"]): Row[] {
  const ids = Array.from(new Set(sales.map(s => s.customer_id).filter(Boolean)))
  if (ids.length === 0) return sales.map(s => ({ ...s, customers: null }))
  const customers = all(
    `SELECT ${fields.includes("*") ? "*" : Array.from(new Set(["id", ...fields])).join(", ")} FROM customers WHERE id IN (${ids.map(() => "?").join(", ")})`,
    ...ids,
  )
  const byId = new Map(customers.map(c => [c.id, c]))
  return sales.map(s => ({ ...s, customers: byId.get(s.customer_id) || null }))
}

/** Builds a LIKE pattern for case-insensitive "contains" search. */
export function like(term: string) {
  return `%${term.replace(/[\\%_]/g, c => `\\${c}`)}%`
}
