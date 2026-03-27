import { RateLimiter, RateLimitPresets } from '@/lib/rate-limiter'
import { generateCSP, getClientIp } from '@/lib/security'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { refreshTokenProxy } from './proxy/refreshTokenProxy'
import { removeCookies } from './proxy/removeCookies'
import { CookieEnum } from './utils/constant/cookieConstant'

// Initialize rate limiters for different routes
const apiRateLimiter = new RateLimiter(RateLimitPresets.api)
const generalRateLimiter = new RateLimiter(RateLimitPresets.moderate)

/**
 * Middleware to handle security headers and rate limiting
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next()

  // Get client IP for rate limiting
  const clientIp = getClientIp(request.headers)

  // Apply rate limiting
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
  const rateLimiter = isApiRoute ? apiRateLimiter : generalRateLimiter

  const rateLimitResult = await rateLimiter.check(clientIp)

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit))
  response.headers.set(
    'X-RateLimit-Remaining',
    String(rateLimitResult.remaining),
  )
  response.headers.set(
    'X-RateLimit-Reset',
    new Date(rateLimitResult.reset).toISOString(),
  )

  // If rate limit exceeded, return 429
  if (!rateLimitResult.success) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(
          Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        ),
        'X-RateLimit-Limit': String(rateLimitResult.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
      },
    })
  }

  // Security Headers
  // Prevent DNS prefetching
  response.headers.set('X-DNS-Prefetch-Control', 'on')

  // Strict Transport Security (HTTPS only)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload',
  )

  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // XSS Protection (legacy but still useful)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')

  // Permissions Policy (limit browser features)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  )

  // Content Security Policy
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Content-Security-Policy', generateCSP())
  }

  // Remove server header for security
  response.headers.delete('X-Powered-By')

  // Add custom security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Application-Name', 'Next.js Portfolio')

  // _next/static için özel header
  if (request.nextUrl.pathname.startsWith('/_next/')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  // TODO: cookies'teki expired_time degerini GMT zone'a cevir
  // expired olduysa refresh token ile yeni token ve refresh token olustur
  // yeni token ve refresh token'i cookies'a yaz

  // Admin rotalarını koru
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isAdminLoginRoute = request.nextUrl.pathname === '/admin/login'

  if (isAdminRoute && !isAdminLoginRoute) {
    const accessToken = request.cookies.get(CookieEnum.ACCESS_TOKEN)
    const expiredDate = request.cookies.get(CookieEnum.EXPIRED_DATE)

    // accessToken veya expiredDate yoksa login'e yönlendir
    if (!accessToken && !expiredDate) {
      // console.log('PROXY - Admin route protected, redirecting to login')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Token süresi dolmuşsa
    const expiredDateCheck = new Date(Number(expiredDate?.value))
    // console.log('expiredDate-CHECK', expiredDateCheck, 'new Date()', new Date())
    if (expiredDateCheck < new Date()) {
      // console.log('PROXY - Token expired, attempting refresh')
      const refreshResult = await refreshTokenProxy(request, response)
      // console.log('refreshResult', refreshResult)
      // Refresh başarısız olduysa login'e yönlendir
      if (!refreshResult) {
        // console.log('PROXY - Refresh failed, redirecting to login')
        const redirectResponse = NextResponse.redirect(
          new URL('/admin/login', request.url),
        )
        // İstediğiniz cookie'yi burada set edebilirsiniz
        await removeCookies(redirectResponse)
        return redirectResponse
      }
    }
  }

  return response
}

// Middleware'in hangi path'lerde çalışacağını belirt
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
