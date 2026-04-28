import { BaseResponse } from '@/types/BaseResponse'
import type {
  AdminRoleListResponse,
  AdminUserListResponse,
  AssignRolesRequest,
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
