// Usage: npm run reset-password -- you@example.com newpassword
import { randomBytes, scryptSync } from "node:crypto"
import { openDb } from "./db.mjs"

const [email, password] = process.argv.slice(2)
if (!email || !password) {
  console.error("Usage: npm run reset-password -- <email> <new password>")
  process.exit(1)
}
if (password.length < 6) {
  console.error("Password must be at least 6 characters.")
  process.exit(1)
}

const db = openDb()
const salt = randomBytes(16).toString("hex")
const hash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`

const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email.trim().toLowerCase())
if (!user) {
  console.error(`No account found for ${email}.`)
  process.exit(1)
}

db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, user.id)
db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id)
console.log(`Password updated for ${email}. You can now sign in with the new password.`)
