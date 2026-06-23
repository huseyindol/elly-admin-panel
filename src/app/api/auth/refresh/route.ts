import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { refreshService } from '@/services/auth/refreshService'
import {
  CookieEnum,
  deriveMaxAgeFromExpiredDate,
} from '@/utils/constant/cookieConstant'

/**
 * CSR token yenileme proxy endpoint'i.
 *
 * Neden bu route var:
 * - `refreshToken` cookie'si HttpOnly — JS'ten (`document.cookie`) okunamaz.
 * - Middleware server-side refresh yaptığında React context (useState) eski
 *   token'larla kalır.
 * - fetcher.ts doğrudan backend'e gidip context'teki eski (rotate edilmiş)
 *   refreshToken'ı kullanırsa backend reddeder → logout.
 * - Bu route, server-side `cookies()` ile HER ZAMAN güncel refreshToken'ı
 *   okur ve backend'e iletir; yeni cookie'leri de response'a yazar.
 *
 * Çağrı: fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
 */
export async function POST() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(CookieEnum.REFRESH_TOKEN)?.value

  if (!refreshToken) {
    return NextResponse.json(
      { result: false, message: 'No refresh token' },
      { status: 401 },
    )
  }

  const refreshResponse = await refreshService(refreshToken)

  if (!refreshResponse.result || !refreshResponse.data) {
    return NextResponse.json(
      { result: false, message: 'Refresh failed' },
      { status: 401 },
    )
  }

  const { data } = refreshResponse
  // Cookie max-age'leri backend epoch'larından (tek kaynak):
  //   accessToken / expiredDate → expiredDate
  //   refreshToken / userCode   → refreshExpiredDate
  const accessTtl = deriveMaxAgeFromExpiredDate(data.expiredDate)
  const refreshTtl = deriveMaxAgeFromExpiredDate(data.refreshExpiredDate)

  const response = NextResponse.json(refreshResponse)

  // accessToken + refreshToken — HttpOnly (JS'ten okunamaz)
  response.cookies.set(CookieEnum.ACCESS_TOKEN, data.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: accessTtl,
  })
  response.cookies.set(CookieEnum.REFRESH_TOKEN, data.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: refreshTtl,
  })
  // expiredDate + userCode — Secure ama HttpOnly değil (context sync için okunabilir)
  response.cookies.set(CookieEnum.EXPIRED_DATE, String(data.expiredDate), {
    httpOnly: false,
    secure: true,
    sameSite: 'strict',
    maxAge: accessTtl,
  })
  response.cookies.set(CookieEnum.USER_CODE, data.userCode, {
    httpOnly: false,
    secure: true,
    sameSite: 'strict',
    maxAge: refreshTtl,
  })

  return response
}
