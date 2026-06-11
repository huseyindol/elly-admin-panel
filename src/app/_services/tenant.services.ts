import { fetcher } from '@/utils/services/fetcher'
import type { BaseResponse } from '@/types/BaseResponse'

/**
 * Verilen tenant için kısa ömürlü tenant-switch JWT alır.
 * TC chat endpoint'leri (/api/v1/tenant-chat/**) bu token ile çağrılır.
 * Admin JWT'si yerine Authorization header'ına konur; X-Tenant-Id gerekmez.
 */
export const getTenantTokenService = async (
  tenantId: string,
): Promise<string> => {
  const res: BaseResponse<{ token: string }> = await fetcher(
    '/api/v1/tenants/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId }),
    },
  )
  if (!res.result || !res.data?.token)
    throw new Error(res.message ?? 'Tenant token alınamadı')
  return res.data.token
}
