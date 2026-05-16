import type { NextRequest, NextResponse } from 'next/server'
import { CookieEnum } from '../utils/constant/cookieConstant'

const AUTH_COOKIES = [
  CookieEnum.ACCESS_TOKEN,
  CookieEnum.REFRESH_TOKEN,
  CookieEnum.EXPIRED_DATE,
  CookieEnum.USER_CODE,
  CookieEnum.TENANT_ID,
]

export const removeCookies = async (
  response: NextResponse,
  _request: NextRequest,
) => {
  for (const name of AUTH_COOKIES) {
    // Host-only
    response.cookies.set(name, '', { path: '/', maxAge: 0 })
    // .huseyindol.com domain
    response.cookies.set(name, '', {
      path: '/',
      maxAge: 0,
      domain: '.huseyindol.com',
    })
  }
}
