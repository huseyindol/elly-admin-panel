import { NextRequest, NextResponse } from 'next/server'
import { refreshService } from '../services/auth/refreshService'
import {
  CookieEnum,
  deriveMaxAgeFromExpiredDate,
} from '../utils/constant/cookieConstant'
import { removeCookies } from './removeCookies'

export const refreshTokenProxy = async (
  request: NextRequest,
  response: NextResponse,
) => {
  const refreshToken = request.cookies.get(CookieEnum.REFRESH_TOKEN)
  if (!refreshToken) {
    await removeCookies(response, request)
    return false
  }

  const refreshResponse = await refreshService(refreshToken.value)
  if (!refreshResponse.result) {
    await removeCookies(response, request)
    return false
  }

  // Cookie max-age'leri backend'in döndüğü epoch'lardan hesaplanır (tek kaynak: backend).
  //   accessToken / expiredDate → expiredDate
  //   refreshToken / userCode   → refreshExpiredDate
  // Backend yoksa (eski response) deriveMaxAgeFromExpiredDate fallback verir.
  const accessTtl = deriveMaxAgeFromExpiredDate(
    refreshResponse.data.expiredDate,
  )
  const refreshTtl = deriveMaxAgeFromExpiredDate(
    refreshResponse.data.refreshExpiredDate,
  )

  response.cookies.set(CookieEnum.ACCESS_TOKEN, refreshResponse.data.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: accessTtl,
  })
  response.cookies.set(
    CookieEnum.REFRESH_TOKEN,
    refreshResponse.data.refreshToken,
    {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: refreshTtl,
    },
  )
  response.cookies.set(
    CookieEnum.EXPIRED_DATE,
    String(refreshResponse.data.expiredDate),
    {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      maxAge: accessTtl,
    },
  )
  response.cookies.set(CookieEnum.USER_CODE, refreshResponse.data.userCode, {
    httpOnly: false,
    secure: true,
    sameSite: 'strict',
    maxAge: refreshTtl,
  })
  return true
}
