'use client'

import { useRef, useState } from 'react'
import { useAdminTheme } from '@/app/_hooks'
import {
  useStorageQuota,
  useStorageQuotaMutations,
} from '@/app/_hooks/useStorageQuota'
import { getGlobalCookies } from '@/context/CookieContext'
import { CookieEnum } from '@/utils/constant/cookieConstant'
import { useMyRoleLevel } from '@/utils/chat-role'
import { bytesToGb, formatBytes, gbToBytes } from '@/utils/format'
import { HardDrive, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export function StorageQuotaCard() {
  const { isDarkMode } = useAdminTheme()
  // Bağımsız (Part B): oturum tenant'ının (yoksa basedb) kotası
  const [sessionTenantId] = useState<string | null>(
    () => getGlobalCookies()[CookieEnum.TENANT_ID] || null,
  )
  const { data: quota, isLoading, isError } = useStorageQuota(sessionTenantId)
  const { setLimit, recompute } = useStorageQuotaMutations(sessionTenantId)
  const roleLevel = useMyRoleLevel()
  const canManage = roleLevel >= 3 // ADMIN / SUPER_ADMIN
  const limitInputRef = useRef<HTMLInputElement>(null)

  const pct = Math.min(Math.max(quota?.usedPercent ?? 0, 0), 100)
  const barColor =
    pct > 95 ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-violet-500'

  const handleSetLimit = () => {
    const gb = Number(limitInputRef.current?.value)
    if (!Number.isFinite(gb) || gb <= 0) {
      toast.error('Geçerli bir limit (GB) girin')
      return
    }
    setLimit.mutate(gbToBytes(gb), {
      onSuccess: () => toast.success('Limit güncellendi'),
      onError: e =>
        toast.error(e instanceof Error ? e.message : 'Limit ayarlanamadı'),
    })
  }

  const handleRecompute = () => {
    recompute.mutate(undefined, {
      onSuccess: () => toast.success('Kullanım yeniden hesaplandı'),
      onError: e =>
        toast.error(e instanceof Error ? e.message : 'Yeniden hesaplanamadı'),
    })
  }

  const cardClass = `rounded-2xl p-6 ${
    isDarkMode
      ? 'border border-slate-800/50 bg-slate-900/60'
      : 'border border-gray-200 bg-white'
  }`
  const inputClass = `w-28 rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-violet-500/30 ${
    isDarkMode
      ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-violet-500/50'
      : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-violet-300'
  }`

  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-500">
          <HardDrive className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h2
            className={`flex items-center gap-2 text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Depolama Kotası
            {quota?.tenantId && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  isDarkMode
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {quota.tenantId}
              </span>
            )}
          </h2>
          <p
            className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
          >
            Bu tenant&apos;ın asset/medya depolama kullanımı.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
        </div>
      )}

      {isError && !isLoading && (
        <p className="py-4 text-sm text-rose-500">Kota bilgisi alınamadı.</p>
      )}

      {quota && !isLoading && (
        <>
          {/* Kullanım çubuğu */}
          <div className="mb-2 flex items-center justify-between text-sm">
            <span
              className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}
            >
              {formatBytes(quota.usedBytes)} / {formatBytes(quota.limitBytes)}
            </span>
            <span
              className={`font-semibold ${
                pct > 95
                  ? 'text-rose-500'
                  : pct > 80
                    ? 'text-amber-500'
                    : isDarkMode
                      ? 'text-slate-300'
                      : 'text-gray-600'
              }`}
            >
              %{pct.toFixed(0)}
            </span>
          </div>
          <div
            className={`h-2.5 w-full overflow-hidden rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {pct > 80 && (
            <p
              className={`mt-2 text-xs ${pct > 95 ? 'text-rose-500' : 'text-amber-500'}`}
            >
              {pct > 95
                ? 'Kota neredeyse dolu — yeni yüklemeler reddedilebilir.'
                : 'Kota dolmak üzere.'}
            </p>
          )}

          {/* Yönetim — yalnız ADMIN/SUPER_ADMIN */}
          {canManage && (
            <div
              className={`mt-5 flex flex-wrap items-end gap-3 border-t pt-4 ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}
            >
              <div>
                <label
                  htmlFor="quota-limit"
                  className={`mb-1.5 block text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
                >
                  Limit (GB)
                </label>
                <input
                  id="quota-limit"
                  key={quota.limitBytes}
                  ref={limitInputRef}
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={bytesToGb(quota.limitBytes).toFixed(0)}
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={handleSetLimit}
                disabled={setLimit.isPending}
                className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50"
              >
                {setLimit.isPending ? 'Kaydediliyor...' : 'Limiti Kaydet'}
              </button>
              <button
                type="button"
                onClick={handleRecompute}
                disabled={recompute.isPending}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  isDarkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${recompute.isPending ? 'animate-spin' : ''}`}
                />
                Yeniden hesapla
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
