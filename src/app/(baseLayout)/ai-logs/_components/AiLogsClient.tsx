'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Column, DataTable } from '@/app/_components'
import { AiUsageWidget } from '@/app/_components/ai/AiUsageWidget'
import { useAdminTheme } from '@/app/_hooks'
import { useAiLogs, useAiStats } from '@/app/_hooks/useAiLogs'
import type { AiLogStatus, AiUsageLog } from '@/app/_services/ai-logs.services'
import { formatRelativeTime } from '@/app/_utils/dateUtils'
import { AiLogDetailSheet } from './AiLogDetailSheet'

const DEFAULT_SIZE = 20

const ACTION_OPTIONS = [
  { value: '', label: 'Tüm Endpoint / Adımlar' },
  { value: 'slug', label: 'slug (/ai/slug)' },
  { value: 'seo', label: 'seo (/ai/seo)' },
  { value: 'description', label: 'description (/ai/description)' },
  { value: 'alt-text', label: 'alt-text (/ai/alt-text)' },
  { value: 'blog-info', label: 'blog-info (/ai/blog-info)' },
  { value: 'article', label: 'article (/ai/article)' },
  { value: 'article:outline', label: 'article:outline (Eski Adım 1)' },
  { value: 'article:draft', label: 'article:draft (Eski Adım 2)' },
  { value: 'article:sanitize', label: 'article:sanitize (Eski Adım 3)' },
] as const

