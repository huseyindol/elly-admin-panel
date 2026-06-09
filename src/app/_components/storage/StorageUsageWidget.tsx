'use client'

import { useAdminTheme } from '@/app/_hooks'
import { useStorageQuota } from '@/app/_hooks/useStorageQuota'
import { getGlobalCookies } from '@/context/CookieContext'
import { CookieEnum } from '@/utils/constant/cookieConstant'
import { formatBytes } from '@/utils/format'
import { HardDrive } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

/**
 * Dashboard salt-okunur depolama kullanımı kartı.
 *
 * Oturum tenant'ının (yoksa basedb) kotasını gösterir: kullanım çubuğu + yüzde
 * + kullanılan/limit/kalan. Limit ayarı/yeniden hesaplama Ayarlar'dadır
 * (StorageQuotaCard). Backend: GET /api/v1/storage/quota (authenticated).
 */
export function StorageUsageWidget() {
  const { isDarkMode } = useAdminTheme()
  // Oturum tenant'ı (yoksa basedb) — Part B StorageQuotaCard ile aynı kaynak
  const [tenantId] = useState<string | null>(
    () => getGlobalCookies()[CookieEnum.TENANT_ID] || null,
  )
  const { data: quota, isLoading, isError } = useStorageQuota(tenantId)

  const pct = Math.min(Math.max(quota?.usedPercent ?? 0, 0), 100)
  // Eşikler: %0-70 yeşil, %70-90 amber, %90+ kırmızı
  const barColor =
    pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
  const pctColor =
    pct >= 90
      ? 'text-rose-500'
      : pct >= 70
        ? 'text-amber-500'
        : 'text-emerald-500'
  const remaining = quota ? Math.max(quota.limitBytes - quota.usedBytes, 0) : 0

  const cardClass = `rounded-2xl p-5 ${
    isDarkMode
      ? 'border border-slate-800/50 bg-slate-900/60'
      : 'border border-gray-200 bg-white'
  }`
  const muted = isDarkMode ? 'text-slate-400' : 'text-gray-500'

  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
            <HardDrive className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2
              className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Depolama Kullanımı
            </h2>
            <p className={`truncate text-xs ${muted}`}>
              {quota?.tenantId ? quota.tenantId : 'Genel / Admin'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {quota && !isLoading && (
            <span className={`text-2xl font-bold ${pctColor}`}>
              %{pct.toFixed(1)}
            </span>
          )}
          <Link
            href="/settings"
            className="text-xs font-medium text-violet-400 hover:text-violet-300"
          >
            Yönet →
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <div
            className={`h-3 w-full animate-pulse rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}
          />
          <div
            className={`h-14 w-full animate-pulse rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}
          />
        </div>
      )}

      {isError && !isLoading && (
        <p className="py-3 text-sm text-rose-500">
          Depolama bilgisi yüklenemedi.
        </p>
      )}

      {quota && !isLoading && (
        <>
          <div
            className={`h-3 w-full overflow-hidden rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric
              label="Kullanılan"
              value={formatBytes(quota.usedBytes)}
              isDarkMode={isDarkMode}
            />
            <Metric
              label="Toplam Limit"
              value={formatBytes(quota.limitBytes)}
              isDarkMode={isDarkMode}
            />
            <Metric
              label="Kalan"
              value={formatBytes(remaining)}
              isDarkMode={isDarkMode}
            />
          </div>

          {pct >= 70 && (
            <p
              className={`mt-3 text-xs ${pct >= 90 ? 'text-rose-500' : 'text-amber-500'}`}
            >
              {pct >= 90
                ? 'Kota neredeyse dolu — yeni yüklemeler reddedilebilir.'
                : 'Kota dolmak üzere.'}
            </p>
          )}
        </>
      )}
    </section>
  )
}

function Metric({
  label,
  value,
  isDarkMode,
}: {
  label: string
  value: string
  isDarkMode: boolean
}) {
  return (
    <div
      className={`rounded-xl px-3 py-2 ${isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'}`}
    >
      <p
        className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
      >
        {label}
      </p>
      <p
        className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
      >
        {value}
      </p>
    </div>
  )
}
