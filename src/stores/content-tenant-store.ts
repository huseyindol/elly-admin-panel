import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * İçerik (assets / banners / ...) işlemlerinin hangi tenant bağlamında
 * yapılacağını tutan store.
 *
 * - selectedTenantId `null` ise: içerik servisleri X-Tenant-Id GÖNDERMEZ →
 *   backend `basedb` bağlamında çalışır (mevcut davranış, geriye dönük uyumlu).
 * - Bir tenant seçilince: ilgili içerik istekleri `X-Tenant-Id` ile o tenant'a
 *   gider; dosyalar o tenant'ın klasörüne yazılır ve o tenant'ın kotasına sayılır.
 *
 * Seçim localStorage'a persist edilir (sayfa yenilense de korunur). Selector
 * `managedTenants` (kullanıcı profili) listesiyle beslenir; kullanıcı artık o
 * tenant'ı yönetmiyorsa ContentTenantSelector seçimi basedb'ye düşürür.
 */
interface ContentTenantState {
  selectedTenantId: string | null
  setSelectedTenantId: (tenantId: string | null) => void
}

export const useContentTenantStore = create<ContentTenantState>()(
  persist(
    set => ({
      selectedTenantId: null,
      setSelectedTenantId: tenantId => set({ selectedTenantId: tenantId }),
    }),
    {
      name: 'content-tenant-storage',
    },
  ),
)

/** Reactive: seçili içerik tenant'ı (null = basedb). Component'lerde kullanılır. */
export function useContentTenantId(): string | null {
  return useContentTenantStore(s => s.selectedTenantId)
}
