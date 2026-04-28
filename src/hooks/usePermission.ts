'use client'

import { usePermissionStore } from '@/stores/permission-store'
import type { Action } from '@/types/permissions'

export function usePermission() {
  const permissions = usePermissionStore(s => s.permissions)
  const roles = usePermissionStore(s => s.roles)

  /** Tek bir izni kontrol et: hasPermission('posts:create') */
  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission)
  }

  /** Verilen izinlerden en az birinin olup olmadığını kontrol et */
  const hasAnyPermission = (...perms: string[]): boolean => {
    return perms.some(p => permissions.includes(p))
  }

  /** Verilen tüm izinlerin olup olmadığını kontrol et */
  const hasAllPermissions = (...perms: string[]): boolean => {
    return perms.every(p => permissions.includes(p))
  }

  /** Modül + aksiyon bazlı kontrol: canAccess('posts', 'create') */
  const canAccess = (module: string, action: Action): boolean => {
    return permissions.includes(`${module}:${action}`)
  }

  /** Modüle herhangi bir erişim var mı? (sidebar menü gösterimi için) */
  const canAccessModule = (module: string): boolean => {
    return permissions.some(p => p.startsWith(`${module}:`))
  }

  /** Rol kontrolü: hasRole('SUPER_ADMIN') */
  const hasRole = (role: string): boolean => {
    return roles.includes(role)
  }

  /** Süper admin mi? */
  const isSuperAdmin = (): boolean => {
    return roles.includes('SUPER_ADMIN')
  }

  return {
    permissions,
    roles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    canAccessModule,
    hasRole,
    isSuperAdmin,
  }
}
