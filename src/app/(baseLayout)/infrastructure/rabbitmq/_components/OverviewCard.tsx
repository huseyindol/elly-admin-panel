'use client'

import { useAdminTheme } from '@/app/_hooks'
import { useRabbitOverview } from '@/app/_hooks/useRabbitMQ'

export function OverviewCard() {
  const { isDarkMode } = useAdminTheme()
  const { data, isLoading, isError, error } = useRabbitOverview()

  const cardClass = `rounded-2xl p-6 ${
    isDarkMode
      ? 'border border-slate-800/50 bg-slate-900/60'
      : 'border border-gray-200 bg-white'
  } backdrop-blur-sm`

  if (isLoading) {
    return (
      <div className={cardClass}>
        <div
          className={`h-6 w-56 animate-pulse rounded ${
            isDarkMode ? 'bg-slate-800' : 'bg-gray-200'
          }`}
        />
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`h-14 animate-pulse rounded ${
                isDarkMode ? 'bg-slate-800' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div
        className={`rounded-2xl p-4 text-sm ${
          isDarkMode
            ? 'border border-rose-500/40 bg-rose-500/10 text-rose-300'
            : 'border border-rose-200 bg-rose-50 text-rose-700'
        }`}
      >
        <p className="font-semibold">RabbitMQ broker durumu alınamadı</p>
        <p className="mt-1 text-xs opacity-80">
          {(error as Error)?.message ?? 'Broker şu an erişilemez olabilir.'}
        </p>
      </div>
    )
  }

  return (
    <div className={cardClass}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            RabbitMQ {data.rabbitmqVersion ?? '—'}
          </h2>
          <p
            className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}
          >
            {data.clusterName ?? 'Cluster —'} · Erlang{' '}
            {data.erlangVersion ?? '—'}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            isDarkMode
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Canlı
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Toplam Mesaj" value={data.totalMessages} />
        <Stat label="Consumer" value={data.totalConsumers} />
        <Stat label="Queue" value={data.queueCount} />
        <Stat label="Exchange" value={data.exchangeCount} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | null }) {
  const { isDarkMode } = useAdminTheme()
  return (
    <div>
      <div
        className={`text-xs font-medium uppercase tracking-wider ${
          isDarkMode ? 'text-slate-500' : 'text-gray-500'
        }`}
      >
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-semibold tabular-nums ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}
      >
        {value ?? '—'}
      </div>
    </div>
  )
}
