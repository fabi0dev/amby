import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

/**
 * Protege todas as rotas (exceto api, estáticos, login, registro).
 * Rotas /settings/* e /workspace/* exigem token válido; sem token → redirect /login.
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    const isAuthPage =
      pathname.startsWith('/login') ||
      pathname.startsWith('/register')

    // Rotas públicas (não exigem login)
    const isPublicSharePage = pathname.startsWith('/share')

    if (isAuthPage && token) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    if (!isAuthPage && !isPublicSharePage && !token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
)

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
