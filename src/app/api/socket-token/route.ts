import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/socket-token
 *
 * Returns the raw admin_accessToken cookie value so the Kitchen page can pass
 * it directly to the Socket.IO handshake auth object.
 *
 * Why this exists:
 *   The admin_accessToken cookie is stored on the Vercel domain (because the
 *   Admin frontend uses a Next.js /api rewrite to proxy all requests to the
 *   Railway backend).  Socket.IO connects directly to the Railway backend, so
 *   the browser cannot send a Vercel-domain cookie to a Railway socket.
 *   This route runs on the same origin as the Admin, reads the cookie, and
 *   returns the token string so the socket client can inject it via auth.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_accessToken')?.value

  if (!token) {
    return NextResponse.json({ token: null }, { status: 401 })
  }

  return NextResponse.json({ token })
}
