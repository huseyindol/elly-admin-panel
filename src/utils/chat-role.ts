import { getGlobalCookies } from '@/context/CookieContext'
import { CookieEnum } from '@/utils/constant/cookieConstant'
import type { RoleLevel } from '@/types/chat'

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return {}
  }
}

const ROLE_MAP: Record<string, RoleLevel> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1,
}

export function getMyRoleLevel(): RoleLevel {
  const token = getGlobalCookies()[CookieEnum.ACCESS_TOKEN]
  if (!token) return 1
  const payload = decodeJwtPayload(token)
  const roles: string[] = Array.isArray(payload.roles)
    ? (payload.roles as string[])
    : []
  let max: RoleLevel = 1
  for (const role of roles) {
    const level = ROLE_MAP[role] ?? 1
    if (level > max) max = level as RoleLevel
  }
  return max
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

// JWT sub claim'inden kullanıcı adını döner (Spring Boot sub = username)
export function getMyUsername(): string | null {
  const token = getGlobalCookies()[CookieEnum.ACCESS_TOKEN]
  if (!token) return null
  const payload = decodeJwtPayload(token)
  if (typeof payload.sub === 'string' && payload.sub) return payload.sub
  return null
}

// Backend kuralı: requesterLevel < 4 ise targetLevel < requesterLevel olmalı
export function canInvite(myLevel: RoleLevel, targetLevel: RoleLevel): boolean {
  if (myLevel >= 4) return true
  return targetLevel < myLevel
}
