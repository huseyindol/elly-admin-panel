import { NextResponse } from 'next/server'
import { CookieEnum } from '../utils/constant/cookieConstant'

export const removeCookies = async (response: NextResponse) => {
  response.cookies.delete(CookieEnum.ACCESS_TOKEN)
  response.cookies.delete(CookieEnum.REFRESH_TOKEN)
  response.cookies.delete(CookieEnum.EXPIRED_DATE)
  response.cookies.delete(CookieEnum.USER_CODE)
}
