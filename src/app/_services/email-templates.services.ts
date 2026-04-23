import { unwrapOrThrow } from '@/lib/api/api-error'
import type { BaseResponse } from '@/types/BaseResponse'
import { fetcher } from '@/utils/services/fetcher'

/**
 * Classpath'teki Thymeleaf template isimlerini listeler.
 * GET /api/v1/emails/templates → string[]
 *
 * NOT: DB-based template CRUD (/api/v1/email-templates) v4 backend'de
 * yazılacak — henüz deploy edilmedi.
 */
export const getEmailClasspathTemplatesService = async (): Promise<
  string[]
> => {
  const response: BaseResponse<string[]> = await fetcher(
    '/api/v1/emails/templates',
    { method: 'GET' },
  )
  return unwrapOrThrow(response, 'Template listesi alınamadı')
}
