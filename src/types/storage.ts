/** Tenant depolama kotası (X-Tenant-Id context'inde) */
export interface StorageQuota {
  tenantId: string
  usedBytes: number
  /** Etkin limit (override yoksa varsayılan 3GB) */
  limitBytes: number
  /** 0-100 */
  usedPercent: number
}
