'use client'

import { useAdminTheme, useUserProfile } from '@/app/_hooks'
import { useContentTenantStore } from '@/stores/content-tenant-store'
import { Building2 } from 'lucide-react'
import { useEffect } from 'react'

/**
 * İçerik (assets / banners) sayfalarının başına konan inline tenant seçici.
 *
 * Seçili tenant global store'da tutulur ve tüm içerik servislerine X-Tenant-Id
 * olarak uygulanır. "Varsayılan (basedb)" → header gönderilmez.
 *
 * Kaynak: kullanıcı profilindeki `managedTenants`. Kullanıcı hiç tenant
 * yönetmiyorsa seçici render edilmez (yalnız basedb bağlamı vardır).
 */
export function ContentTenantSelector() {
  const { isDarkMode } = useAdminTheme()
  const { data: profile } = useUserProfile()
  const selectedTenantId = useContentTenantStore(s => s.selectedTenantId)
  const setSelectedTenantId = useContentTenantStore(s => s.setSelectedTenantId)

  const managedTenants = profile?.data?.managedTenants ?? []

  // Persist edilen seçim artık yönetilen tenant değilse basedb'ye düş.
  useEffect(() => {
    if (!profile?.data) return // profil yüklenmeden seçimi sıfırlama
    if (
      selectedTenantId &&
      !profile.data.managedTenants.includes(selectedTenantId)
    ) {
      setSelectedTenantId(null)
    }
  }, [profile?.data, selectedTenantId, setSelectedTenantId])

  // Yönetilen tenant yoksa seçiciyi gösterme.
  if (managedTenants.length === 0) return null

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${
        isDarkMode
          ? 'border-slate-800 bg-slate-900/60'
          : 'border-gray-200 bg-white'
      }`}
    >
      <span
        className={`flex items-center gap-2 text-sm font-medium ${
          isDarkMode ? 'text-slate-300' : 'text-gray-600'
        }`}
      >
        <Building2 className="h-4 w-4 text-violet-500" />
        İçerik Tenant&apos;ı
      </span>
      <select
        value={selectedTenantId ?? ''}
        onChange={e => setSelectedTenantId(e.target.value || null)}
        className={`rounded-lg border px-3 py-1.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-violet-500/30 ${
          isDarkMode
            ? 'border-slate-700 bg-slate-800 text-white focus:border-violet-500/50'
            : 'border-gray-200 bg-white text-gray-900 focus:border-violet-300'
        }`}
      >
        <option value="">Varsayılan (basedb)</option>
        {managedTenants.map(tenant => (
          <option key={tenant} value={tenant}>
            {tenant}
          </option>
        ))}
      </select>
      {selectedTenantId && (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            isDarkMode
              ? 'bg-violet-500/15 text-violet-300'
              : 'bg-violet-50 text-violet-600'
          }`}
        >
          Yüklemeler {selectedTenantId} tenant&apos;ına gider
        </span>
      )}
    </div>
  )
}
