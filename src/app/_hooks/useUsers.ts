'use client'

import {
  assignRolesService,
  createTenantUserService,
  deleteTenantUserService,
  getRolesService,
  getTenantUsersService,
  getUserProfileService,
  getUsersService,
  updateTenantUserService,
  updateTenantUserStatusService,
  updateUserProfileService,
} from '@/app/_services/users.services'
import type {
  AssignRolesRequest,
  CreateTenantUserRequest,
  UpdateProfileRequest,
  UpdateTenantUserRequest,
} from '@/types/user-management'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

/** Tüm kullanıcıları listele (SUPER_ADMIN) */
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => getUsersService(),
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

/** Tenant kullanıcılarını listele */
export function useTenantUsers(tenantId: string | null) {
  return useQuery({
    queryKey: ['tenant-users', tenantId],
    queryFn: () => getTenantUsersService(tenantId!),
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000,
  })
}

/** Yeni tenant kullanıcısı oluştur */
export function useCreateTenantUser(tenantId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTenantUserRequest) => {
      if (!tenantId) throw new Error('Tenant seçili değil')
      return createTenantUserService(tenantId, data)
    },
    onSuccess: () => {
      toast.success('Kullanıcı başarıyla oluşturuldu')
      queryClient.invalidateQueries({ queryKey: ['tenant-users', tenantId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Kullanıcı oluşturulamadı')
    },
  })
}

/** Tenant kullanıcısını güncelle */
export function useUpdateTenantUser(tenantId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: number
      data: UpdateTenantUserRequest
    }) => {
      if (!tenantId) throw new Error('Tenant seçili değil')
      return updateTenantUserService(tenantId, userId, data)
    },
    onSuccess: () => {
      toast.success('Kullanıcı başarıyla güncellendi')
      queryClient.invalidateQueries({ queryKey: ['tenant-users', tenantId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Kullanıcı güncellenemedi')
    },
  })
}

/** Tenant kullanıcısını sil */
export function useDeleteTenantUser(tenantId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => {
      if (!tenantId) throw new Error('Tenant seçili değil')
      return deleteTenantUserService(tenantId, userId)
    },
    onSuccess: () => {
      toast.success('Kullanıcı silindi')
      queryClient.invalidateQueries({ queryKey: ['tenant-users', tenantId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Kullanıcı silinemedi')
    },
  })
}

/** Tenant kullanıcısını aktif / pasif yap */
export function useUpdateTenantUserStatus(tenantId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      isActive,
    }: {
      userId: number
      isActive: boolean
    }) => {
      if (!tenantId) throw new Error('Tenant seçili değil')
      return updateTenantUserStatusService(tenantId, userId, isActive)
    },
    onSuccess: () => {
      toast.success('Durum güncellendi')
      queryClient.invalidateQueries({ queryKey: ['tenant-users', tenantId] })
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
