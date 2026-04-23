'use client'

import { useMemo } from 'react'
import { useCookie } from '@/context/CookieContext'
import { CookieEnum } from '@/utils/constant/cookieConstant'
import type { Permission } from '@/types/cms'
import { extractPermissionsFromToken } from '@/lib/auth/permissions'

/**
 * Client-side permission kontrolü. UI'da buton disable / tooltip / route
 * guard için kullanılır. Kaynak: `accessToken` cookie'sindeki JWT claim'leri.
 */
export function usePermission(required: Permission | string): boolean {
  const { cookies } = useCookie()
  const token = cookies[CookieEnum.ACCESS_TOKEN]

  return useMemo(() => {
    if (!token) return false
    return extractPermissionsFromToken(token).includes(required)
  }, [token, required])
}

/**
 * Birden fazla permission kontrolü — map şeklinde döner.
 * `const { canRead, canManage } = usePermissions({ canRead: 'rabbit:read', ... })`
 */
export function usePermissions<K extends string>(
  map: Record<K, Permission | string>,
): Record<K, boolean> {
  const { cookies } = useCookie()
  const token = cookies[CookieEnum.ACCESS_TOKEN]

  return useMemo(() => {
    const perms = token ? extractPermissionsFromToken(token) : []
    const result = {} as Record<K, boolean>
    for (const key in map) {
      result[key] = perms.includes(map[key])
    }
    return result
  }, [token, map])
}
