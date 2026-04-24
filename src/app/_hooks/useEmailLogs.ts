'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api/api-error'
import {
  getEmailLogsService,
  retryEmailLogService,
  type EmailLogListParams,
} from '../_services/email-logs.services'

export const emailLogsKeys = {
  all: ['email-logs'] as const,
  list: (params: EmailLogListParams) =>
    [...emailLogsKeys.all, 'list', params] as const,
}

export function useEmailLogs(params: EmailLogListParams = {}) {
  return useQuery({
    queryKey: emailLogsKeys.list(params),
    queryFn: () => getEmailLogsService(params),
    staleTime: 30_000,
  })
}

export function useRetryEmail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => retryEmailLogService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: emailLogsKeys.all })
      toast.success('Mail yeniden kuyruğa alındı')
    },
    onError: (err: Error) => {
      if (err instanceof ApiError) {
        if (err.isValidation) {
          toast.error('Bu mail retry edilemez (zaten gönderilmiş olabilir)')
          return
        }
        if (err.isForbidden) {
          toast.error('Bu işlem için yetkin yok')
          return
        }
      }
      toast.error(err.message || 'Mail yeniden kuyruğa alınamadı')
    },
  })
}
