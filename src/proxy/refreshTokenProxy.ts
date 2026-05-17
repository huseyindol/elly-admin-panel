import { NextRequest, NextResponse } from 'next/server'
import { refreshService } from '../services/auth/refreshService'
import { COOKIE_MAX_AGE, CookieEnum } from '../utils/constant/cookieConstant'
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

  // cookies update — her cookie ilgili token TTL'iyle hizalanır
  response.cookies.set(CookieEnum.ACCESS_TOKEN, refreshResponse.data.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE[CookieEnum.ACCESS_TOKEN],
  })
  response.cookies.set(
    CookieEnum.REFRESH_TOKEN,
    refreshResponse.data.refreshToken,
    {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE[CookieEnum.REFRESH_TOKEN],
    },
  )
  response.cookies.set(
    CookieEnum.EXPIRED_DATE,
    String(refreshResponse.data.expiredDate),
    {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE[CookieEnum.EXPIRED_DATE],
    },
  )
  response.cookies.set(CookieEnum.USER_CODE, refreshResponse.data.userCode, {
    httpOnly: false,
    secure: true,
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE[CookieEnum.USER_CODE],
  })
  return true
}
