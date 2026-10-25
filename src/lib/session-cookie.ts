// Kept separate from auth.ts so middleware (Edge runtime) can import it without pulling in the database.
export const SESSION_COOKIE = "st_session"
