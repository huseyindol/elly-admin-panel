import { BaseResponse } from '@/types/BaseResponse'
import type {
  AdminRoleListResponse,
  AdminUserListResponse,
  AssignRolesRequest,
  CreateTenantUserRequest,
  TenantUserListResponse,
  TenantUserResponse,
  UpdateProfileRequest,
  UpdateTenantUserRequest,
  UserProfileResponse,
} from '@/types/user-management'
import { fetcher } from '@/utils/services/fetcher'

// GET - Tüm kullanıcıları listele (users:manage — SUPER_ADMIN)
export const getUsersService = async () => {
  const response: AdminUserListResponse = await fetcher('/api/v1/users', {
    method: 'GET',
  })
  if (!response.result) {
    throw new Error(response.message ?? 'Kullanıcılar yüklenemedi')
  }
  return response
}

// GET - Kullanıcı detay (users:manage — SUPER_ADMIN)
export const getUserByIdService = async (id: number) => {
  const response: AdminUserListResponse = await fetcher(`/api/v1/users/${id}`, {
    method: 'GET',
  })
  if (!response.result) {
    throw new Error(response.message ?? 'Kullanıcı yüklenemedi')
  }
  return response
}

// GET - Kendi profil bilgileri (auth only)
export const getUserProfileService = async () => {
  const response: UserProfileResponse = await fetcher('/api/v1/users/me', {
    method: 'GET',
  })
  if (!response.result) {
    throw new Error(response.message ?? 'Profil bilgileri yüklenemedi')
  }
  return response
}

// GET - Tüm rolleri listele (roles:read)
export const getRolesService = async () => {
  const response: AdminRoleListResponse = await fetcher('/api/v1/roles', {
    method: 'GET',
  })
  if (!response.result) {
    throw new Error(response.message ?? 'Roller yüklenemedi')
  }
  return response
}

// PUT - Kendi profilini güncelle
export const updateUserProfileService = async (data: UpdateProfileRequest) => {
  const response: UserProfileResponse = await fetcher('/api/v1/users/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.result) {
    throw new Error(response.message ?? 'Profil güncellenemedi')
  }
  return response
}

// GET - Tenant kullanıcılarını listele
export const getTenantUsersService = async (tenantId: string) => {
  const response: TenantUserListResponse = await fetcher(
    `/api/v1/admin/tenants/${tenantId}/users`,
    { method: 'GET' },
  )
  if (!response.result) {
    throw new Error(response.message ?? 'Tenant kullanıcıları yüklenemedi')
  }
  return response
}

// POST - Yeni tenant kullanıcısı oluştur
export const createTenantUserService = async (
  tenantId: string,
  data: CreateTenantUserRequest,
) => {
  const response: TenantUserResponse = await fetcher(
    `/api/v1/admin/tenants/${tenantId}/users`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  )
  if (!response.result) {
    throw new Error(response.message ?? 'Kullanıcı oluşturulamadı')
  }
  return response
}

// PUT - Tenant kullanıcısını güncelle
export const updateTenantUserService = async (
  tenantId: string,
  userId: number,
  data: UpdateTenantUserRequest,
) => {
  const response: TenantUserResponse = await fetcher(
    `/api/v1/admin/tenants/${tenantId}/users/${userId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  )
  if (!response.result) {
    throw new Error(response.message ?? 'Kullanıcı güncellenemedi')
  }
  return response
}

// DELETE - Tenant kullanıcısını sil
export const deleteTenantUserService = async (
  tenantId: string,
  userId: number,
) => {
  const response: BaseResponse<null> = await fetcher(
    `/api/v1/admin/tenants/${tenantId}/users/${userId}`,
    { method: 'DELETE' },
  )
  if (!response.result) {
    throw new Error(response.message ?? 'Kullanıcı silinemedi')
  }
  return response
}

// PATCH - Tenant kullanıcısını aktif / pasif yap
export const updateTenantUserStatusService = async (
  tenantId: string,
  userId: number,
  isActive: boolean,
) => {
  const response: TenantUserResponse = await fetcher(
    `/api/v1/admin/tenants/${tenantId}/users/${userId}/status?isActive=${isActive}`,
    { method: 'PATCH' },
  )
  if (!response.result) {
    throw new Error(response.message ?? 'Durum güncellenemedi')
  }
  return response
}

// PUT - Kullanıcıya rol ata (users:manage — SUPER_ADMIN)
export const assignRolesService = async (
  userId: number,
  data: AssignRolesRequest,
) => {
  const response: BaseResponse<null> = await fetcher(
    `/api/v1/roles/users/${userId}/roles`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  )
  if (!response.result) {
    throw new Error(response.message ?? 'Rol ataması başarısız')
  }
  return response
}
