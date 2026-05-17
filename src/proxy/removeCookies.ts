import type { NextRequest, NextResponse } from 'next/server'
import { CookieEnum } from '../utils/constant/cookieConstant'

const AUTH_COOKIES = [
  CookieEnum.ACCESS_TOKEN,
  CookieEnum.REFRESH_TOKEN,
  CookieEnum.EXPIRED_DATE,
  CookieEnum.USER_CODE,
  CookieEnum.TENANT_ID,
]

/**
 * Browser sadece "name + path + domain" tuple'ı tam eşleşen Set-Cookie
 * header'ını expired sayar. Cookie'ler iki farklı yoldan geliyor:
 *   1. Login JS:    document.cookie  → host-only, SameSite=Lax, secure yok
 *   2. Proxy/refresh: response.cookies.set(..., { httpOnly:true, secure:true,
 *                                                sameSite:'strict' })
 *
 * `domain=.huseyindol.com` ile prod'da set edilmiş eski cookie'ler de olabilir.
 * Bu nedenle hangisi olduğunu tahmin etmek yerine, tüm makul kombinasyonlar
 * için `Set-Cookie name=; Max-Age=0; Expires=0` header'ı yazıyoruz.
 */
const DELETE_VARIANTS: Array<{
  domain?: string
  sameSite?: 'lax' | 'strict' | 'none'
  secure?: boolean
  httpOnly?: boolean
}> = [
  // 1) host-only varyantları (login JS + middleware her ikisini de denemeli)
  {},
  { sameSite: 'lax' },
  { sameSite: 'strict' },
  { sameSite: 'lax', secure: true },
  { sameSite: 'strict', secure: true },
  { sameSite: 'strict', secure: true, httpOnly: true },
  // 2) production'da .huseyindol.com domain'inde set edilmiş olabilir
  { domain: '.huseyindol.com' },
  { domain: '.huseyindol.com', sameSite: 'strict', secure: true },
  {
    domain: '.huseyindol.com',
    sameSite: 'strict',
    secure: true,
    httpOnly: true,
  },
]

export const removeCookies = async (
  response: NextResponse,
  _request: NextRequest,
) => {
  for (const name of AUTH_COOKIES) {
    for (const variant of DELETE_VARIANTS) {
      response.cookies.set(name, '', {
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        ...variant,
      })
    }
  }
}
