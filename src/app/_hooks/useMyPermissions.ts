'use client'

import { useQuery } from '@tanstack/react-query'
import {
  getMyPermissionsService,
  type UserPermissions,
} from '../_services/permissions.services'

export const myPermissionsKey = ['me', 'permissions'] as const

/**
 * Kullanıcının izin/rol listesini sunucudan çeker (TanStack Query ile cache'li, tek istek).
 * `usePermission` bunu kullanır. Token JWE (şifreli) olduğundan izinler client'ta decode
 * edilemez — yetkili kaynak budur.
 */
export function useMyPermissions() {
  return useQuery<UserPermissions>({
    queryKey: myPermissionsKey,
    queryFn: getMyPermissionsService,
    staleTime: 5 * 60_000, // izinler sık değişmez
    gcTime: 10 * 60_000,
    retry: 1,
  })
}
