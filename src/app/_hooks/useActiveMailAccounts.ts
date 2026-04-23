'use client'

import { getActiveMailAccountsService } from '@/app/_services/mail-accounts.services'
import { useQuery } from '@tanstack/react-query'

export function useActiveMailAccounts() {
  return useQuery({
    queryKey: ['mail-accounts', 'active'],
    queryFn: getActiveMailAccountsService,
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
  })
}
