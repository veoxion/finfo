import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register']
const MASTER_EMAIL = process.env.NEXT_PUBLIC_MASTER_EMAIL ?? ''

function getEmailFromCookie(request: NextRequest): string | null {
  const emailCookie = request.cookies.get('finfo_email')?.value
  return emailCookie ? decodeURIComponent(emailCookie) : null
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('finfo_token')?.value

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (!isPublic && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isPublic && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // /admin 은 마스터만 접근 가능
  if (pathname.startsWith('/admin')) {
    const email = getEmailFromCookie(request)
    if (email !== MASTER_EMAIL) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
