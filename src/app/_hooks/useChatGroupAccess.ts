'use client'

import { getGroupAccessService } from '@/app/_services/chat.services'
import { useQuery } from '@tanstack/react-query'

export const chatKeys = {
  all: ['chat'] as const,
  access: (groupId: string) => [...chatKeys.all, 'access', groupId] as const,
}

export function useChatGroupAccess(
  groupId: string | null,
  tenantId?: string | null,
) {
  return useQuery({
    queryKey: chatKeys.access(groupId ?? ''),
    queryFn: () => getGroupAccessService(groupId!, tenantId),
    enabled: !!groupId,
    staleTime: 30_000,
  })
}
