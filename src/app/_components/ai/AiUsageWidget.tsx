'use client'

import { useRef, useState } from 'react'
import { useAdminTheme } from '@/app/_hooks'
import { useAiQuota, useUpdateAiQuotaLimit } from '@/app/_hooks/useAiLogs'
import { getGlobalCookies } from '@/context/CookieContext'
import { useMyRoleLevel } from '@/utils/chat-role'
import { CookieEnum } from '@/utils/constant/cookieConstant'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const fmtNum = (n?: number) =>
  n == null ? '0' : new Intl.NumberFormat('tr-TR').format(n)

const fmtUsd = (n?: number) => {
  if (n == null || n === 0) return '$0.00'
  if (n < 0.01) return `$${n.toFixed(4)}`
  return `$${n.toFixed(2)}`
}

interface AiUsageWidgetProps {
  /** /ai-logs sayfasında açık yönetim formu gösterilsin mi */
  showManagement?: boolean
}

export function AiUsageWidget({ showManagement = false }: AiUsageWidgetProps) {
  const { isDarkMode } = useAdminTheme()
  const [tenantId] = useState<string | null>(
    () => getGlobalCookies()[CookieEnum.TENANT_ID] || null,
  )
  const { data: quota, isLoading, isError } = useAiQuota(tenantId)
  const updateLimit = useUpdateAiQuotaLimit(tenantId)
  const roleLevel = useMyRoleLevel()
  const canManage = roleLevel >= 4

  const [editing, setEditing] = useState(showManagement)
  const monthlyInputRef = useRef<HTMLInputElement>(null)
  const dailyInputRef = useRef<HTMLInputElement>(null)

  const monthlyPct = Math.min(
    Math.max(quota?.monthlyTokenUsedPercent ?? 0, 0),
    100,
  )
  const dailyPct = Math.min(
    Math.max(quota?.dailyRequestUsedPercent ?? 0, 0),
    100,
  )

  const barColor = (pct: number) =>
    pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
  const pctColor = (pct: number) =>
    pct >= 90
      ? 'text-rose-500'
      : pct >= 70
        ? 'text-amber-500'
        : 'text-emerald-500'

  const handleSaveLimits = () => {
    const monthly = Number(monthlyInputRef.current?.value)
    const daily = Number(dailyInputRef.current?.value)
    if (!Number.isFinite(monthly) || monthly <= 0) {
      toast.error('Geçerli bir aylık token limiti girin')
      return
    }
    if (!Number.isFinite(daily) || daily <= 0) {
      toast.error('Geçerli bir günlük istek limiti girin')
      return
    }
    updateLimit.mutate(
      { monthlyTokenLimit: monthly, dailyRequestLimit: daily },
      {
        onSuccess: () => {
          toast.success('AI kullanım limitleri güncellendi')
          if (!showManagement) setEditing(false)
        },
        onError: e =>
          toast.error(
            e instanceof Error ? e.message : 'AI limitleri güncellenemedi',
          ),
      },
    )
  }

  const cardClass = `rounded-2xl p-5 ${
    isDarkMode
      ? 'border border-slate-800/50 bg-slate-900/60'
      : 'border border-gray-200 bg-white'
  }`
  const muted = isDarkMode ? 'text-slate-400' : 'text-gray-500'
  const inputClass = `w-36 rounded-xl border px-3 py-1.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-violet-500/30 ${
    isDarkMode
      ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-violet-500/50'
      : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-violet-300'
  }`

  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2
              className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              AI Kullanım &amp; Kota Durumu
            </h2>
            <p className={`truncate text-xs ${muted}`}>
              {quota?.tenantId ? quota.tenantId : 'Genel / Admin'} · Aylık Token
              &amp; Günlük İstek Limiti
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {quota && !isLoading && (
            <span className={`text-2xl font-bold ${pctColor(monthlyPct)}`}>
              %{monthlyPct.toFixed(1)}
            </span>
          )}
          {canManage && !showManagement && (
            <button
              type="button"
              onClick={() => setEditing(v => !v)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                isDarkMode
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {editing ? 'Kapat' : 'Limit Düzenle'}
            </button>
          )}
          {!showManagement && (
            <Link
              href="/ai-logs"
              className="text-xs font-medium text-violet-400 hover:text-violet-300"
            >
              Detaylar →
            </Link>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <div
            className={`h-3 w-full animate-pulse rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}
          />
          <div
            className={`h-16 w-full animate-pulse rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}
          />
        </div>
      )}

      {isError && !isLoading && (
        <p className="py-3 text-sm text-rose-500">
          AI kota bilgisi yüklenemedi.
        </p>
      )}

      {quota && !isLoading && (
        <>
          {/* Aylık Token Çubuğu + Günlük İstek Çubuğu */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className={muted}>Aylık Token Kullanımı</span>
                <span
                  className={`font-mono font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}
                >
                  {fmtNum(quota.monthlyTokensUsed)} /{' '}
                  {fmtNum(quota.monthlyTokenLimit)} token
                </span>
              </div>
              <div
                className={`h-2.5 w-full overflow-hidden rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor(monthlyPct)}`}
                  style={{ width: `${monthlyPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className={muted}>Günlük İstek (Çağrı) Limiti</span>
                <span
                  className={`font-mono font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}
                >
                  {fmtNum(quota.dailyRequestsUsed)} /{' '}
                  {fmtNum(quota.dailyRequestLimit)} istek (
                  <span className={pctColor(dailyPct)}>
                    %{dailyPct.toFixed(1)}
                  </span>
                  )
                </span>
              </div>
              <div
                className={`h-2.5 w-full overflow-hidden rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor(dailyPct)}`}
                  style={{ width: `${dailyPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Özet Metrik Kartları */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Metric
              label="Bu Ay Kullanılan"
              value={`${fmtNum(quota.monthlyTokensUsed)} tok`}
              sub={`Girdi: ${fmtNum(quota.monthlyInputTokens)}`}
              isDarkMode={isDarkMode}
            />
            <Metric
              label="Kalan Token Hakkı"
              value={`${fmtNum(quota.monthlyTokensRemaining)} tok`}
              sub={`Limit: ${fmtNum(quota.monthlyTokenLimit)}`}
              isDarkMode={isDarkMode}
            />
            <Metric
              label="Çıktı + Düşünme"
              value={`${fmtNum(quota.monthlyOutputTokens + quota.monthlyThoughtTokens)} tok`}
              sub={`Ç: ${fmtNum(quota.monthlyOutputTokens)} · D: ${fmtNum(quota.monthlyThoughtTokens)}`}
              isDarkMode={isDarkMode}
            />
            <Metric
              label="Bugün Kalan İstek"
              value={`${fmtNum(quota.dailyRequestsRemaining)} istek`}
              sub={`Bugün: ${fmtNum(quota.dailyRequestsUsed)} / ${fmtNum(quota.dailyRequestLimit)}`}
              isDarkMode={isDarkMode}
            />
            <Metric
              label="Bugün Harcanan"
              value={`${fmtNum(quota.dailyTokensUsed)} tok`}
              sub={`Önbellek: ${fmtNum(quota.monthlyCachedTokens)}`}
              isDarkMode={isDarkMode}
            />
            <Metric
              label="Tahmini Maliyet (Ay)"
              value={fmtUsd(quota.monthlyEstimatedCostUsd)}
              sub={`Toplam: ${fmtUsd(quota.totalEstimatedCostUsd)}`}
              isDarkMode={isDarkMode}
            />
          </div>

          {(monthlyPct >= 70 || dailyPct >= 70) && (
            <p
              className={`mt-3 text-xs ${
                monthlyPct >= 90 || dailyPct >= 90
                  ? 'text-rose-500'
                  : 'text-amber-500'
              }`}
            >
              {monthlyPct >= 100 || dailyPct >= 100
                ? 'AI kullanım kotası doldu — yeni AI içerik üretim istekleri kota sıfırlanana veya limit artırılana kadar engellenir.'
                : 'AI kullanım kotası dolmak üzere.'}
            </p>
          )}

          {/* SUPER_ADMIN Limit Düzenleme Alanı */}
          {canManage && editing && (
            <div
              className={`mt-4 flex flex-wrap items-end gap-3 border-t pt-4 ${
                isDarkMode ? 'border-slate-800' : 'border-gray-100'
              }`}
            >
              <div>
                <label
                  htmlFor="ai-monthly-token-limit"
                  className={`mb-1 block text-xs font-medium ${muted}`}
                >
                  Aylık Token Limiti
                </label>
                <input
                  id="ai-monthly-token-limit"
                  key={`m-${quota.monthlyTokenLimit}`}
                  ref={monthlyInputRef}
                  type="number"
                  min={1000}
                  step={50000}
                  defaultValue={quota.monthlyTokenLimit}
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="ai-daily-req-limit"
                  className={`mb-1 block text-xs font-medium ${muted}`}
                >
                  Günlük İstek Limiti
                </label>
                <input
                  id="ai-daily-req-limit"
                  key={`d-${quota.dailyRequestLimit}`}
                  ref={dailyInputRef}
                  type="number"
                  min={1}
                  step={25}
                  defaultValue={quota.dailyRequestLimit}
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={handleSaveLimits}
                disabled={updateLimit.isPending}
                className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 disabled:opacity-50"
              >
                {updateLimit.isPending ? 'Kaydediliyor...' : 'Limitleri Kaydet'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function Metric({
  label,
  value,
  sub,
  isDarkMode,
}: {
  label: string
  value: string
  sub?: string
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
        className={`mt-0.5 font-mono text-sm font-semibold tabular-nums ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
      >
        {value}
      </p>
      {sub && (
        <p
          className={`mt-0.5 truncate text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
        >
          {sub}
        </p>
      )}
    </div>
  )
}
