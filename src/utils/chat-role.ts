import { fetcher } from '@/utils/services/fetcher'
import { usePermissionStore } from '@/stores/permission-store'
import type { BaseResponse } from '@/types/BaseResponse'
import type { UserProfile } from '@/types/user-management'
import type { RoleLevel } from '@/types/chat'

/**
 * NOT: Bu projedeki JWT, JWE (encrypted) formatında — `atob` ile decode edilemez.
 * Ayrıca JWT claims'te rol bilgisi taşınmıyor (yalnızca userId, tokenVersion vb.).
 *
 * Rol seviyesi ve kullanıcı bilgileri backend'e sorularak alınır:
 *   - GET /api/v1/users/me/permissions  → roles[] (permission-store kullanır)
 *   - GET /api/v1/users/me              → id, username
 */

const ROLE_LEVEL_MAP: Record<string, RoleLevel> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1,
}

// Sayfa ömrü boyunca tek seferlik fetch için cache
let cachedProfile: UserProfile | null = null
let profilePromise: Promise<UserProfile | null> | null = null

function rolesToLevel(roles: string[]): RoleLevel {
  let max: RoleLevel = 1
  for (const role of roles) {
    const level = ROLE_LEVEL_MAP[role] ?? 1
    if (level > max) max = level as RoleLevel
  }
  return max
}

/**
 * Backend'den (permission-store üzerinden) kullanıcının en yüksek rol seviyesini döndürür.
 * Store yüklenmemişse `refreshPermissions()` tetiklenir.
 */
export async function getMyRoleLevel(): Promise<RoleLevel> {
  const store = usePermissionStore.getState()
  if (store.isLoaded) return rolesToLevel(store.roles)

  try {
    await store.refreshPermissions()
    return rolesToLevel(usePermissionStore.getState().roles)
  } catch {
    return 1
  }
}

/** Senkron erişim — store hazırsa rol döner, değilse VIEWER (1) varsayar. */
export function getMyRoleLevelSync(): RoleLevel {
  const store = usePermissionStore.getState()
  return rolesToLevel(store.roles)
}

async function fetchMyProfile(): Promise<UserProfile | null> {
  if (cachedProfile) return cachedProfile
  if (profilePromise) return profilePromise

  profilePromise = (async () => {
    try {
      const res = await fetcher<BaseResponse<UserProfile>>('/api/v1/users/me', {
        method: 'GET',
      })
      if (res.result && res.data) {
        cachedProfile = res.data
        return cachedProfile
      }
      return null
    } catch {
      return null
    } finally {
      profilePromise = null
    }
  })()

  return profilePromise
}

/** /api/v1/users/me'den numeric userId döndürür (cache'li). */
export async function getMyUserId(): Promise<number | null> {
  const profile = await fetchMyProfile()
  return profile?.id ?? null
}

/** /api/v1/users/me'den username döndürür (cache'li). */
export async function getMyUsername(): Promise<string | null> {
  const profile = await fetchMyProfile()
  return profile?.username ?? null
}

export function visibilityLabel(level: number): string {
  const labels: Record<number, string> = {
    1: 'Herkese Açık',
    2: 'Editor+',
    3: 'Admin+',
    4: 'Gizli',
  }
  return labels[level] ?? 'Bilinmiyor'
}

/** Backend kuralı: requesterLevel < 4 ise targetLevel < requesterLevel olmalı */
export function canInvite(myLevel: RoleLevel, targetLevel: RoleLevel): boolean {
  if (myLevel >= 4) return true
  return targetLevel < myLevel
}
