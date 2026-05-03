import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const session = await auth()

  const pathname = request.nextUrl.pathname
  const isPublic =
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/brand') ||
    pathname === '/favicon.ico'

  if (isPublic) return NextResponse.next()

  if (!session) {
    const signInUrl = new URL('/auth/signin', request.url)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|brand).*)'],
}
