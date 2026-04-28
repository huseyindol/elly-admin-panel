import { BaseResponse } from './BaseResponse'

/** GET /api/v1/users response'undan gelen kullanıcı */
export interface AdminUser {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  provider: string
  isActive: boolean
  managedTenants: string[]
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
  managedTenants: string[]
  roles: string[]
  createdAt: string
}

// Response type aliases
export type AdminUserListResponse = BaseResponse<AdminUser[]>
export type AdminUserResponse = BaseResponse<AdminUser>
export type AdminRoleListResponse = BaseResponse<AdminRole[]>
export type UserProfileResponse = BaseResponse<UserProfile>
