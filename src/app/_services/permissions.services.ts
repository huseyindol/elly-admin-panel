import { unwrapOrThrow } from '@/lib/api/api-error'
import type { BaseResponse } from '@/types/BaseResponse'
import { fetcher } from '@/utils/services/fetcher'

/** GET /api/v1/users/me/permissions yanıtı (backend DtoUserPermissions). */
export interface UserPermissions {
  roles: string[]
  permissions: string[]
  permissionsByModule: Record<string, string[]>
}

/**
 * Kullanıcının rol/izinlerini SUNUCUDAN alır.
 *
 * Access token JWE (şifreli: alg=dir, enc=A256GCM) olduğu için client'ta `jwt.decode`
 * ile claim okunamaz → izinler bu endpoint'ten gelir. (Eski yöntem token'ı decode
 * etmeye çalışıyordu, JWE'de hep boş dönüyordu → tüm butonlar pasif kalıyordu.)
 */
export const getMyPermissionsService = async (): Promise<UserPermissions> => {
  const response: BaseResponse<UserPermissions> = await fetcher(
    '/api/v1/users/me/permissions',
    { method: 'GET' },
  )
  return unwrapOrThrow(response, 'İzinler alınamadı')
}
