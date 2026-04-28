'use client'

import { usePermission } from '@/hooks/usePermission'
import type { Action } from '@/types/permissions'

interface PermissionGateProps {
  /** Direkt permission string: 'posts:create' */
  permission?: string
  /** Modül adı ('posts', 'pages', ...) — action ile birlikte kullanılır */
  module?: string
  /** Aksiyon ('create', 'read', ...) — module ile birlikte kullanılır */
  action?: Action
  /** Bu izinlerden herhangi birine sahipse göster */
  any?: string[]
  /** İzin yoksa gösterilecek alternatif içerik */
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGate({
  permission,
  module,
  action,
  any,
  fallback = null,
  children,
}: Readonly<PermissionGateProps>) {
  const { hasPermission, canAccess, hasAnyPermission, isSuperAdmin } =
    usePermission()

  // SUPER_ADMIN her şeyi görür
  if (isSuperAdmin()) return <>{children}</>

  let allowed = false

  if (permission) {
    allowed = hasPermission(permission)
  } else if (module && action) {
    allowed = canAccess(module, action)
  } else if (any && any.length > 0) {
    allowed = hasAnyPermission(...any)
  }

  return allowed ? <>{children}</> : <>{fallback}</>
}
