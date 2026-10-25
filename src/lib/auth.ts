import { cookies } from "next/headers"
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto"
import { get, run } from "./db"
import { SESSION_COOKIE } from "./session-cookie"

const SESSION_DAYS = 30

export interface AuthUser {
  id: string
  email: string
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `scrypt:${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(":")
  if (scheme !== "scrypt" || !salt || !hash) return false
  const expected = Buffer.from(hash, "hex")
  const actual = scryptSync(password, salt, expected.length)
  return timingSafeEqual(expected, actual)
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

/** Creates a session for the user and sets the session cookie. */
export function startSession(userId: string) {
  const token = randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  run("DELETE FROM sessions WHERE expires_at <= ?", new Date().toISOString())
  run("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)", hashToken(token), userId, expires.toISOString())
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
  })
}

export function endSession() {
  const token = cookies().get(SESSION_COOKIE)?.value
  if (token) run("DELETE FROM sessions WHERE token_hash = ?", hashToken(token))
  cookies().delete(SESSION_COOKIE)
}

/** Returns the signed-in user for this request, or null. */
export function getUser(): AuthUser | null {
  const token = cookies().get(SESSION_COOKIE)?.value
  if (!token) return null
  const row = get(
    `SELECT users.id, users.email FROM sessions JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
    hashToken(token), new Date().toISOString(),
  )
  return row ? { id: row.id, email: row.email } : null
}
