'use client'

import { BaseResponse } from '@/types/BaseResponse'
import { MailAccount } from '@/types/mail-account'
import { fetcher } from '@/utils/services/fetcher'
import { useQuery } from '@tanstack/react-query'

export function useMailAccounts() {
  return useQuery({
    queryKey: ['mail-accounts'],
    queryFn: async () => {
      const response: BaseResponse<MailAccount[]> = await fetcher(
        '/api/v1/mail-accounts',
        { method: 'GET' },
      )
      if (!response.result) {
        throw new Error(response.message ?? 'Mail hesapları yüklenemedi')
      }
      return response
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
