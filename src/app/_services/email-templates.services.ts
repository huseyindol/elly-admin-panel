import { unwrapOrThrow } from '@/lib/api/api-error'
import type { BaseResponse } from '@/types/BaseResponse'
import type {
  EmailTemplate,
  EmailTemplateCreateRequest,
  EmailTemplatePreviewRequest,
  EmailTemplatePreviewResponse,
  EmailTemplateUpdateRequest,
  Page,
} from '@/types/cms'
import { fetcher } from '@/utils/services/fetcher'

const BASE = '/api/v1/email-templates'

export const getEmailTemplatesService = async (
  page: number = 0,
  size: number = 20,
) => {
  const response: BaseResponse<Page<EmailTemplate>> = await fetcher(
    `${BASE}?page=${page}&size=${size}`,
    { method: 'GET' },
  )
  return unwrapOrThrow(response, 'Email template listesi alınamadı')
}

export const getEmailTemplateService = async (key: string) => {
  const response: BaseResponse<EmailTemplate> = await fetcher(
    `${BASE}/${encodeURIComponent(key)}`,
    { method: 'GET' },
  )
  return unwrapOrThrow(response, `Template "${key}" alınamadı`)
}

export const createEmailTemplateService = async (
  data: EmailTemplateCreateRequest,
) => {
  const response: BaseResponse<EmailTemplate> = await fetcher(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return unwrapOrThrow(response, 'Template oluşturulamadı')
}

export const updateEmailTemplateService = async (
  key: string,
  data: EmailTemplateUpdateRequest,
) => {
  const response: BaseResponse<EmailTemplate> = await fetcher(
    `${BASE}/${encodeURIComponent(key)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  )
  return unwrapOrThrow(response, `Template "${key}" güncellenemedi`)
}

export const deleteEmailTemplateService = async (key: string) => {
  const response: BaseResponse<void> = await fetcher(
    `${BASE}/${encodeURIComponent(key)}`,
    { method: 'DELETE' },
  )
  return unwrapOrThrow(response, `Template "${key}" silinemedi`)
}

export const previewEmailTemplateService = async (
  key: string,
  body: EmailTemplatePreviewRequest,
): Promise<EmailTemplatePreviewResponse> => {
  const response: BaseResponse<EmailTemplatePreviewResponse> = await fetcher(
    `${BASE}/${encodeURIComponent(key)}/preview`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  return unwrapOrThrow(response, 'Template önizlemesi alınamadı')
}

/**
 * Classpath'teki statik template isimlerini listeler.
 * GET /api/v1/emails/templates → string[]
 */
export const getEmailClasspathTemplatesService = async (): Promise<
  string[]
> => {
  const response: BaseResponse<string[]> = await fetcher(
    '/api/v1/emails/templates',
    { method: 'GET' },
  )
  return unwrapOrThrow(response, 'Classpath template listesi alınamadı')
}
