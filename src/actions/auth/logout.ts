'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const COOKIE_DOMAINS: (string | undefined)[] = [undefined, '.huseyindol.com']

/**
 * Mevcut tüm cookie'leri hem ana domain'de hem de .huseyindol.com domain'inde
 * maxAge=0 ile siler. Tarayıcı, cookie'yi hangi domain'le set ettiyse silme
 * isteği de aynı domain'le gönderilmeli — bu nedenle iki kez set ediyoruz.
 */
export const logout = async () => {
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

  redirect('/login')
}
