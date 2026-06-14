import type { BaseResponse } from '@/types/BaseResponse'
import type { StorageQuota } from '@/types/storage'
import { fetcher } from '@/utils/services/fetcher'

/**
 * AC/basedb → /api/v1/storage/quota, TC → /api/v1/storage/tenant/{tenantId}/quota
 * Kimlik admin JWT'sinde; hedef tenant URL path'inde (chat ile aynı kural).
 */
const quotaBase = (tenantId?: string | null) =>
  tenantId
    ? `/api/v1/storage/tenant/${tenantId}/quota`
    : '/api/v1/storage/quota'

/** Kullanım (hedef tenant URL'de; yoksa admin'in kendi context'i). */
export const getQuotaService = async (
  tenantId?: string | null,
): Promise<StorageQuota> => {
  const res: BaseResponse<StorageQuota> = await fetcher(quotaBase(tenantId), {
    method: 'GET',
  })
  if (!res.result) throw new Error(res.message ?? 'Kota bilgisi alınamadı')
  return res.data
}

/** Limit ayarla (SUPER_ADMIN). */
export const setQuotaLimitService = async (
  limitBytes: number,
  tenantId?: string | null,
): Promise<StorageQuota> => {
  const res: BaseResponse<StorageQuota> = await fetcher(
    `${quotaBase(tenantId)}/limit`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limitBytes }),
    },
  )
  if (!res.result) throw new Error(res.message ?? 'Limit ayarlanamadı')
  return res.data
}

/** Gerçek boyutu yeniden hesapla (drift onarımı; SUPER_ADMIN). */
export const recomputeQuotaService = async (
  tenantId?: string | null,
): Promise<StorageQuota> => {
  const res: BaseResponse<StorageQuota> = await fetcher(
    `${quotaBase(tenantId)}/recompute`,
    {
      method: 'POST',
    },
  )
  if (!res.result) throw new Error(res.message ?? 'Yeniden hesaplanamadı')
  return res.data
}
