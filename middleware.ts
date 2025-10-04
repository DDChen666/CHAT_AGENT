import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const AUTH_COOKIE_NAME = 'auth_token'

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error('AUTH_SECRET not configured')
  }
  return secret
}

function verifyAuthToken(token: string) {
  try {
    return jwt.verify(token, getSecret()) as { userId: string; isAdmin: boolean }
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  // 跳过静态资源和API路由
  if (
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname.startsWith('/manifest.json') ||
    request.nextUrl.pathname.startsWith('/public/')
  ) {
    return NextResponse.next()
  }

  // 检查认证状态（可选，用于服务端渲染）
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const payload = token ? verifyAuthToken(token) : null

  // 可以在这里添加认证相关的逻辑
  // 比如重定向到登录页面等

  const response = NextResponse.next()

  if (token && !payload) {
    response.cookies.delete(AUTH_COOKIE_NAME)
  }

  // 设置安全头
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  if (payload) {
    response.headers.set('X-User-Authenticated', 'true')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)',
  ],
}
