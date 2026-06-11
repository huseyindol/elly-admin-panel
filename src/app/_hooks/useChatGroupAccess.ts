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
  tenantToken?: string | null,
) {
  return useQuery({
    queryKey: chatKeys.access(groupId ?? ''),
    queryFn: () => getGroupAccessService(groupId!, tenantId, tenantToken),
    // TC grubu için token hazır olana kadar bekle
    enabled: !!groupId && (tenantId ? !!tenantToken : true),
    staleTime: 30_000,
  })
}
