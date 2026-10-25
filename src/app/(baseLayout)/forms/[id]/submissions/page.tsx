'use client'

import { useAdminTheme, usePermissions } from '@/app/_hooks'
import {
  cleanupFormSubmissionsService,
  exportFormSubmissionsService,
  getFormByIdService,
  getFormSubmissionsPagedService,
} from '@/app/_services/forms.services'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Download, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { use, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { formatPayloadValue } from './_components/formatPayloadValue'

interface PageProps {
  params: Promise<{ id: string }>
}

const PAGE_SIZE = 20

export default function FormSubmissionsPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isDarkMode } = useAdminTheme()
  const { canDelete } = usePermissions({ canDelete: 'forms:delete' })
  const queryClient = useQueryClient()

  const [exportFrom, setExportFrom] = useState('')
  const [exportTo, setExportTo] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [retentionDays, setRetentionDays] = useState(365)
  const [isCleaning, setIsCleaning] = useState(false)

  const page = Math.max(0, Number(searchParams.get('page') ?? '0'))

  // Form tanımı — schema.fields'tan label/option haritası kuracağız
  const { data: formResponse } = useQuery({
    queryKey: ['form', id],
    queryFn: () => getFormByIdService(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })

  // Yanıtlar — sayfalama URL'den
  const {
    data: submissionsResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['form-submissions', id, page],
    queryFn: () =>
      getFormSubmissionsPagedService(id, page, PAGE_SIZE, 'submittedAt,desc'),
    enabled: !!id,
  })

  const form = formResponse?.data
  const submissions = submissionsResponse?.data?.content ?? []
  const totalPages = submissionsResponse?.data?.totalPages ?? 0
  const totalElements = submissionsResponse?.data?.totalElements ?? 0

  const fields = useMemo(() => form?.schema?.fields ?? [], [form])
  const fieldMap = useMemo(
    () => Object.fromEntries(fields.map(f => [f.id, f])),
    [fields],
  )

  const goToPage = (next: number) => {
    const sp = new URLSearchParams(searchParams.toString())
    if (next <= 0) sp.delete('page')
    else sp.set('page', String(next))
    const qs = sp.toString()
    router.push(qs ? `?${qs}` : window.location.pathname)
  }

  const handleExportCsv = async () => {
    try {
      setIsExporting(true)
      const data = await exportFormSubmissionsService(
        id,
        exportFrom || undefined,
        exportTo || undefined,
      )
      const blob = new Blob([data.csvContent], {
        type: 'text/csv;charset=utf-8;',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.fileName || `form_${id}_submissions.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`${data.count} yanıt CSV olarak indirildi.`)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'CSV dışa aktarma başarısız oldu.',
      )
    } finally {
      setIsExporting(false)
    }
  }

  const handleCleanupOld = async () => {
    try {
      setIsCleaning(true)
      const res = await cleanupFormSubmissionsService(id, retentionDays)
      toast.success(
        `KVKK temizliği tamamlandı (${res.retentionDays} günden eski ${res.deletedCount} kayıt silindi).`,
      )
      queryClient.invalidateQueries({ queryKey: ['form-submissions', id] })
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'KVKK temizliği başarısız oldu.',
      )
    } finally {
      setIsCleaning(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/forms"
          className={`transition-colors hover:text-violet-400 ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}
        >
          Formlar
        </Link>
        <span className={isDarkMode ? 'text-slate-600' : 'text-gray-400'}>
          /
        </span>
        <Link
          href={`/forms/${id}`}
          className={`transition-colors hover:text-violet-400 ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}
        >
          {form?.title ?? 'Form'}
        </Link>
        <span className={isDarkMode ? 'text-slate-600' : 'text-gray-400'}>
          /
        </span>
        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
          Yanıtlar
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1
            className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {form?.title ?? 'Yanıtlar'}
          </h1>
          <p
            className={`text-sm ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`}
          >
            {totalElements} yanıt
          </p>
        </div>

        {/* B5: CSV Export & KVKK Cleanup */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            aria-label="Başlangıç tarihi"
            value={exportFrom}
            onChange={e => setExportFrom(e.target.value)}
            className={`rounded-lg border px-2.5 py-1.5 text-xs ${
              isDarkMode
                ? 'border-slate-700 bg-slate-800 text-slate-200'
                : 'border-gray-200 bg-white text-gray-700'
            }`}
          />
          <input
            type="date"
            aria-label="Bitiş tarihi"
            value={exportTo}
            onChange={e => setExportTo(e.target.value)}
            className={`rounded-lg border px-2.5 py-1.5 text-xs ${
              isDarkMode
                ? 'border-slate-700 bg-slate-800 text-slate-200'
                : 'border-gray-200 bg-white text-gray-700'
            }`}
          />
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {isExporting ? 'İndiriliyor...' : 'CSV İndir'}
          </button>

          {canDelete && (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                aria-label="KVKK saklama süresi (gün)"
                value={retentionDays}
                onChange={e =>
                  setRetentionDays(Math.max(1, Number(e.target.value) || 365))
                }
                className={`w-16 rounded-lg border px-2 py-1.5 text-xs ${
                  isDarkMode
                    ? 'border-slate-700 bg-slate-800 text-slate-200'
                    : 'border-gray-200 bg-white text-gray-700'
                }`}
              />
              <button
                type="button"
                onClick={handleCleanupOld}
                disabled={isCleaning}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                  isDarkMode
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                    : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isCleaning ? 'Temizleniyor...' : 'KVKK Temizle'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* States */}
      {isError && (
        <div
          className={`rounded-xl border p-6 text-sm ${
            isDarkMode
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          Yanıtlar yüklenirken bir hata oluştu.
        </div>
      )}

      {isLoading && !isError && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`h-32 animate-pulse rounded-xl ${
                isDarkMode ? 'bg-slate-800/50' : 'bg-gray-100'
              }`}
            />
          ))}
        </div>
      )}

      {!isLoading && !isError && submissions.length === 0 && (
        <div
          className={`rounded-xl border border-dashed p-12 text-center text-sm ${
            isDarkMode
              ? 'border-slate-700 text-slate-500'
              : 'border-gray-300 text-gray-400'
          }`}
        >
          Henüz yanıt yok.
        </div>
      )}

      {/* Submission cards */}
      {!isLoading && !isError && submissions.length > 0 && (
        <div className="space-y-3">
          {submissions.map(sub => (
            <article
              key={sub.id}
              className={`rounded-xl border p-4 transition-colors ${
                isDarkMode
                  ? 'border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <header className="mb-3 flex items-center justify-between">
                <span
                  className={`text-xs ${
                    isDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}
                >
                  {new Date(sub.submittedAt).toLocaleString('tr-TR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
                <span
                  className={`rounded-md border px-2 py-0.5 font-mono text-[10px] ${
                    isDarkMode
                      ? 'border-slate-700 text-slate-400'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  #{sub.id}
                </span>
              </header>

              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {fields.map(field => {
                  const raw = sub.payload[field.id]
                  if (raw === undefined) return null
                  return (
                    <div key={field.id}>
                      <dt
                        className={`text-xs font-medium ${
                          isDarkMode ? 'text-slate-500' : 'text-gray-500'
                        }`}
                      >
                        {field.label}
                      </dt>
                      <dd
                        className={`mt-0.5 break-words text-sm ${
                          isDarkMode ? 'text-slate-200' : 'text-gray-800'
                        }`}
                      >
                        {formatPayloadValue(raw, fieldMap[field.id])}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span
            className={`text-sm ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`}
          >
            Sayfa {page + 1} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page === 0}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                isDarkMode
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              aria-label="Önceki sayfa"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages - 1}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                isDarkMode
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              aria-label="Sonraki sayfa"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
