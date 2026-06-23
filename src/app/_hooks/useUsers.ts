'use client'

import {
  assignRolesService,
  deleteUserService,
  getRolesService,
  getUserProfileService,
  getUsersService,
  setUserStatusService,
  updateUserProfileService,
  type UsersAudience,
} from '@/app/_services/users.services'
import type {
  AssignRolesRequest,
  UpdateProfileRequest,
} from '@/types/user-management'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

/** Panel veya tenant kullanıcılarını listele. audience='panel' → SUPER_ADMIN/ADMIN/EDITOR/VIEWER; 'tenant' → TENANT. */
export function useUsers(audience?: UsersAudience) {
  return useQuery({
    queryKey: ['users', audience ?? 'all'],
    queryFn: () => getUsersService(audience),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/** Tüm rolleri listele */
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => getRolesService(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/** Kendi profil bilgileri */
export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: () => getUserProfileService(),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/** Profil güncelleme mutation */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateUserProfileService(data),
    onSuccess: () => {
      toast.success('Profil başarıyla güncellendi')
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Profil güncellenemedi')
    },
  })
}

/** Kullanıcı sil — DELETE /api/v1/users/{id} (users:manage). Backend self-delete + refresh-token cleanup yapar. */
export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => deleteUserService(userId),
    onSuccess: () => {
      toast.success('Kullanıcı silindi')
      // Hem panel hem tenant listesini yenile (audience'a göre cache anahtarları farklı)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Kullanıcı silinemedi')
    },
  })
}

/** Kullanıcı aktif/pasif toggle. Pasifleştirme = sessions iptal + cache invalidate (backend yapar). */
export function useSetUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) =>
      setUserStatusService(userId, isActive),
    onSuccess: () => {
      toast.success('Durum güncellendi')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Durum güncellenemedi')
    },
  })
}

/** Kullanıcıya rol atama mutation */
export function useAssignRoles() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: number
      data: AssignRolesRequest
    }) => assignRolesService(userId, data),
    onSuccess: () => {
      toast.success('Roller başarıyla atandı')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Rol ataması başarısız')
    },
  })
}
