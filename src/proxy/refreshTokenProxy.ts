import { NextRequest, NextResponse } from 'next/server'
import { refreshService } from '../services/auth/refreshService'
import { CookieEnum } from '../utils/constant/cookieConstant'
import { removeCookies } from './removeCookies'

export const refreshTokenProxy = async (
  request: NextRequest,
  response: NextResponse,
) => {
  const refreshToken = request.cookies.get(CookieEnum.REFRESH_TOKEN)
  if (!refreshToken) {
    // remove cookies
    await removeCookies(response)
    return false
  } else {
    const refreshResponse = await refreshService(refreshToken.value)
    if (!refreshResponse.result) {
      await removeCookies(response)
      return false
    }
    // cookies update
    response.cookies.set(CookieEnum.ACCESS_TOKEN, refreshResponse.data.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
    })
    response.cookies.set(
      CookieEnum.REFRESH_TOKEN,
      refreshResponse.data.refreshToken,
      {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7,
      },
    )
    response.cookies.set(
      CookieEnum.EXPIRED_DATE,
      String(refreshResponse.data.expiredDate),
      {
        httpOnly: false,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7,
      },
    )
    response.cookies.set(CookieEnum.USER_CODE, refreshResponse.data.userCode, {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
    })
    return true
  }
}
