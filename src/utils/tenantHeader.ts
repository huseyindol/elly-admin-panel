/**
 * X-Tenant-Id header yardımcısı (paylaşılan).
 * tenantId verilirse `{ 'X-Tenant-Id': tenantId }`, değilse boş obje (backend basedb kullanır).
 */
export const tenantHeader = (
  tenantId?: string | null,
): Record<string, string> => (tenantId ? { 'X-Tenant-Id': tenantId } : {})
