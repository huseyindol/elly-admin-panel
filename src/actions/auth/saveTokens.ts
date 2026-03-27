'use server'
import { cookies } from 'next/headers'
import { CookieEnum } from '../../utils/constant/cookieConstant'

export const saveTokens = async (data: {
  token: string
  refreshToken: string
  expiredDate: number
  userCode: string
}) => {
  const cookieStore = await cookies()
  cookieStore.set(CookieEnum.ACCESS_TOKEN, data.token, {
    httpOnly: true,
    sameSite: 'strict',
  })
  cookieStore.set(CookieEnum.REFRESH_TOKEN, data.refreshToken, {
    httpOnly: true,
    sameSite: 'strict',
  })
  cookieStore.set(CookieEnum.EXPIRED_DATE, String(data.expiredDate), {
    httpOnly: true,
    sameSite: 'strict',
  })
  cookieStore.set(CookieEnum.USER_CODE, data.userCode, {
    httpOnly: true,
    sameSite: 'strict',
  })
}
