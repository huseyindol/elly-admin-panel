'use client'

import { useQuery } from '@tanstack/react-query'
import {
  getAiLogsService,
  getAiStatsService,
  type AiLogListParams,
} from '../_services/ai-logs.services'

export const aiLogsKeys = {
  all: ['ai-logs'] as const,
  list: (params: AiLogListParams) =>
    [...aiLogsKeys.all, 'list', params] as const,
  stats: () => [...aiLogsKeys.all, 'stats'] as const,
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
