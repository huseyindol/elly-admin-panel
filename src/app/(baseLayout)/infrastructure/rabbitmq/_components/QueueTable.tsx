'use client'

import { useMemo, useState } from 'react'
import { Column, DataTable, DestructiveConfirmDialog } from '@/app/_components'
import { useAdminTheme, usePermission } from '@/app/_hooks'
import { usePurgeQueue, useRabbitQueues } from '@/app/_hooks/useRabbitMQ'
import { Permissions, type RabbitQueue } from '@/types/cms'
import { QueueDetailSheet } from './QueueDetailSheet'

export function QueueTable() {
  const { isDarkMode } = useAdminTheme()
  const { data, isLoading, isError, error, refetch, isFetching } =
    useRabbitQueues()
  const canManage = usePermission(Permissions.RABBIT_MANAGE)
  const purge = usePurgeQueue()

  const [selected, setSelected] = useState<RabbitQueue | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [purgeTarget, setPurgeTarget] = useState<RabbitQueue | null>(null)

  const openDetail = (q: RabbitQueue) => {
    setSelected(q)
    setSheetOpen(true)
  }

  const openPurge = (q: RabbitQueue) => {
    setPurgeTarget(q)
  }

  const queues = useMemo(() => data ?? [], [data])

  const columns = useMemo<Column<RabbitQueue>[]>(
    () => [
      {
        key: 'name',
        header: 'Queue',
        render: q => (
          <span
            className={`font-mono text-sm ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}
          >
            {q.name}
          </span>
        ),
      },
      {
        key: 'ready',
        header: 'Ready',
        render: q => (
          <span className="tabular-nums">{q.messagesReady ?? 0}</span>
        ),
        width: '90px',
      },
      {
        key: 'unacked',
        header: 'Unacked',
        render: q => (
          <span className="tabular-nums">{q.messagesUnacknowledged ?? 0}</span>
        ),
        width: '90px',
      },
      {
        key: 'total',
        header: 'Toplam',
        render: q => (
          <span className="font-semibold tabular-nums">{q.messages ?? 0}</span>
        ),
        width: '90px',
      },
      {
        key: 'consumers',
        header: 'Consumer',
        render: q => <span className="tabular-nums">{q.consumers ?? 0}</span>,
        width: '90px',
      },
      {
        key: 'state',
        header: 'State',
        render: q => <StateBadge state={q.state} />,
        width: '100px',
      },
      {
        key: 'actions',
        header: '',
        width: '120px',
        render: q => (
          <div
            className="flex justify-end gap-1"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => openPurge(q)}
              disabled={!canManage || (q.messages ?? 0) === 0}
              title={
                !canManage
                  ? 'Yetki yok'
                  : (q.messages ?? 0) === 0
                    ? 'Kuyruk boş'
                    : `${q.messages} mesajı sil`
              }
              className="rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-500 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Purge
            </button>
          </div>
        ),
      },
    ],
    [isDarkMode, canManage],
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
        Queue listesi alınamadı: {(error as Error)?.message}
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2
          className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          Kuyruklar
        </h2>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            isDarkMode
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'
          }`}
        >
          <svg
            className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Yenile
        </button>
      </div>

      <DataTable
        data={queues}
        columns={columns}
        isLoading={isLoading}
        keyExtractor={q => q.name}
        onRowClick={openDetail}
        emptyMessage="Henüz queue yok"
      />

      <QueueDetailSheet
        queue={selected}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onPurgeClick={openPurge}
      />

      <DestructiveConfirmDialog
        isOpen={!!purgeTarget}
        onClose={() => setPurgeTarget(null)}
        onConfirm={() => {
          if (!purgeTarget) return
          purge.mutate(purgeTarget.name, {
            onSuccess: () => setPurgeTarget(null),
          })
        }}
        title="Queue Purge"
        description={
          purgeTarget ? (
            <>
              <strong className="font-mono">{purgeTarget.name}</strong>{' '}
              kuyruğundaki <strong>{purgeTarget.messages ?? 0}</strong> mesaj
              kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </>
          ) : null
        }
        expectedText={purgeTarget?.name ?? ''}
        confirmText="Kuyruğu Temizle"
        isLoading={purge.isPending}
      />
    </>
  )
}

function StateBadge({ state }: { state: string | null }) {
  const { isDarkMode } = useAdminTheme()
  if (!state) {
    return (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
          isDarkMode
            ? 'bg-slate-800 text-slate-400'
            : 'bg-gray-100 text-gray-500'
        }`}
      >
        —
      </span>
    )
  }

  const color =
    state === 'running'
      ? isDarkMode
        ? 'bg-emerald-500/20 text-emerald-400'
        : 'bg-emerald-50 text-emerald-700'
      : state === 'idle'
        ? isDarkMode
          ? 'bg-slate-800 text-slate-300'
          : 'bg-gray-100 text-gray-700'
        : isDarkMode
          ? 'bg-amber-500/20 text-amber-400'
          : 'bg-amber-50 text-amber-700'

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {state}
    </span>
  )
}
