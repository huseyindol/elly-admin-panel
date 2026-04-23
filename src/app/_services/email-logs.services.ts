import { unwrapOrThrow } from '@/lib/api/api-error'
import type { BaseResponse } from '@/types/BaseResponse'
import type { EmailLog, EmailLogStatus, Page } from '@/types/cms'
import { fetcher } from '@/utils/services/fetcher'

const BASE = '/api/v1/emails'

export interface EmailLogListParams {
  status?: EmailLogStatus
  page?: number
  size?: number
}

export const getEmailLogsService = async (params: EmailLogListParams = {}) => {
  const search = new URLSearchParams()
  if (params.status) search.set('status', params.status)
  if (params.page != null) search.set('page', String(params.page))
  if (params.size != null) search.set('size', String(params.size))

  const query = search.toString()
  const response: BaseResponse<Page<EmailLog>> = await fetcher(
    `${BASE}${query ? `?${query}` : ''}`,
    { method: 'GET' },
  )
  return unwrapOrThrow(response, 'Email logları alınamadı')
}

export const retryEmailLogService = async (id: number) => {
  const response: BaseResponse<EmailLog> = await fetcher(
    `${BASE}/${id}/retry`,
    { method: 'POST' },
  )
  return unwrapOrThrow(response, 'Mail yeniden kuyruğa alınamadı')
}

export const getEmailTemplatesClasspathService = async () => {
  const response: BaseResponse<string[]> = await fetcher(`${BASE}/templates`, {
    method: 'GET',
  })
  return unwrapOrThrow(response, 'Template listesi alınamadı')
}
