import type { NextRequest, NextResponse } from 'next/server'
import { CookieEnum } from '../utils/constant/cookieConstant'

const AUTH_COOKIES = [
  CookieEnum.ACCESS_TOKEN,
  CookieEnum.REFRESH_TOKEN,
  CookieEnum.EXPIRED_DATE,
  CookieEnum.USER_CODE,
  CookieEnum.TENANT_ID,
]

const PAST_EXPIRES = 'Thu, 01 Jan 1970 00:00:00 GMT'

/**
 * Browser sadece "name + Path + Domain" tuple'ı tam eşleşen Set-Cookie
 * header'ını "expire" olarak yorumlar. NextResponse.cookies API'si
 * dahili Map'inde key = `name|domain|path` ile dedup yapar — yani aynı
 * name+path+domain için birden çok set çağrısı yapsak bile yalnızca
 * SONUNCU header gönderilir.
 *
 * Bu yüzden cookies API'sini kullanmıyoruz; doğrudan
 * `response.headers.append('set-cookie', ...)` ile birden çok ham
 * Set-Cookie satırı yazıyoruz. Browser hepsini görür ve eşleşeni
 * uygular.
 *
 * Cookie matching için Secure / HttpOnly / SameSite atribütleri
 * gerekmez (silme yalnızca name+path+domain ile yapılır); yine de
 * eski deploy'lardan kalmış değişik atribüt kombinasyonlarını
 * yakalamak adına bir kaç varyant gönderiyoruz.
 */
export const removeCookies = async (
  response: NextResponse,
  _request: NextRequest,
) => {
  for (const name of AUTH_COOKIES) {
    const baseAttrs = `Path=/; Max-Age=0; Expires=${PAST_EXPIRES}`
    const variants: string[] = [
      // 1) Host-only — login sayfası bu varyantta yazmış olabilir
      `${name}=; ${baseAttrs}`,
      `${name}=; ${baseAttrs}; SameSite=Lax`,
      `${name}=; ${baseAttrs}; SameSite=Strict`,
      `${name}=; ${baseAttrs}; HttpOnly; SameSite=Lax`,
      `${name}=; ${baseAttrs}; HttpOnly; SameSite=Strict`,
      `${name}=; ${baseAttrs}; Secure; SameSite=Strict`,
      `${name}=; ${baseAttrs}; HttpOnly; Secure; SameSite=Strict`,
      // 2) .huseyindol.com domain — production'da set edilmiş olabilir
      `${name}=; Domain=.huseyindol.com; ${baseAttrs}`,
      `${name}=; Domain=.huseyindol.com; ${baseAttrs}; HttpOnly; Secure; SameSite=Strict`,
    ]
    for (const v of variants) {
      response.headers.append('set-cookie', v)
    }
  }
}
