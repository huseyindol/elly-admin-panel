import jwt from 'jsonwebtoken'
import { logger } from '@/lib/logger'
import type { Permission } from '@/types/cms'

interface JwtPermissionClaims {
  permissions?: string[]
  authorities?: string[] | { authority: string }[]
  scope?: string
  roles?: string[]
  [key: string]: unknown
}

/**
 * JWT'den `permissions` / `authorities` / `scope` / `roles` claim'lerini
 * çıkaran dayanıklı parser. Spring Security farklı JWT encoder'larla farklı
 * alan adları kullanabildiği için hepsini kabul ediyoruz.
 */
export function extractPermissionsFromToken(token: string): string[] {
  if (!token) return []
  try {
    const decoded = jwt.decode(token) as JwtPermissionClaims | null
    if (!decoded) return []

    const fromPermissions = Array.isArray(decoded.permissions)
      ? decoded.permissions
      : []

    const fromAuthorities = Array.isArray(decoded.authorities)
      ? decoded.authorities.map(a =>
          typeof a === 'string' ? a : (a?.authority ?? ''),
        )
      : []

    const fromScope =
      typeof decoded.scope === 'string'
        ? decoded.scope.split(/\s+/).filter(Boolean)
        : []

    const fromRoles = Array.isArray(decoded.roles) ? decoded.roles : []

    return Array.from(
      new Set(
        [...fromPermissions, ...fromAuthorities, ...fromScope, ...fromRoles]
          .filter(Boolean)
          .map(String),
      ),
    )
  } catch (err) {
    logger.warn('JWT decode başarısız (permissions)', err)
    return []
  }
}

export function tokenHasPermission(
  token: string | null | undefined,
  required: Permission | string,
): boolean {
  if (!token) return false
  const perms = extractPermissionsFromToken(token)
  return perms.includes(required)
}
