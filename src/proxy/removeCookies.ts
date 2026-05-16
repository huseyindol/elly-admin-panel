import type { NextRequest, NextResponse } from 'next/server'

const COOKIE_DOMAINS: (string | undefined)[] = [undefined, '.huseyindol.com']

/**
 * İstekteki tüm cookie'leri hem mevcut domain'de hem de .huseyindol.com
 * domain'inde maxAge=0 ile sıfırlar.
 */
export const removeCookies = async (
  response: NextResponse,
  request: NextRequest,
) => {
  const allCookies = request.cookies.getAll()

  for (const cookie of allCookies) {
    for (const domain of COOKIE_DOMAINS) {
      response.cookies.set(cookie.name, '', {
        path: '/',
        maxAge: 0,
        ...(domain && { domain }),
      })
    }
  }
}
