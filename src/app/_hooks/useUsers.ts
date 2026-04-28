'use client'

import {
  assignRolesService,
  getRolesService,
  getUserProfileService,
  getUsersService,
} from '@/app/_services/users.services'
import type { AssignRolesRequest } from '@/types/user-management'
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
