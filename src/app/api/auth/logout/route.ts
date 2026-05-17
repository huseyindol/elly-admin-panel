import type { NextRequest } from 'next/server'
import { CookieEnum } from '@/utils/constant/cookieConstant'

const AUTH_COOKIES = [
  CookieEnum.ACCESS_TOKEN,
  CookieEnum.REFRESH_TOKEN,
  CookieEnum.EXPIRED_DATE,
  CookieEnum.USER_CODE,
  CookieEnum.TENANT_ID,
]

const PAST_EXPIRES = 'Thu, 01 Jan 1970 00:00:00 GMT'

/**
 * Auth cookie'lerini tarayıcıdan kesin olarak silen server endpoint.
 *
 * Neden NextResponse değil plain Response kullanıyoruz:
 * - Next.js'in `response.cookies.set` API'si dahili Map'inde
 *   `name|domain|path` ile dedup yapar — aynı tuple için son set kazanır.
 * - Set-Cookie header'ını "ham" yazmak için `new Headers()` + `append`
 *   gerekiyor. Plain Response constructor'ı bunu sorunsuz kabul eder ve
 *   gönderilen header'ları olduğu gibi tarayıcıya iletir.
 *
 * Her cookie için 9 farklı varyant gönderilir (sameSite / secure /
 * httpOnly / domain kombinasyonları) — tarayıcı hangisi orjinaliyle
 * name+path+domain eşleşirse onu uygular ve cookie silinir.
 */
function buildCookieDeleteHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra)
  for (const name of AUTH_COOKIES) {
    const base = `Path=/; Max-Age=0; Expires=${PAST_EXPIRES}`
    const variants: string[] = [
      `${name}=; ${base}`,
      `${name}=; ${base}; SameSite=Lax`,
      `${name}=; ${base}; SameSite=Strict`,
      `${name}=; ${base}; HttpOnly`,
      `${name}=; ${base}; HttpOnly; SameSite=Strict`,
      `${name}=; ${base}; Secure; SameSite=Strict`,
      `${name}=; ${base}; HttpOnly; Secure; SameSite=Strict`,
      `${name}=; Domain=.huseyindol.com; ${base}`,
      `${name}=; Domain=.huseyindol.com; ${base}; HttpOnly; Secure; SameSite=Strict`,
    ]
    for (const v of variants) {
      headers.append('Set-Cookie', v)
    }
  }
  return headers
}

/** Browser navigasyonu için — cookie'leri siler ve /login'e yönlendirir. */
export async function GET(request: NextRequest) {
  const headers = buildCookieDeleteHeaders({
    Location: new URL('/login', request.url).toString(),
  })
  return new Response(null, { status: 302, headers })
}

/** JSON çağrıları için — cookie'leri siler ve 200 döner. */
export async function POST() {
  const headers = buildCookieDeleteHeaders({
    'Content-Type': 'application/json',
  })
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers })
}
