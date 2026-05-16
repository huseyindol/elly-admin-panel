'use server'
import { cookies } from 'next/headers'
import { CookieEnum } from '../../utils/constant/cookieConstant'

const AUTH_COOKIES = [
  CookieEnum.ACCESS_TOKEN,
  CookieEnum.REFRESH_TOKEN,
  CookieEnum.EXPIRED_DATE,
  CookieEnum.USER_CODE,
  CookieEnum.TENANT_ID,
]

export const logout = async () => {
  const cookieStore = await cookies()

  // Host-only cookie'leri sil (saveTokens'ta nasıl set edildiyse)
  for (const name of AUTH_COOKIES) {
    cookieStore.delete(name)
  }

  // .huseyindol.com domain cookie'leri sil (varsa)
  for (const name of AUTH_COOKIES) {
    try {
      cookieStore.set(name, '', {
        path: '/',
        maxAge: 0,
        domain: '.huseyindol.com',
      })
    } catch {
      // domain silme hatası diğerlerini etkilemesin
    }
  }
}
