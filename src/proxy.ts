// import { RateLimiter, RateLimitPresets } from '@/lib/rate-limiter'
import { generateCSP } from '@/lib/security'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { refreshTokenProxy } from './proxy/refreshTokenProxy'
import { removeCookies } from './proxy/removeCookies'
import { CookieEnum } from './utils/constant/cookieConstant'

// Initialize rate limiters for different routes
// const apiRateLimiter = new RateLimiter(RateLimitPresets.api)
// const generalRateLimiter = new RateLimiter(RateLimitPresets.moderate)

/**
 * Middleware to handle security headers and rate limiting
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next()

  // Get client IP for rate limiting
  // const clientIp = getClientIp(request.headers)

  // Apply rate limiting
  // const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
  // const rateLimiter = isApiRoute ? apiRateLimiter : generalRateLimiter

  // const rateLimitResult = await rateLimiter.check(clientIp)

  // Add rate limit headers
  // response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit))
  // response.headers.set(
  //   'X-RateLimit-Remaining',
  //   String(rateLimitResult.remaining),
  // )
  // response.headers.set(
  //   'X-RateLimit-Reset',
  //   new Date(rateLimitResult.reset).toISOString(),
  // )

  // If rate limit exceeded, return 429
  // if (!rateLimitResult.success) {
  //   return new NextResponse('Too Many Requests', {
  //     status: 429,
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Retry-After': String(
  //         Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
  //       ),
  //       'X-RateLimit-Limit': String(rateLimitResult.limit),
  //       'X-RateLimit-Remaining': '0',
  //       'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
  //     },
  //   })
  // }

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
  // camera/microphone: WebRTC görüntülü görüşme için KENDİ origin'ine (self) izinli;
  // cross-origin iframe'lere kapalı. () olursa getUserMedia "Permission denied" atar.
  response.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(self), geolocation=(), interest-cohort=()',
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

  // Auth bilgilerini al
  const accessToken = request.cookies.get(CookieEnum.ACCESS_TOKEN)
  const expiredDate = request.cookies.get(CookieEnum.EXPIRED_DATE)
  const refreshToken = request.cookies.get(CookieEnum.REFRESH_TOKEN)
  // accessToken (4h) + expiredDate (4h) düşmüş olabilir; refreshToken (6 ay)
  // hâlâ varsa "yenilenebilir" sayılır.
  const hasAccess = !!(accessToken && expiredDate)
  const canRefresh = !!refreshToken
  const isAuthenticated = hasAccess || canRefresh

  const isLoginRoute = request.nextUrl.pathname === '/login'
  const isApiRoute2 = request.nextUrl.pathname.startsWith('/api/')
  const isDocsRoute = request.nextUrl.pathname.startsWith('/docs/')
  const isRootRoute = request.nextUrl.pathname === '/'

  // Token süresinin dolup dolmadığını expiredDate cookie değerinden kontrol et
  const isAccessExpired =
    hasAccess && new Date(Number(expiredDate?.value)) < new Date()

  // Root (/) → login veya dashboard'a yönlendir
  if (isRootRoute) {
    const target = isAuthenticated ? '/dashboard' : '/login'
    return NextResponse.redirect(new URL(target, request.url))
  }

  // Login sayfası: süresi geçmiş token ile loop'a girmemek için
  //   - geçerli access varsa dashboard'a yönlendir
  //   - süresi geçmişse cookie'leri temizle, login'i servis et (self-heal)
  if (isLoginRoute && isAuthenticated) {
    if (hasAccess && !isAccessExpired) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // Stale auth — login'i temiz state ile servis et
    await removeCookies(response, request)
    return response
  }

  // Korumalı rotalar (login ve api hariç tüm rotalar)
  const isProtectedRoute =
    !isLoginRoute &&
    !isApiRoute2 &&
    !isDocsRoute &&
    !request.nextUrl.pathname.startsWith('/sunum')

  if (isProtectedRoute) {
    // Ne access ne refresh varsa direkt login
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Access yoksa veya süresi dolmuşsa, refreshToken varsa yenileme dene
    const needsRefresh = !hasAccess || isAccessExpired
    if (needsRefresh) {
      if (!canRefresh) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      const refreshResult = await refreshTokenProxy(request, response)
      if (!refreshResult) {
        const redirectResponse = NextResponse.redirect(
          new URL('/login', request.url),
        )
        // İstediğiniz cookie'yi burada set edebilirsiniz
        await removeCookies(redirectResponse, request)
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
