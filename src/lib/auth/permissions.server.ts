import 'server-only'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { CookieEnum } from '@/utils/constant/cookieConstant'
import type { Permission } from '@/types/cms'
import { extractPermissionsFromToken } from './permissions'

/**
 * Server Component / Server Action / Route Handler içinde kullanılır.
 * JWT cookie'sini okur, permissions claim'i kontrol eder, yoksa
 * login / 403 sayfasına yönlendirir. Redirect'ler Next.js'in
 * `NEXT_REDIRECT` throw'una dönüşür, yakalama.
 */
export async function requirePermission(
  permission: Permission | string,
  options: { redirectTo?: string; forbiddenTo?: string } = {},
): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(CookieEnum.ACCESS_TOKEN)?.value

  if (!token) {
    redirect(options.redirectTo ?? '/login')
  }

  const perms = extractPermissionsFromToken(token)
  if (!perms.includes(permission)) {
    redirect(options.forbiddenTo ?? '/403')
  }
}

export async function getCurrentPermissions(): Promise<string[]> {
  const cookieStore = await cookies()
  const token = cookieStore.get(CookieEnum.ACCESS_TOKEN)?.value
  if (!token) return []
  return extractPermissionsFromToken(token)
}

export async function hasPermissionServer(
  permission: Permission | string,
): Promise<boolean> {
  const perms = await getCurrentPermissions()
  return perms.includes(permission)
}
