import 'server-only'

import { cookies } from 'next/headers'
import { CookieEnum } from '@/utils/constant/cookieConstant'
import type { Permission } from '@/types/cms'
import { extractPermissionsFromToken } from './permissions'

/**
 * Server Component / Server Action / Route Handler içinde kullanılır.
 * JWT cookie'sini okur, permissions claim'i kontrol eder, yoksa
 * login / 403 sayfasına yönlendirir. Redirect'ler Next.js'in
 * `NEXT_REDIRECT` throw'una dönüşür, yakalama.
 *
 * TODO: Permission kontrolü şu an devre dışı. Gerçek koruma BE endpoint'lerinde.
 * İleride frontend izin kontrolleri aktif edilecek.
 */
export async function requirePermission(
  _permission: Permission | string,
  _options: { redirectTo?: string; forbiddenTo?: string } = {},
): Promise<void> {
  // Bypass: asıl koruma backend tarafında, frontend kontrolü ileride aktif edilecek
}

export async function getCurrentPermissions(): Promise<string[]> {
  const cookieStore = await cookies()
  const token = cookieStore.get(CookieEnum.ACCESS_TOKEN)?.value
  if (!token) return []
  return extractPermissionsFromToken(token)
}

export async function hasPermissionServer(
  _permission: Permission | string,
): Promise<boolean> {
  // Bypass: asıl koruma backend tarafında, frontend kontrolü ileride aktif edilecek
  return true
}
