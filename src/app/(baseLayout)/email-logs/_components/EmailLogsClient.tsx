'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Column, DataTable } from '@/app/_components'
import { useAdminTheme } from '@/app/_hooks'
import { useEmailLogs } from '@/app/_hooks/useEmailLogs'
import { formatRelativeTime } from '@/app/_utils/dateUtils'
import type { EmailLog, EmailLogStatus } from '@/types/cms'
import { EmailLogDetailSheet } from './EmailLogDetailSheet'
import { EmailLogStatusBadge } from './EmailLogStatusBadge'
import { RetryButton } from './RetryButton'
import { StatusFilter } from './StatusFilter'

const DEFAULT_SIZE = 20

export function EmailLogsClient() {
  const { isDarkMode } = useAdminTheme()
  const router = useRouter()
  const searchParams = useSearchParams()

  const rawStatus = searchParams.get('status') as EmailLogStatus | null
  const validStatuses: EmailLogStatus[] = ['PENDING', 'SENT', 'FAILED']
  const status =
    rawStatus && validStatuses.includes(rawStatus) ? rawStatus : undefined
  const page = Math.max(0, Number(searchParams.get('page') ?? '0'))

  const { data, isLoading, isError, error } = useEmailLogs({
    status,
    page,
    size: DEFAULT_SIZE,
  })

  const [selected, setSelected] = useState<EmailLog | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

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

  const handleStatusChange = (next: EmailLogStatus | 'ALL') => {
    pushParams({
      status: next === 'ALL' ? null : next,
      page: '0',
    })
  }

  const columns = useMemo<Column<EmailLog>[]>(
    () => [
      {
        key: 'id',
        header: 'ID',
        width: '70px',
        render: log => (
          <span className="font-mono text-xs tabular-nums">#{log.id}</span>
        ),
      },
      {
        key: 'recipient',
        header: 'Alıcı',
        render: log => (
          <span className="text-sm font-medium">{log.recipient}</span>
        ),
      },
      {
        key: 'subject',
        header: 'Konu',
        render: log => (
          <span className="block max-w-xs truncate text-sm">{log.subject}</span>
        ),
      },
      {
        key: 'template',
        header: 'Template',
        width: '160px',
        render: log => (
          <span
            className={`inline-flex rounded-md px-2 py-0.5 font-mono text-xs ${
              isDarkMode
                ? 'bg-slate-800 text-slate-300'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {log.templateName}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: '100px',
        render: log => <EmailLogStatusBadge status={log.status} />,
      },
      {
        key: 'retry',
        header: 'Retry',
        width: '70px',
        render: log => (
          <span className="text-xs tabular-nums">{log.retryCount}</span>
        ),
      },
      {
        key: 'createdAt',
        header: 'Oluşturulma',
        width: '140px',
        render: log => (
          <span
            className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
          >
            {formatRelativeTime(log.createdAt)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '',
        width: '100px',
        render: log => (
          <div className="flex justify-end">
            <RetryButton log={log} />
          </div>
        ),
      },
    ],
    [isDarkMode],
  )

  if (isError) {
    return (
      <div
        className={`rounded-xl p-4 text-sm ${
          isDarkMode
            ? 'border border-rose-500/40 bg-rose-500/10 text-rose-300'
            : 'border border-rose-200 bg-rose-50 text-rose-700'
        }`}
      >
        Email logları alınamadı: {(error as Error)?.message}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusFilter value={status ?? 'ALL'} onChange={handleStatusChange} />
        <span
          className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
        >
          Toplam <strong>{totalElements}</strong> kayıt · Sayfa{' '}
          <strong>{Math.min(page + 1, Math.max(totalPages, 1))}</strong>/
          {Math.max(totalPages, 1)}
        </span>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        isLoading={isLoading}
        keyExtractor={l => String(l.id)}
        onRowClick={l => {
          setSelected(l)
          setSheetOpen(true)
        }}
        emptyMessage={
          status
            ? `"${status}" durumunda kayıt yok`
            : 'Henüz email log kaydı yok'
        }
      />

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

      <EmailLogDetailSheet
        log={selected}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  )
}
