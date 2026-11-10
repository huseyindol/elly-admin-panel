'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAiLogsService,
  getAiQuotaService,
  getAiStatsService,
  updateAiQuotaLimitService,
  type AiLogListParams,
  type AiQuotaLimitPayload,
} from '../_services/ai-logs.services'

export const aiLogsKeys = {
  all: ['ai-logs'] as const,
  list: (params: AiLogListParams) =>
    [...aiLogsKeys.all, 'list', params] as const,
  stats: () => [...aiLogsKeys.all, 'stats'] as const,
  quota: (tenantId?: string | null) =>
    [...aiLogsKeys.all, 'quota', tenantId ?? ''] as const,
}

/** S8: /ai/logs, /ai/stats, /ai/quota yalnız ADMIN + SUPER_ADMIN —
 *  yetkisiz rolde sorguyu hiç başlatma (403 toast'u ve boş istek önlenir). */
export function useAiLogs(params: AiLogListParams = {}, enabled = true) {
  return useQuery({
    queryKey: aiLogsKeys.list(params),
    queryFn: () => getAiLogsService(params),
    staleTime: 15_000,
    enabled,
  })
}

export function useAiStats(enabled = true) {
  return useQuery({
    queryKey: aiLogsKeys.stats(),
    queryFn: () => getAiStatsService(),
    staleTime: 15_000,
    enabled,
  })
}

export function useAiQuota(tenantId?: string | null, enabled = true) {
  return useQuery({
    queryKey: aiLogsKeys.quota(tenantId),
    queryFn: () => getAiQuotaService(tenantId),
    staleTime: 15_000,
    enabled,
  })
}

export function useUpdateAiQuotaLimit(tenantId?: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: AiQuotaLimitPayload) =>
      updateAiQuotaLimitService(payload, tenantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aiLogsKeys.quota(tenantId) })
    },
  })
}
