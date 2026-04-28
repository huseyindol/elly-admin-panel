import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetcher } from '@/utils/services/fetcher'
import type { UserPermissions } from '@/types/permissions'
import type { BaseResponse } from '@/types/BaseResponse'

interface PermissionState {
  roles: string[]
  permissions: string[]
  isLoaded: boolean

  /** Login veya refresh sonrası izinleri store'a yaz */
  setPermissions: (roles: string[], permissions: string[]) => void

  /** Logout sırasında store'u temizle */
  clearPermissions: () => void

  /**
   * Backend'den güncel izinleri çek ve store'u güncelle.
   * Rol değişikliği sonrası çağrılmalıdır.
   */
  refreshPermissions: () => Promise<void>
}

export const usePermissionStore = create<PermissionState>()(
  persist(
    set => ({
      roles: [],
      permissions: [],
      isLoaded: false,

      setPermissions: (roles, permissions) =>
        set({ roles, permissions, isLoaded: true }),

      clearPermissions: () =>
        set({ roles: [], permissions: [], isLoaded: false }),

      refreshPermissions: async () => {
        try {
          const response = await fetcher<BaseResponse<UserPermissions>>(
            '/api/v1/users/me/permissions',
          )
          if (response.result && response.data) {
            set({
              roles: response.data.roles ?? [],
              permissions: response.data.permissions ?? [],
              isLoaded: true,
            })
          }
        } catch {
          // Sessizce hata yut — izinler eski haliyle kalır
        }
      },
    }),
    {
      name: 'permission-storage',
    },
  ),
)
