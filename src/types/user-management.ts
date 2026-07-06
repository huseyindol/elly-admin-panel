import { BaseResponse } from './BaseResponse'

/** GET /api/v1/users response'undan gelen kullanıcı. Hem panel hem tenant audience aynı şekle döner. */
export interface AdminUser {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  provider: string
  isActive: boolean
  roles: string[]
  createdAt: string
}

/** GET /api/v1/roles response'undan gelen rol izni */
export interface AdminRolePermission {
  id: number
  name: string
  description: string
  module: string
}

/** GET /api/v1/roles response'undan gelen rol */
export interface AdminRole {
  id: number
  name: string
  description: string
  permissions: AdminRolePermission[]
}

/** PUT /api/v1/roles/users/{userId}/roles request body */
export interface AssignRolesRequest {
  roleIds: number[]
}

/** GET /api/v1/users/me response'u */
export interface UserProfile {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  provider: string
  isActive: boolean
  roles: string[]
  createdAt: string
}

/** PUT /api/v1/users/me request body */
export interface UpdateProfileRequest {
  firstName: string
  lastName: string
  email: string
}

/** POST /api/v1/users request body — panel'den kullanıcı yaratma.
 *  audience='panel' (default): roleIds/ADMIN default + panel domain doğrulama maili.
 *  audience='tenant': TENANT rolü otomatik + o tenant'ın kendi domain'inden mail. */
export interface CreateUserRequest {
  username: string
  email: string
  password: string
  firstName?: string
  lastName?: string
  /** Atanacak rol ID'leri (yalnız audience='panel'). Boşsa backend ADMIN default'unu atar. */
  roleIds?: number[]
  audience?: 'panel' | 'tenant'
}

/** PUT /api/v1/users/{id} request body — admin'in başka kullanıcıyı güncellemesi.
 *  Tüm alanlar opsiyonel; yalnız dolu gönderilenler uygulanır. */
export interface AdminUpdateUserRequest {
  username?: string
  email?: string
  firstName?: string
  lastName?: string
  /** Dolu gönderilirse admin şifre sıfırlaması — kullanıcının açık oturumları sonlanır. */
  newPassword?: string
}

// Response type aliases
export type AdminUserListResponse = BaseResponse<AdminUser[]>
export type AdminUserResponse = BaseResponse<AdminUser>
export type AdminRoleListResponse = BaseResponse<AdminRole[]>
export type UserProfileResponse = BaseResponse<UserProfile>
