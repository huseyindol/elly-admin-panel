import { redirect } from 'next/navigation'
import {
  getGlobalCookies,
  removeGlobalCookie,
  updateGlobalCookie,
} from '../../context/CookieContext'
import { RefreshTokenResponseType } from '../../types/AuthResponse'
import {
  CookieEnum,
  deriveMaxAgeFromExpiredDate,
} from '../constant/cookieConstant'

const AUTH_COOKIES: CookieEnum[] = [
  CookieEnum.ACCESS_TOKEN,
  CookieEnum.REFRESH_TOKEN,
  CookieEnum.EXPIRED_DATE,
  CookieEnum.USER_CODE,
  CookieEnum.TENANT_ID,
]

/**
 * Tüm auth cookie'lerini ve persist edilmiş permission state'i temizler.
 * - `removeGlobalCookie`: singleton React state + `document.cookie` (max-age=0)
 * - Singleton henüz init olmamış olabilir (early request) → `document.cookie`
 *   doğrudan yazılıyor ki refresh başarısızlığı sonrası ortam kesin temizlensin
 * - localStorage'taki `permission-storage` da temizlenir
 */
const removeAllAuthCookies = () => {
  AUTH_COOKIES.forEach(name => {
    removeGlobalCookie(name)
    if (typeof document !== 'undefined') {
      document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
    }
  })

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem('permission-storage')
      window.localStorage.removeItem('user-storage')
    } catch {
      // ignore — private mode / storage disabled
    }
  }
}

const prepareRequestSSROptions = async (options: RequestInit) => {
  const cookiesStore = import('next/headers').then(module => module.cookies())
  const cookies = await cookiesStore
  const accessToken = cookies.get(CookieEnum.ACCESS_TOKEN)
  options.headers = {
    ...options.headers,
    ...(accessToken && { Authorization: `Bearer ${accessToken?.value}` }),
  }
  return options
}

const prepareRequestCSROptions = (options: RequestInit) => {
  const cookies = getGlobalCookies()
  const accessToken = cookies[CookieEnum.ACCESS_TOKEN]
  options.headers = {
    ...options.headers,
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  }
  return options
}

let refreshTokenPromise: Promise<RefreshTokenResponseType> | null = null

const handleAuthFailure = (reason: string): never => {
  // JS-erişimli cookie'ler + localStorage'i best-effort temizle
  removeAllAuthCookies()
  if (typeof window !== 'undefined') {
    // HttpOnly cookie'ler JS'ten silinemediği için server endpoint'ine
    // git — orada raw Set-Cookie header'larıyla kesin temizlik + /login redirect
    if (!window.location.pathname.startsWith('/login')) {
      window.location.replace('/api/auth/logout')
    }
  }
  throw new Error(reason)
}

export const fetcher = async <T>(
  url: string,
  options: RequestInit & { overrideAuth?: string } = {},
): Promise<T> => {
  const { overrideAuth, ...restOptions } = options as RequestInit & {
    overrideAuth?: string
  }
  let fetchOpts: RequestInit = restOptions

  if (overrideAuth) {
    // Tenant-switch JWT — otomatik cookie JWT enjeksiyonunu atla
    fetchOpts.headers = {
      ...fetchOpts.headers,
      Authorization: `Bearer ${overrideAuth}`,
    }
  } else if (typeof window === 'undefined') {
    fetchOpts = await prepareRequestSSROptions(fetchOpts)
  } else {
    fetchOpts = prepareRequestCSROptions(fetchOpts)
  }

  // Referansı options'a yeniden ata (aşağıdaki kod options üzerinden çalışıyor)
  options = fetchOpts

  if (
    !overrideAuth &&
    (url.includes('/auth/refresh') ||
      url.includes('/auth/login') ||
      url.includes('/auth/mfa/verify'))
  ) {
    // Bu endpoint'ler JWT gerektirmez (mfa/verify yalnızca mfaToken kullanır).
    delete (options.headers as Record<string, string>)?.Authorization
  }
  let response = await fetch(`${process.env.NEXT_PUBLIC_API}${url}`, options)
  if (!response.ok) {
    // 403 — Yetkisiz erişim
    if (response.status === 403) {
      if (typeof window !== 'undefined') {
        const { toast } = await import('sonner')
        toast.error('Bu işlem için yetkiniz bulunmuyor.')
      }
    }

    if (response.status === 401) {
      // In CSR: try to refresh token if fetchOngoing is enabled
      if (typeof window !== 'undefined') {
        const fetchOngoing = process.env.NEXT_PUBLIC_FETCH_ONGOING === 'true'
        if (fetchOngoing) {
          // refreshToken HttpOnly olduğu için context'ten değil, /api/auth/refresh
          // proxy'sinden okunur — bu route server-side cookies() ile güncel token'ı alır.
          if (!refreshTokenPromise) {
            refreshTokenPromise = csrRefreshToken().finally(() => {
              refreshTokenPromise = null
            })
          }

          let csrRefreshTokenResponse: RefreshTokenResponseType
          try {
            csrRefreshTokenResponse = await refreshTokenPromise
          } catch {
            handleAuthFailure('Token refresh threw')
          }

          if (!csrRefreshTokenResponse!.result) {
            handleAuthFailure('Token refresh failed')
          }

          options.headers = {
            ...options.headers,
            ...(csrRefreshTokenResponse!.data?.token && {
              Authorization: `Bearer ${csrRefreshTokenResponse!.data.token}`,
            }),
          }
          response = await fetch(
            `${process.env.NEXT_PUBLIC_API}${url}`,
            options,
          )
        } else {
          handleAuthFailure('Unauthorized')
        }
      } else {
        redirect('/login')
      }
    }
  }
  if (response.status === 204) {
    return null as T
  }

  return response.json() as Promise<T>
}

