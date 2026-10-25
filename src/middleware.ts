import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session-cookie'

// Middleware runs on the Edge runtime and can't open the database, so it only checks
// that a session cookie exists. Every API route validates the session itself.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value)

  const publicPaths = ['/login', '/signup', '/forgot-password', '/api/auth/login', '/api/auth/signup']
  const isPublicPath = publicPaths.some(p => pathname.startsWith(p))

  if (!hasSession && !isPublicPath) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Use the Host header: nextUrl's host is the server's bind address, not the name in the browser
    const host = request.headers.get('host') || request.nextUrl.host
    return NextResponse.redirect(new URL('/login', `${request.nextUrl.protocol}//${host}`))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
