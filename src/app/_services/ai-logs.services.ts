import { unwrapOrThrow } from '@/lib/api/api-error'
import type { BaseResponse } from '@/types/BaseResponse'
import type { Page } from '@/types/cms'
import { fetcher } from '@/utils/services/fetcher'

const BASE = '/api/v1/ai'

export type AiLogStatus = 'SUCCESS' | 'ERROR'

export interface AiUsageLog {
  id: number
  createdAt: string
  requestId: string
  stepOrder: number
  endpoint: string
  action: string
  model: string
  username: string | null
  tenantId: string | null
  userInput: string | null
  promptText: string | null
  responseText: string | null
  parsedOutput: string | null
  promptChars: number
  responseChars: number
  inputTokens: number
  outputTokens: number
  thoughtTokens: number
  cachedTokens: number
  totalTokens: number
  durationMs: number
  status: AiLogStatus
  httpStatus: number | null
  errorCode: string | null
  errorMessage: string | null
}

export interface AiActionStat {
  action: string
  endpoint: string
  callCount: number
  successCount: number
  errorCount: number
  inputTokens: number
  outputTokens: number
  thoughtTokens: number
  totalTokens: number
  avgDurationMs: number
}

export interface AiUsageStats {
  totalCalls: number
  successCalls: number
  errorCalls: number
  totalInputTokens: number
  totalOutputTokens: number
  totalThoughtTokens: number
  totalCachedTokens: number
  totalTokens: number
  avgDurationMs: number
  byAction: AiActionStat[]
}

export interface AiLogListParams {
  action?: string
  status?: AiLogStatus
  username?: string
  q?: string
  page?: number
  size?: number
}

export const getAiLogsService = async (params: AiLogListParams = {}) => {
  const search = new URLSearchParams()
  if (params.action) search.set('action', params.action)
  if (params.status) search.set('status', params.status)
  if (params.username) search.set('username', params.username)
  if (params.q) search.set('q', params.q)
  if (params.page != null) search.set('page', String(params.page))
  if (params.size != null) search.set('size', String(params.size))

  const query = search.toString()
  const response: BaseResponse<Page<AiUsageLog>> = await fetcher(
    `${BASE}/logs${query ? `?${query}` : ''}`,
    { method: 'GET' },
  )
  return unwrapOrThrow(response, 'AI kullanım logları alınamadı')
}

export const getAiLogByIdService = async (id: number) => {
  const response: BaseResponse<AiUsageLog> = await fetcher(
    `${BASE}/logs/${id}`,
    { method: 'GET' },
  )
  return unwrapOrThrow(response, 'AI log detayı alınamadı')
}

export interface AiQuota {
  tenantId: string
  monthlyTokenLimit: number
  monthlyTokensUsed: number
  monthlyTokensRemaining: number
  monthlyTokenUsedPercent: number
  dailyRequestLimit: number
  dailyRequestsUsed: number
  dailyRequestsRemaining: number
  dailyRequestUsedPercent: number
  dailyTokensUsed: number
  monthlyInputTokens: number
  monthlyOutputTokens: number
  monthlyThoughtTokens: number
  monthlyCachedTokens: number
  monthlyEstimatedCostUsd: number
  totalEstimatedCostUsd: number
}

export interface AiQuotaLimitPayload {
  monthlyTokenLimit?: number
  dailyRequestLimit?: number
}

const quotaPath = (tenantId?: string | null) =>
  tenantId ? `${BASE}/tenant/${tenantId}/quota` : `${BASE}/quota`

export const getAiStatsService = async () => {
  const response: BaseResponse<AiUsageStats> = await fetcher(`${BASE}/stats`, {
    method: 'GET',
  })
  return unwrapOrThrow(response, 'AI kullanım istatistikleri alınamadı')
}

export const getAiQuotaService = async (
  tenantId?: string | null,
): Promise<AiQuota> => {
  const response: BaseResponse<AiQuota> = await fetcher(quotaPath(tenantId), {
    method: 'GET',
  })
  return unwrapOrThrow(response, 'AI kota bilgisi alınamadı')
}

export const updateAiQuotaLimitService = async (
  payload: AiQuotaLimitPayload,
  tenantId?: string | null,
): Promise<AiQuota> => {
  const response: BaseResponse<AiQuota> = await fetcher(
    `${quotaPath(tenantId)}/limit`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )
  return unwrapOrThrow(response, 'AI kota limiti güncellenemedi')
}