/**
 * CSR Token Yenileme
 *
 * refreshToken HttpOnly olduğundan JS'ten okunamaz. Context'teki değer,
 * middleware server-side refresh yaptıktan sonra stale kalır ve backend
 * rotate edilmiş eski token'ı reddeder → logout.
 *
 * Çözüm: /api/auth/refresh proxy route'unu çağır. Bu route, server-side
 * cookies() ile her zaman güncel refreshToken'ı okur; yeni cookie'leri de
 * response'a yazar (HttpOnly dahil). Burası yalnızca context'i günceller.
 */
const csrRefreshToken = async (): Promise<RefreshTokenResponseType> => {
  const raw = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  })

  if (!raw.ok) {
    throw new Error('Refresh proxy responded with ' + raw.status)
  }

  const response: RefreshTokenResponseType = await raw.json()
  const { data } = response

  if (!data) return response

  // accessToken / expiredDate → backend'in döndüğü expiredDate'e bağlı süre
  const accessTtl = deriveMaxAgeFromExpiredDate(data.expiredDate)

  // React context'i yeni token'larla güncelle (cookie'ler API route tarafından set edildi)
  if (data.token) {
    updateGlobalCookie(CookieEnum.ACCESS_TOKEN, data.token, accessTtl)
  }
  if (data.expiredDate !== undefined && data.expiredDate !== null) {
    updateGlobalCookie(
      CookieEnum.EXPIRED_DATE,
      String(data.expiredDate),
      accessTtl,
    )
  }
  if (data.userCode) {
    updateGlobalCookie(CookieEnum.USER_CODE, data.userCode)
  }
  // refreshToken HttpOnly — context'e yazmaya gerek yok (API route cookie'yi set etti)

  // Zustand store'larını güncelle
  if (data.roles && data.permissions) {
    const { usePermissionStore } = await import('@/stores/permission-store')
    usePermissionStore.getState().setPermissions(data.roles, data.permissions)
  }
  if (data.userId !== undefined && data.username) {
    const { useUserStore } = await import('@/stores/user-store')
    useUserStore.getState().setUser({
      id: data.userId,
      username: data.username,
      email: data.email ?? '',
      userCode: data.userCode ?? '',
    })
  }

  return response
}

/**
 * Tek-uçuş (deduped) sessiz token yenileme.
 *
 * REST 401 akışı ile WS `beforeConnect` aynı `refreshTokenPromise` singleton'ını
 * paylaşır → eşzamanlı çift refresh olmaz. HttpOnly refreshToken `/api/auth/refresh`
 * proxy'sinde server-side okunur; HttpOnly cookie'ler korunur (model değişmez).
 *
 * Başarısızsa (refreshToken da geçersiz) reject eder — çağıran logout yapar.
 */
export const refreshAccessToken = (): Promise<RefreshTokenResponseType> => {
  if (!refreshTokenPromise) {
    refreshTokenPromise = csrRefreshToken().finally(() => {
      refreshTokenPromise = null
    })
  }
  return refreshTokenPromise
}
