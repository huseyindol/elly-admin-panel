import { useEffect, useMemo } from 'react'
import { fetcher } from '@/utils/services/fetcher'
import { usePermissionStore } from '@/stores/permission-store'
import { useUserStore } from '@/stores/user-store'
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

/**
 * Reactive rol seviyesi hook'u — permission-store roller dolunca
 * component otomatik re-render olur. Store boşsa arka planda
 * refreshPermissions tetiklenir.
 *
 * Bu hook'u tercih et: `useState + useEffect(getMyRoleLevel().then(...))`
 * pattern'i ilk render'da 1 döndürür ve refresh çağrısı başarısız
 * olursa orada takılı kalır. Reactive hook store değişimini izler.
 */
export function useMyRoleLevel(): RoleLevel {
  const roles = usePermissionStore(s => s.roles)
  const isLoaded = usePermissionStore(s => s.isLoaded)

  useEffect(() => {
    if (!isLoaded) {
      usePermissionStore.getState().refreshPermissions()
    }
  }, [isLoaded])

  return useMemo(() => rolesToLevel(roles), [roles])
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

/**
 * Numeric userId döner. Önce zustand user-store'a bakar (login/refresh
 * sonrası dolar), yoksa /api/v1/users/me fetch eder. Component dışı
 * (chat-ws-store gibi async kontekstler) için.
 */
export async function getMyUserId(): Promise<number | null> {
  const stored = useUserStore.getState().id
  if (stored !== null) return stored
  const profile = await fetchMyProfile()
  return profile?.id ?? null
}

/** Username döner — önce store, sonra /api/v1/users/me fallback. */
export async function getMyUsername(): Promise<string | null> {
  const stored = useUserStore.getState().username
  if (stored !== null) return stored
  const profile = await fetchMyProfile()
  return profile?.username ?? null
}

/**
 * TC ban anahtarı — GUEST (sessionId) için `s:<id>`, VISITOR (visitorId) için
 * `v:<id>`. Banlanamayan (ADMIN) için null. Store + ChatWindow ortak kullanır.
 */
export function banKey(
  sessionId: string | null | undefined,
  visitorId: number | null | undefined,
): string | null {
  if (sessionId) return `s:${sessionId}`
  if (visitorId != null) return `v:${visitorId}`
  return null
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

/** Backend kuralı: requesterLevel < 4 ise targetLevel <= requesterLevel olmalı
 *  (kendi seviyesi ve altı davet edilebilir; SUPER_ADMIN herkesi). */
export function canInvite(myLevel: RoleLevel, targetLevel: RoleLevel): boolean {
  if (myLevel >= 4) return true
  return targetLevel <= myLevel
}
