'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { CookieEnum } from '../../utils/constant/cookieConstant'

export const logout = async () => {
  const cookieStore = await cookies()
  cookieStore.set(CookieEnum.ACCESS_TOKEN, '', {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 0,
  })
  cookieStore.set(CookieEnum.REFRESH_TOKEN, '', {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 0,
  })
  cookieStore.set(CookieEnum.EXPIRED_DATE, '', {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 0,
  })
  cookieStore.set(CookieEnum.USER_CODE, '', {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 0,
  })
  redirect('/admin/login')
}
