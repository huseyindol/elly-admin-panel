import { NextResponse } from 'next/server'
import { CookieEnum } from '../utils/constant/cookieConstant'

const COOKIE_DOMAINS = [undefined, '.huseyindol.com']

const cookiesToClear = [
  CookieEnum.ACCESS_TOKEN,
  CookieEnum.REFRESH_TOKEN,
  CookieEnum.EXPIRED_DATE,
  CookieEnum.USER_CODE,
  CookieEnum.TENANT_ID,
]

export const removeCookies = async (response: NextResponse) => {
  for (const name of cookiesToClear) {
    for (const domain of COOKIE_DOMAINS) {
      response.cookies.set(name, '', {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 0,
        ...(domain && { domain }),
      })
    }
  }
}
