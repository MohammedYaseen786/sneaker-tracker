import { DatabaseSync } from "node:sqlite"
import fs from "node:fs"
import path from "node:path"

// Opens the same database file the app uses. The app creates the tables on first start.
export function openDb() {
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data")
  const file = path.join(dataDir, "soletracker.db")
  if (!fs.existsSync(file)) {
    console.error(`No database found at ${file}.\nStart the app (npm run dev) and create an account first.`)
    process.exit(1)
  }
  const db = new DatabaseSync(file)
  db.exec("PRAGMA foreign_keys = ON;")
  return db
}
