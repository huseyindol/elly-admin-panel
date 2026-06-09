import type { BaseResponse } from '@/types/BaseResponse'
import type { StorageQuota } from '@/types/storage'
import { fetcher } from '@/utils/services/fetcher'
import { tenantHeader } from '@/utils/tenantHeader'

const BASE = '/api/v1/storage/quota'

/** Kullanım (X-Tenant-Id context'inde). */
export const getQuotaService = async (
  tenantId?: string | null,
): Promise<StorageQuota> => {
  const res: BaseResponse<StorageQuota> = await fetcher(BASE, {
    method: 'GET',
    headers: tenantHeader(tenantId),
  })
  if (!res.result) throw new Error(res.message ?? 'Kota bilgisi alınamadı')
  return res.data
}

/** Limit ayarla (SUPER_ADMIN/ADMIN). */
export const setQuotaLimitService = async (
  limitBytes: number,
  tenantId?: string | null,
): Promise<StorageQuota> => {
  const res: BaseResponse<StorageQuota> = await fetcher(`${BASE}/limit`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...tenantHeader(tenantId) },
    body: JSON.stringify({ limitBytes }),
  })
  if (!res.result) throw new Error(res.message ?? 'Limit ayarlanamadı')
  return res.data
}

/** Gerçek boyutu yeniden hesapla (drift onarımı; SUPER_ADMIN/ADMIN). */
export const recomputeQuotaService = async (
  tenantId?: string | null,
): Promise<StorageQuota> => {
  const res: BaseResponse<StorageQuota> = await fetcher(`${BASE}/recompute`, {
    method: 'POST',
    headers: tenantHeader(tenantId),
  })
  if (!res.result) throw new Error(res.message ?? 'Yeniden hesaplanamadı')
  return res.data
}
