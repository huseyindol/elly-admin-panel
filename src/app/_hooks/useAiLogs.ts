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

export function useAiLogs(params: AiLogListParams = {}) {
  return useQuery({
    queryKey: aiLogsKeys.list(params),
    queryFn: () => getAiLogsService(params),
    staleTime: 15_000,
  })
}

export function useAiStats() {
  return useQuery({
    queryKey: aiLogsKeys.stats(),
    queryFn: () => getAiStatsService(),
    staleTime: 15_000,
  })
}

export function useAiQuota(tenantId?: string | null) {
  return useQuery({
    queryKey: aiLogsKeys.quota(tenantId),
    queryFn: () => getAiQuotaService(tenantId),
    staleTime: 15_000,
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
