import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetcher } from '@/utils/services/fetcher'
import type { BaseResponse } from '@/types/BaseResponse'
import type { UserProfile } from '@/types/user-management'

/**
 * Kullanıcı kimlik bilgileri için zustand store.
 *
 * permission-store pattern'iyle aynı:
 *   - Login response'undan setUser ile dolar
 *   - localStorage'a persist edilir
 *   - Logout'ta clearUser ile sıfırlanır
 *
 * Avantajı: getMyUserId / getMyUsername gibi async helper'lar bu
 * store'u önce kontrol eder, dolu ise /api/v1/users/me'ye gitmeden
 * senkron değer döner. Reactive okuma için useMyUserId vb. hook'lar
 * kullanılır.
 */

export interface UserIdentity {
  id: number
  username: string
  email: string
  userCode: string
  firstName?: string
  lastName?: string
}

interface UserState {
  id: number | null
  username: string | null
  email: string | null
  userCode: string | null
  firstName: string | null
  lastName: string | null
  isLoaded: boolean

  /** Login veya refresh sonrası kullanıcıyı store'a yaz */
  setUser: (user: UserIdentity) => void

  /** Logout sırasında store'u temizle */
  clearUser: () => void

  /**
   * /api/v1/users/me'den güncel profili çekip store'u günceller.
   * Store boş veya bayatlamışsa çağrılır.
   */
  refreshUser: () => Promise<void>
}

export const useUserStore = create<UserState>()(
  persist(
    set => ({
      id: null,
      username: null,
      email: null,
      userCode: null,
      firstName: null,
      lastName: null,
      isLoaded: false,

      setUser: ({ id, username, email, userCode, firstName, lastName }) =>
        set({
          id,
          username,
          email,
          userCode,
          firstName: firstName ?? null,
          lastName: lastName ?? null,
          isLoaded: true,
        }),

      clearUser: () =>
        set({
          id: null,
          username: null,
          email: null,
          userCode: null,
          firstName: null,
          lastName: null,
          isLoaded: false,
        }),

      refreshUser: async () => {
        try {
          const response =
            await fetcher<BaseResponse<UserProfile>>('/api/v1/users/me')
          if (response.result && response.data) {
            // userCode /api/v1/users/me response'unda yok — yalnız login/refresh
            // çağrılarından gelir, mevcut değeri korunur.
            set(s => ({
              id: response.data.id,
              username: response.data.username,
              email: response.data.email,
              userCode: s.userCode,
              firstName: response.data.firstName ?? null,
              lastName: response.data.lastName ?? null,
              isLoaded: true,
            }))
          }
        } catch {
          // Sessizce hata yut — profil eski haliyle kalır
        }
      },
    }),
    {
      name: 'user-storage',
    },
  ),
)

// ---- Reactive hooks (component'lerde kullanılır) ----

/** Component'lerde reactive userId — store değişince re-render. */
export function useMyUserId(): number | null {
  return useUserStore(s => s.id)
}

export function useMyUsername(): string | null {
  return useUserStore(s => s.username)
}

export function useMyEmail(): string | null {
  return useUserStore(s => s.email)
}

export function useMyUserCode(): string | null {
  return useUserStore(s => s.userCode)
}

export function useMyFirstName(): string | null {
  return useUserStore(s => s.firstName)
}

export function useMyLastName(): string | null {
  return useUserStore(s => s.lastName)
}

export function useMyFullName(): string | null {
  return useUserStore(s => {
    const parts = [s.firstName, s.lastName].filter(Boolean)
    return parts.length > 0 ? parts.join(' ') : s.username
  })
}
