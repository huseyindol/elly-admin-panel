'use server'
import { cookies } from 'next/headers'

const COOKIE_DOMAINS: (string | undefined)[] = [undefined, '.huseyindol.com']

export const logout = async () => {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    for (const cookie of allCookies) {
      for (const domain of COOKIE_DOMAINS) {
        cookieStore.set(cookie.name, '', {
          path: '/',
          maxAge: 0,
          ...(domain && { domain }),
        })
      }
    }
  } catch {
    // cookie silme hatası navigation'ı engellemez
  }
}
