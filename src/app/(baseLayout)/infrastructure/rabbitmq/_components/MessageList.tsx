'use client'

import { useState } from 'react'
import { useAdminTheme } from '@/app/_hooks'
import { useQueueMessages } from '@/app/_hooks/useRabbitMQ'
import type { RabbitMessage } from '@/types/cms'

interface MessageListProps {
  queueName: string
  onRepublish?: (message: RabbitMessage) => void
}

export function MessageList({ queueName, onRepublish }: MessageListProps) {
  const { isDarkMode } = useAdminTheme()
  const [count, setCount] = useState(10)
  const { data, isFetching, refetch, error } = useQueueMessages(
    queueName,
    count,
  )

  const hasFetched = !!data

  return (
    <section className="mt-4">
      <div className="flex items-center justify-between gap-2">
        <h3
          className={`text-sm font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          Son Mesajlar <span className="text-xs opacity-60">(peek)</span>
        </h3>
        <div className="flex items-center gap-2">
          <label
            className={`flex items-center gap-1 text-xs ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`}
          >
            Adet:
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={e =>
                setCount(Math.max(1, Math.min(100, Number(e.target.value))))
              }
              className={`w-16 rounded-md border px-2 py-1 text-xs ${
                isDarkMode
                  ? 'border-slate-700 bg-slate-800 text-white'
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            />
          </label>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              isDarkMode
                ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30'
                : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
            } disabled:opacity-50`}
          >
            {isFetching
              ? 'Yükleniyor…'
              : hasFetched
                ? 'Yenile'
                : 'Mesajları Göster'}
          </button>
        </div>
      </div>

      {error && (
        <div
          className={`mt-2 rounded-lg px-3 py-2 text-xs ${
            isDarkMode
              ? 'bg-rose-500/10 text-rose-300'
              : 'bg-rose-50 text-rose-700'
          }`}
        >
          {(error as Error).message}
        </div>
      )}

      {hasFetched && data?.length === 0 && (
        <p
          className={`mt-3 text-xs ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}
        >
          Kuyrukta mesaj yok.
        </p>
      )}

      {hasFetched && data && data.length > 0 && (
        <ul className="mt-3 space-y-2">
          {data.map((m, i) => (
            <li
              key={i}
              className={`rounded-lg border text-xs ${
                isDarkMode
                  ? 'border-slate-800 bg-slate-950/50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <details>
                <summary
                  className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 ${
                    isDarkMode ? 'text-slate-200' : 'text-gray-800'
                  }`}
                >
                  <span className="font-mono">
                    #{i + 1} · {m.routingKey || '—'}
                    {m.redelivered && (
                      <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-600 dark:text-amber-400">
                        redelivered
                      </span>
                    )}
                  </span>
                  {onRepublish && (
                    <button
                      type="button"
                      onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        onRepublish(m)
                      }}
                      className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                        isDarkMode
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Republish
                    </button>
                  )}
                </summary>
                <div className="border-t px-3 py-2 dark:border-slate-800">
                  <p
                    className={`mb-1 text-[11px] font-semibold uppercase tracking-wider ${
                      isDarkMode ? 'text-slate-400' : 'text-gray-500'
                    }`}
                  >
                    Payload
                  </p>
                  <pre
                    className={`max-h-64 overflow-auto whitespace-pre-wrap break-all rounded p-2 font-mono ${
                      isDarkMode
                        ? 'bg-slate-900 text-slate-200'
                        : 'bg-white text-gray-800'
                    }`}
                  >
                    {tryFormatJson(m.payload)}
                  </pre>
                  <details className="mt-2">
                    <summary
                      className={`cursor-pointer text-[11px] ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-500'
                      }`}
                    >
                      properties
                    </summary>
                    <pre
                      className={`mt-1 max-h-40 overflow-auto rounded p-2 font-mono ${
                        isDarkMode
                          ? 'bg-slate-900 text-slate-300'
                          : 'bg-white text-gray-700'
                      }`}
                    >
                      {JSON.stringify(m.properties, null, 2)}
                    </pre>
                  </details>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function tryFormatJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}
