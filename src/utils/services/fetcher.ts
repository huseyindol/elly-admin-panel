import { redirect } from 'next/navigation'
import {
  getGlobalCookies,
  removeGlobalCookie,
  updateGlobalCookie,
} from '../../context/CookieContext'
import { refreshService } from '../../services/auth/refreshService'
import { RefreshTokenResponseType } from '../../types/AuthResponse'
import { CookieEnum } from '../constant/cookieConstant'

// Helper function to remove all auth cookies
const removeAllAuthCookies = () => {
  removeGlobalCookie(CookieEnum.ACCESS_TOKEN)
  removeGlobalCookie(CookieEnum.REFRESH_TOKEN)
  removeGlobalCookie(CookieEnum.EXPIRED_DATE)
  removeGlobalCookie(CookieEnum.USER_CODE)
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
  console.log('prepareRequestCSROptions', options)
  return options
}

export const fetcher = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  console.log('fetcher')
  if (typeof window === 'undefined') {
    options = await prepareRequestSSROptions(options)
  } else {
    options = prepareRequestCSROptions(options)
  }
  if (url.includes('/auth/refresh') || url.includes('/auth/login')) {
    delete (options.headers as Record<string, string>)?.Authorization
  }
  console.log('options', `${process.env.NEXT_PUBLIC_API}${url}`, options)
  let response = await fetch(`${process.env.NEXT_PUBLIC_API}${url}`, options)
  if (!response.ok) {
    if (response.status === 401) {
      // In CSR: try to refresh token if fetchOngoing is enabled
      if (typeof window !== 'undefined') {
        const fetchOngoing = process.env.NEXT_PUBLIC_FETCH_ONGOING === 'true'
        if (fetchOngoing) {
          const cookies = getGlobalCookies()
          const refreshToken = cookies[CookieEnum.REFRESH_TOKEN]
          if (!refreshToken) {
            // No refresh token, remove all auth cookies and throw error
            removeAllAuthCookies()
            throw new Error('No refresh token available')
          }
          const csrRefreshTokenResponse: RefreshTokenResponseType =
            await csrRefreshToken(refreshToken)
          if (!csrRefreshTokenResponse.result) {
            // Refresh failed, remove all auth cookies and throw error
            removeAllAuthCookies()
            throw new Error('Token refresh failed')
          }
          options.headers = {
            ...options.headers,
            ...(csrRefreshTokenResponse.data.token && {
              Authorization: `Bearer ${csrRefreshTokenResponse.data.token}`,
            }),
          }
          // console.log('options', options)
          response = await fetch(
            `${process.env.NEXT_PUBLIC_API}${url}`,
            options,
          )
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

// CSR Refresh Token
const csrRefreshToken = async (refreshToken: string) => {
  const response = await refreshService(refreshToken)
  const { data } = response
  // Update cookies using global function (no React hook needed!)
  if (data?.refreshToken) {
    updateGlobalCookie(CookieEnum.REFRESH_TOKEN, data.refreshToken)
  }
  if (data?.token) {
    updateGlobalCookie(CookieEnum.ACCESS_TOKEN, data.token)
  }

  return response
}
