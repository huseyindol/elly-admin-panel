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

/** PUT /api/v1/users/me request body */
export interface UpdateProfileRequest {
  firstName: string
  lastName: string
  email: string
}

/** Tenant kullanıcısı (GET /api/v1/admin/tenants/{tenantId}/users) */
export interface TenantUser {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  provider: string
  roles: string[]
  createdAt: string
}

/** POST /api/v1/admin/tenants/{tenantId}/users request body */
export interface CreateTenantUserRequest {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
}

/** PUT /api/v1/admin/tenants/{tenantId}/users/{id} request body */
export interface UpdateTenantUserRequest {
  firstName?: string
  lastName?: string
  email?: string
  isActive?: boolean
}

// Response type aliases
export type AdminUserListResponse = BaseResponse<AdminUser[]>
export type AdminUserResponse = BaseResponse<AdminUser>
export type AdminRoleListResponse = BaseResponse<AdminRole[]>
export type UserProfileResponse = BaseResponse<UserProfile>
export type TenantUserListResponse = BaseResponse<TenantUser[]>
export type TenantUserResponse = BaseResponse<TenantUser>
