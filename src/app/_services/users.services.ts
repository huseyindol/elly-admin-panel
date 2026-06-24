import { BaseResponse } from '@/types/BaseResponse'
import type {
  AdminRoleListResponse,
  AdminUserListResponse,
  AdminUserResponse,
  AssignRolesRequest,
  CreateUserRequest,
  UpdateProfileRequest,
  UserProfileResponse,
} from '@/types/user-management'
import { fetcher } from '@/utils/services/fetcher'

/** Audience: 'panel' → SUPER_ADMIN/ADMIN/EDITOR/VIEWER; 'tenant' → TENANT; undefined → hepsi. */
export type UsersAudience = 'panel' | 'tenant'

// GET - Tüm kullanıcıları listele (users:manage — SUPER_ADMIN + ADMIN)
export const getUsersService = async (audience?: UsersAudience) => {
  const qs = audience ? `?audience=${audience}` : ''
  const response: AdminUserListResponse = await fetcher(`/api/v1/users${qs}`, {
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

// POST - Admin user yaratma (users:manage — SUPER_ADMIN). roleIds verilmezse backend ADMIN default'unu atar.
export const createUserService = async (data: CreateUserRequest) => {
  const response: AdminUserResponse = await fetcher('/api/v1/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.result) {
    throw new Error(response.message ?? 'Kullanıcı oluşturulamadı')
  }
  return response
}

// DELETE - Kullanıcıyı sil (users:manage — SUPER_ADMIN / ADMIN). Kendi hesabını silemez (backend guard).
export const deleteUserService = async (id: number) => {
  const response: BaseResponse<null> = await fetcher(`/api/v1/users/${id}`, {
    method: 'DELETE',
  })
  if (!response.result) {
    throw new Error(response.message ?? 'Kullanıcı silinemedi')
  }
  return response
}

// PATCH - Kullanıcı aktif/pasif (users:manage). Kendi hesabını pasifleştiremez (backend guard).
export const setUserStatusService = async (id: number, isActive: boolean) => {
  const response: AdminUserResponse = await fetcher(
    `/api/v1/users/${id}/status?isActive=${isActive}`,
    { method: 'PATCH' },
  )
  if (!response.result) {
    throw new Error(response.message ?? 'Durum güncellenemedi')
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
