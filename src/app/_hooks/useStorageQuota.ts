'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getQuotaService,
  recomputeQuotaService,
  setQuotaLimitService,
} from '@/app/_services/storage.services'

export const storageQuotaKeys = {
  all: ['storage-quota'] as const,
  quota: (tenantId?: string | null) =>
    [...storageQuotaKeys.all, tenantId ?? ''] as const,
}

/** Seçili tenant'ın (yoksa basedb) depolama kotası. */
export function useStorageQuota(tenantId?: string | null) {
  return useQuery({
    queryKey: storageQuotaKeys.quota(tenantId),
    queryFn: () => getQuotaService(tenantId),
  })
}

/** Limit ayarla + yeniden hesapla mutation'ları. Başarıda kotayı invalidate eder. */
export function useStorageQuotaMutations(tenantId?: string | null) {
  const qc = useQueryClient()
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: storageQuotaKeys.quota(tenantId) })

  const setLimit = useMutation({
    mutationFn: (limitBytes: number) =>
      setQuotaLimitService(limitBytes, tenantId),
    onSuccess: invalidate,
  })
  const recompute = useMutation({
    mutationFn: () => recomputeQuotaService(tenantId),
    onSuccess: invalidate,
  })

  return { setLimit, recompute }
}
