// Adds demo data to an existing account.
// Usage: npm run seed -- you@example.com
import { randomUUID } from "node:crypto"
import { openDb } from "./db.mjs"

const [email] = process.argv.slice(2)
if (!email) {
  console.error("Usage: npm run seed -- <email of your account>")
  process.exit(1)
}

const db = openDb()
const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email.trim().toLowerCase())
if (!user) {
  console.error(`No account found for ${email}. Sign up in the app first.`)
  process.exit(1)
}

const now = new Date().toISOString()

function insertAll(table, columns, rows) {
  const cols = ["id", "user_id", ...columns, "created_at"]
  const stmt = db.prepare(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`)
  for (const row of rows) stmt.run(randomUUID(), user.id, ...row, now)
}

db.exec("BEGIN")
try {
  insertAll("products",
    ["sku", "brand", "model", "colorway", "size", "gender", "condition", "purchase_date", "purchase_price", "selling_price", "min_selling_price", "quantity", "supplier", "status", "notes"],
    [
      ["NK-AJ1-001", "Nike", "Air Jordan 1 Retro High OG", "Chicago", "10", "Men", "New", "2024-01-15", 150, 380, 300, 2, "SNKRS App", "In Stock", "DS pair"],
      ["YZ-350-002", "Adidas", "Yeezy Boost 350 V2", "Zebra", "9.5", "Men", "New", "2024-01-20", 220, 450, 350, 1, "Adidas Draw", "In Stock", null],
      ["NK-DF-003", "Nike", "Dunk Low", "Panda", "8", "Women", "New", "2024-02-01", 110, 200, 150, 3, "Nike App", "In Stock", null],
      ["NK-AF1-004", "Nike", "Air Force 1 Low", "White/White", "11", "Men", "New", "2024-02-10", 90, 130, 110, 5, "Foot Locker", "In Stock", null],
      ["JD-450-005", "Jordan", "Air Jordan 4 Retro", "Military Black", "9", "Men", "New", "2024-02-15", 190, 420, 350, 1, "SNKRS App", "Reserved", "Reserved for customer"],
      ["NK-AJ1-006", "Nike", "Air Jordan 1 Mid", "Bred Toe", "10.5", "Men", "New", "2023-12-01", 115, 160, 140, 0, "Nike App", "Sold", null],
    ])

  insertAll("customers",
    ["name", "phone", "email", "instagram", "notes"],
    [
      ["Marcus Johnson", "+1-555-0101", "marcus@email.com", "@marcusj", "Regular buyer, prefers Jordan brand"],
      ["Sarah Williams", "+1-555-0102", "sarah@email.com", "@sarahw", "Likes Yeezy and Nike collaborations"],
      ["David Lee", "+1-555-0103", "david@email.com", null, "Wholesale buyer"],
      ["Emma Davis", "+1-555-0104", null, "@emmad", null],
    ])

  insertAll("sales",
    ["product_name", "product_brand", "product_model", "product_size", "sale_date", "selling_price", "purchase_cost", "platform", "payment_method", "shipping_cost", "packaging_cost", "fees", "profit"],
    [
      ["Air Jordan 1 Mid Bred Toe", "Nike", "Air Jordan 1 Mid", "10.5", "2024-01-10", 160, 115, "Instagram", "Bank Transfer", 0, 2, 0, 43],
      ["Nike Dunk Low Panda", "Nike", "Dunk Low", "8.5", "2024-01-22", 195, 110, "In-store", "Cash", 0, 0, 0, 85],
      ["Yeezy Boost 350 V2 Cream", "Adidas", "Yeezy Boost 350 V2", "9", "2024-02-05", 380, 220, "Marketplace", "PayPal", 15, 3, 19, 123],
      ["Nike Air Force 1", "Nike", "Air Force 1 Low", "10", "2024-02-18", 130, 90, "WhatsApp", "Cash", 0, 0, 0, 40],
      ["Air Jordan 4 Bred", "Jordan", "Air Jordan 4 Retro", "10", "2024-03-01", 450, 190, "Instagram", "Bank Transfer", 0, 2, 0, 258],
    ])

  insertAll("expenses",
    ["date", "category", "amount", "description"],
    [
      ["2024-01-01", "Packaging", 45, "Sneaker boxes and tissue paper"],
      ["2024-01-15", "Ads", 50, "Instagram promotion post"],
      ["2024-02-01", "Packaging", 30, "Bubble wrap and shipping supplies"],
      ["2024-02-15", "Fuel", 25, "Post office trip"],
      ["2024-03-01", "Ads", 75, "Facebook and Instagram ads"],
    ])

  db.exec("COMMIT")
  console.log(`Demo data added to ${email}.`)
} catch (err) {
  db.exec("ROLLBACK")
  throw err
}
