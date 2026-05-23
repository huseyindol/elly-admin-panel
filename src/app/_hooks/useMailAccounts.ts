'use client'

import { getMailAccountsService } from '@/app/_services/mail-accounts.services'
import { useQuery } from '@tanstack/react-query'

export function useMailAccounts(tenantId?: string) {
  return useQuery({
    queryKey: ['mail-accounts', tenantId ?? ''],
    queryFn: () => getMailAccountsService(tenantId),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