export function AiLogsClient() {
  const { isDarkMode } = useAdminTheme()
  const router = useRouter()
  const searchParams = useSearchParams()

  const rawStatus = searchParams.get('status') as AiLogStatus | null
  const status =
    rawStatus === 'SUCCESS' || rawStatus === 'ERROR' ? rawStatus : undefined
  const action = searchParams.get('action') || undefined
  const q = searchParams.get('q') || undefined
  const page = Math.max(0, Number(searchParams.get('page') ?? '0'))

  const [searchDraft, setSearchDraft] = useState(q ?? '')
  const [selected, setSelected] = useState<AiUsageLog | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data: stats } = useAiStats()
  const { data, isLoading, isError, error } = useAiLogs({
    action,
    status,
    q,
    page,
    size: DEFAULT_SIZE,
  })

  const handleRowClick = useCallback((log: AiUsageLog) => {
    setSelected(log)
    setSheetOpen(true)
  }, [])

  const logs = useMemo(() => data?.content ?? [], [data])
  const totalElements = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 0

  const pushParams = (next: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, val] of Object.entries(next)) {
      if (val === null || val === '') params.delete(key)
      else params.set(key, val)
    }
    router.push(`?${params.toString()}`)
  }

  const columns = useMemo<Column<AiUsageLog>[]>(
    () => [
      {
        key: 'id',
        header: 'ID',
        width: '65px',
        render: log => (
          <span className="font-mono text-xs tabular-nums">#{log.id}</span>
        ),
      },
      {
        key: 'action',
        header: 'Endpoint / İşlem',
        width: '210px',
        render: log => {
          const isErr = log.status === 'ERROR'
          return (
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex w-fit rounded-md px-2 py-0.5 font-mono text-xs ${
                    isDarkMode
                      ? 'bg-slate-800 text-violet-300'
                      : 'bg-violet-50 text-violet-700'
                  }`}
                >
                  {log.action}
                </span>
                {isErr && (
                  <span
                    className={`inline-flex rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                      isDarkMode
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {log.errorCode || 'HATA'}
                  </span>
                )}
              </div>
              <span
                className={`mt-0.5 font-mono text-[11px] ${
                  isDarkMode ? 'text-slate-500' : 'text-gray-400'
                }`}
              >
                {log.endpoint}
              </span>
              {isErr && log.errorMessage && (
                <span
                  className={`mt-0.5 line-clamp-2 text-[11px] ${
                    isDarkMode ? 'text-rose-300' : 'text-rose-600'
                  }`}
                >
                  {log.errorMessage}
                </span>
              )}
            </div>
          )
        },
      },
      {
        key: 'userInput',
        header: 'İstek (Girdi)',
        render: log => (
          <span className="block max-w-xs truncate font-mono text-xs">
            {log.userInput || '-'}
          </span>
        ),
      },
      {
        key: 'response',
        header: 'Sonuç (Önizleme)',
        render: log => (
          <span
            className={`block max-w-xs truncate text-xs ${
              log.status === 'ERROR'
                ? isDarkMode
                  ? 'text-rose-300'
                  : 'text-rose-600'
                : ''
            }`}
          >
            {log.status === 'ERROR'
              ? log.errorMessage || log.responseText || '-'
              : log.parsedOutput || log.responseText || '-'}
          </span>
        ),
      },
      {
        key: 'tokens',
        header: 'Token (G / Ç / D / T)',
        width: '175px',
        render: log => (
          <div className="font-mono text-xs tabular-nums">
            <span className="font-semibold text-violet-400">
              {log.totalTokens.toLocaleString('tr-TR')}
            </span>
            <span
              className={`ml-1.5 text-[11px] ${
                isDarkMode ? 'text-slate-400' : 'text-gray-500'
              }`}
            >
              ({log.inputTokens}/{log.outputTokens}/{log.thoughtTokens})
            </span>
          </div>
        ),
      },
      {
        key: 'duration',
        header: 'Süre',
        width: '85px',
        render: log => (
          <span className="font-mono text-xs tabular-nums">
            {log.durationMs} ms
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Durum',
        width: '95px',
        render: log => {
          const ok = log.status === 'SUCCESS'
          return (
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                ok
                  ? isDarkMode
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-emerald-100 text-emerald-700'
                  : isDarkMode
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-rose-100 text-rose-700'
              }`}
            >
              {ok ? 'BAŞARILI' : 'HATA'}
            </span>
          )
        },
      },
      {
        key: 'createdAt',
        header: 'Tarih',
        width: '130px',
        render: log => (
          <div className="flex flex-col">
            <span
              className={`text-xs ${
                isDarkMode ? 'text-slate-300' : 'text-gray-700'
              }`}
            >
              {formatRelativeTime(log.createdAt)}
            </span>
            {log.username && (
              <span
                className={`text-[11px] ${
                  isDarkMode ? 'text-slate-500' : 'text-gray-400'
                }`}
              >
                {log.username}
              </span>
            )}
          </div>
        ),
      },
    ],
    [isDarkMode],
  )

  return (
    <div className="space-y-6">
      {/* AI Kota & Limit Kartı */}
      <AiUsageWidget showManagement />

      {/* Özet İstatistik Kartları */}
      {stats && (
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard
              label="Toplam Çağrı"
              value={stats.totalCalls.toLocaleString('tr-TR')}
              sub={`${stats.successCalls} başarılı · ${stats.errorCalls} hata`}
              dark={isDarkMode}
            />
            <StatCard
              label="Toplam Token"
              value={stats.totalTokens.toLocaleString('tr-TR')}
              sub={`Cached: ${stats.totalCachedTokens.toLocaleString('tr-TR')}`}
              dark={isDarkMode}
              highlight
            />
            <StatCard
              label="Input (Prompt) Token"
              value={stats.totalInputTokens.toLocaleString('tr-TR')}
              dark={isDarkMode}
            />
            <StatCard
              label="Output (Yanıt) Token"
              value={stats.totalOutputTokens.toLocaleString('tr-TR')}
              dark={isDarkMode}
            />
            <StatCard
              label="Thought (Düşünme) Token"
              value={stats.totalThoughtTokens.toLocaleString('tr-TR')}
              dark={isDarkMode}
            />
            <StatCard
              label="Ort. Yanıt Süresi"
              value={`${stats.avgDurationMs} ms`}
              dark={isDarkMode}
            />
          </div>

          {stats.byAction.length > 0 && (
            <div
              className={`rounded-xl border p-4 ${
                isDarkMode
                  ? 'border-slate-800 bg-slate-900/50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <h2
                className={`mb-2.5 text-xs font-semibold uppercase tracking-wider ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}
              >
                Endpoint / İşlem Bazlı Tüketim Kırılımı
              </h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {stats.byAction.map(item => (
                  <button
                    key={item.action}
                    type="button"
                    onClick={() =>
                      pushParams({
                        action: action === item.action ? null : item.action,
                        page: '0',
                      })
                    }
                    className={`flex flex-col rounded-lg border p-2.5 text-left transition-colors ${
                      action === item.action
                        ? 'border-violet-500 bg-violet-500/10'
                        : isDarkMode
                          ? 'border-slate-800 bg-slate-900 hover:border-slate-700'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-violet-400">
                        {item.action}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          isDarkMode ? 'text-slate-300' : 'text-gray-700'
                        }`}
                      >
                        {item.callCount} çağrı
                      </span>
                    </div>
                    <div
                      className={`mt-1 flex items-center justify-between font-mono text-[11px] ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-500'
                      }`}
                    >
                      <span>
                        {item.totalTokens.toLocaleString('tr-TR')} token
                      </span>
                      <span>~{item.avgDurationMs} ms</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Filtre Çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="İşlem filtresi"
            value={action ?? ''}
            onChange={e =>
              pushParams({ action: e.target.value || null, page: '0' })
            }
            className={`rounded-xl border px-3 py-2 text-xs outline-none ${
              isDarkMode
                ? 'border-slate-700 bg-slate-800 text-white'
                : 'border-gray-200 bg-white text-gray-800'
            }`}
          >
            {ACTION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Durum filtresi"
            value={status ?? ''}
            onChange={e =>
              pushParams({ status: e.target.value || null, page: '0' })
            }
            className={`rounded-xl border px-3 py-2 text-xs outline-none ${
              isDarkMode
                ? 'border-slate-700 bg-slate-800 text-white'
                : 'border-gray-200 bg-white text-gray-800'
            }`}
          >
            <option value="">Tüm Durumlar</option>
            <option value="SUCCESS">Başarılı (SUCCESS)</option>
            <option value="ERROR">Hatalı (ERROR)</option>
          </select>

          <form
            onSubmit={e => {
              e.preventDefault()
              pushParams({ q: searchDraft.trim() || null, page: '0' })
            }}
            className="flex items-center gap-1.5"
          >
            <input
              type="search"
              value={searchDraft}
              onChange={e => setSearchDraft(e.target.value)}
              placeholder="Girdi, yanıt veya requestId ara..."
              className={`rounded-xl border px-3 py-2 text-xs outline-none ${
                isDarkMode
                  ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500'
                  : 'border-gray-200 bg-white text-gray-800 placeholder-gray-400'
              }`}
            />
            <button
              type="submit"
              className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-500"
            >
              Ara
            </button>
          </form>
        </div>

        <span
          className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
        >
          Toplam <strong>{totalElements}</strong> kayıt · Sayfa{' '}
          <strong>{Math.min(page + 1, Math.max(totalPages, 1))}</strong>/
          {Math.max(totalPages, 1)}
        </span>
      </div>

      {isError ? (
        <div
          className={`rounded-xl p-4 text-sm ${
            isDarkMode
              ? 'border border-rose-500/40 bg-rose-500/10 text-rose-300'
              : 'border border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          AI kullanım logları alınamadı: {(error as Error)?.message}
        </div>
      ) : (
        <DataTable
          data={logs}
          columns={columns}
          isLoading={isLoading}
          keyExtractor={l => String(l.id)}
          onRowClick={handleRowClick}
          emptyMessage="Henüz AI kullanım log kaydı bulunmuyor"
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={page <= 0}
            onClick={() => pushParams({ page: String(page - 1) })}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
              isDarkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ← Önceki
          </button>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => pushParams({ page: String(page + 1) })}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
              isDarkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sonraki →
          </button>
        </div>
      )}

      <AiLogDetailSheet
        log={selected}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  dark,
  highlight = false,
}: Readonly<{
  label: string
  value: string
  sub?: string
  dark: boolean
  highlight?: boolean
}>) {
  let valueColor = dark ? 'text-white' : 'text-gray-900'
  if (highlight) {
    valueColor = dark ? 'text-violet-300' : 'text-violet-700'
  }
  return (
    <div
      className={`rounded-xl border p-3.5 ${
        dark ? 'border-slate-800 bg-slate-900/60' : 'border-gray-200 bg-white'
      }`}
    >
      <span
        className={`block text-[11px] font-medium ${
          dark ? 'text-slate-400' : 'text-gray-500'
        }`}
      >
        {label}
      </span>
      <span className={`mt-1 block font-mono text-lg font-bold ${valueColor}`}>
        {value}
      </span>
      {sub && (
        <span
          className={`mt-0.5 block text-[11px] ${
            dark ? 'text-slate-500' : 'text-gray-400'
          }`}
        >
          {sub}
        </span>
      )}
    </div>
  )
}
