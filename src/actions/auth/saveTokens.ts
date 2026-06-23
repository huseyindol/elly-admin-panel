'use server'
import { cookies } from 'next/headers'
import { CookieEnum } from '../../utils/constant/cookieConstant'

// Cookie max-age, her token'ın JWT `exp` claim'inden hesaplanır. Backend JWT_EXPIRATION /
// JWT_REFRESH_EXPIRATION değiştirince burası otomatik uyar (tek kaynak: backend token).
// Önceki davranış: maxAge HİÇ verilmiyordu → session cookie (browser kapanınca uçar)
// → "logged in" durumu refresh akışıyla uyumsuzdu.
const FALLBACK_MAX_AGE_SEC = 60 * 60

interface JwtExpPayload {
  exp?: number
}

function maxAgeFromJwt(token: string): number {
  try {
    const segment = token.split('.')[1]
    if (!segment) return FALLBACK_MAX_AGE_SEC
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(normalized)) as JwtExpPayload
    if (typeof payload.exp !== 'number') return FALLBACK_MAX_AGE_SEC
    const seconds = payload.exp - Math.floor(Date.now() / 1000)
    return seconds > 0 ? seconds : FALLBACK_MAX_AGE_SEC
  } catch {
    return FALLBACK_MAX_AGE_SEC
  }
}

const isProd = process.env.NODE_ENV === 'production'

export const saveTokens = async (data: {
  token: string
  refreshToken: string
  expiredDate: number
  userCode: string
}): Promise<{ success: boolean; error?: string }> => {
  try {
    const cookieStore = await cookies()
    const accessMaxAge = maxAgeFromJwt(data.token)
    const refreshMaxAge = maxAgeFromJwt(data.refreshToken)
    const base = {
      httpOnly: true,
      sameSite: 'strict' as const,
      secure: isProd,
      path: '/',
    }
    cookieStore.set(CookieEnum.ACCESS_TOKEN, data.token, {
      ...base,
      maxAge: accessMaxAge,
    })
    cookieStore.set(CookieEnum.REFRESH_TOKEN, data.refreshToken, {
      ...base,
      maxAge: refreshMaxAge,
    })
    // expiredDate / userCode refresh ile aynı sürede yaşasın — refresh expire'da
    // kullanıcı zaten logout'a düşer.
    cookieStore.set(CookieEnum.EXPIRED_DATE, String(data.expiredDate), {
      ...base,
      maxAge: refreshMaxAge,
    })
    cookieStore.set(CookieEnum.USER_CODE, data.userCode, {
      ...base,
      maxAge: refreshMaxAge,
    })
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Cookie kaydetme hatası',
    }
  }
}
