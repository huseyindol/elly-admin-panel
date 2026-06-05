'use client'

import { useMemo } from 'react'
import type { Permission } from '@/types/cms'
import { useMyPermissions } from './useMyPermissions'

/**
 * Client-side permission kontrolü (UI buton disable / tooltip / gate).
 *
 * Kaynak: GET /api/v1/users/me/permissions (sunucu). Access token JWE (şifreli:
 * alg=dir, enc=A256GCM) olduğundan client'ta decode EDİLEMEZ — bu yüzden izinler
 * token'dan değil endpoint'ten alınır. İzinler yüklenene kadar `false` döner
 * (buton kısa süre disabled kalır, veri gelince aktifleşir).
 */
export function usePermission(required: Permission | string): boolean {
  const { data } = useMyPermissions()
  return useMemo(
    () => (data?.permissions ?? []).includes(required as string),
    [data, required],
  )
}

/**
 * Birden fazla permission kontrolü — map şeklinde döner.
 * `const { canRead, canManage } = usePermissions({ canRead: 'rabbit:read', ... })`
 */
export function usePermissions<K extends string>(
  map: Record<K, Permission | string>,
): Record<K, boolean> {
  const { data } = useMyPermissions()
  return useMemo(() => {
    const perms = data?.permissions ?? []
    const result = {} as Record<K, boolean>
    for (const key in map) {
      result[key] = perms.includes(map[key] as string)
    }
    return result
  }, [data, map])
}
