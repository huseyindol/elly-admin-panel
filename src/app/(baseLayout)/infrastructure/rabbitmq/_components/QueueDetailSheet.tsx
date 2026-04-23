'use client'

import { useState } from 'react'
import { Sheet } from '@/app/_components'
import { useAdminTheme, usePermission } from '@/app/_hooks'
import { Permissions, type RabbitMessage, type RabbitQueue } from '@/types/cms'
import { MessageList } from './MessageList'
import { RepublishDialog } from './RepublishDialog'

interface QueueDetailSheetProps {
  queue: RabbitQueue | null
  isOpen: boolean
  onClose: () => void
  onPurgeClick?: (queue: RabbitQueue) => void
}

export function QueueDetailSheet({
  queue,
  isOpen,
  onClose,
  onPurgeClick,
}: QueueDetailSheetProps) {
  const { isDarkMode } = useAdminTheme()
  const canManage = usePermission(Permissions.RABBIT_MANAGE)
  const [republishMessage, setRepublishMessage] =
    useState<RabbitMessage | null>(null)
  const [republishOpen, setRepublishOpen] = useState(false)

  if (!queue) {
    return (
      <Sheet isOpen={isOpen} onClose={onClose} title="Queue Detay">
        <p
          className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
        >
          Queue seçili değil.
        </p>
      </Sheet>
    )
  }

  const openRepublish = (msg: RabbitMessage | null = null) => {
    setRepublishMessage(msg)
    setRepublishOpen(true)
  }

  return (
    <>
      <Sheet
        isOpen={isOpen}
        onClose={onClose}
        title={<span className="font-mono">{queue.name}</span>}
        description={queue.vhost ? `vhost: ${queue.vhost}` : undefined}
      >
        <section className="grid grid-cols-2 gap-3 text-sm">
          <KV k="State" v={queue.state} dark={isDarkMode} />
          <KV
            k="Durable"
            v={queue.durable == null ? '—' : queue.durable ? 'evet' : 'hayır'}
            dark={isDarkMode}
          />
          <KV k="Mesaj" v={String(queue.messages ?? 0)} dark={isDarkMode} />
          <KV
            k="Ready"
            v={String(queue.messagesReady ?? 0)}
            dark={isDarkMode}
          />
          <KV
            k="Unacked"
            v={String(queue.messagesUnacknowledged ?? 0)}
            dark={isDarkMode}
          />
          <KV k="Consumer" v={String(queue.consumers ?? 0)} dark={isDarkMode} />
          <KV k="Policy" v={queue.policy ?? '—'} dark={isDarkMode} />
          <KV
            k="Auto-delete"
            v={
              queue.autoDelete == null
                ? '—'
                : queue.autoDelete
                  ? 'evet'
                  : 'hayır'
            }
            dark={isDarkMode}
          />
        </section>

        {queue.arguments && Object.keys(queue.arguments).length > 0 && (
          <section className="mt-4">
            <h3
              className={`mb-1 text-xs font-semibold uppercase tracking-wider ${
                isDarkMode ? 'text-slate-400' : 'text-gray-500'
              }`}
            >
              Arguments
            </h3>
            <pre
              className={`max-h-40 overflow-auto rounded-lg p-3 font-mono text-xs ${
                isDarkMode
                  ? 'bg-slate-950/50 text-slate-200'
                  : 'bg-gray-50 text-gray-800'
              }`}
            >
              {JSON.stringify(queue.arguments, null, 2)}
            </pre>
          </section>
        )}

        <MessageList queueName={queue.name} onRepublish={openRepublish} />

        {canManage && (
          <div
            className={`mt-6 flex flex-wrap gap-2 border-t pt-4 ${
              isDarkMode ? 'border-slate-800' : 'border-gray-200'
            }`}
          >
            <button
              type="button"
              onClick={() => openRepublish(null)}
              className={`rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
                isDarkMode
                  ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30'
                  : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
              }`}
            >
              Manuel Republish
            </button>
            <button
              type="button"
              onClick={() => onPurgeClick?.(queue)}
              disabled={(queue.messages ?? 0) === 0}
              className="rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-rose-500/30 transition-all hover:shadow-xl hover:shadow-rose-500/40 disabled:cursor-not-allowed disabled:opacity-40"
              title={
                (queue.messages ?? 0) === 0
                  ? 'Kuyruk zaten boş'
                  : `${queue.messages} mesajı sil`
              }
            >
              Purge
            </button>
          </div>
        )}
      </Sheet>

      <RepublishDialog
        isOpen={republishOpen}
        onClose={() => setRepublishOpen(false)}
        sourceQueue={queue.name}
        initialMessage={republishMessage}
      />
    </>
  )
}

function KV({ k, v, dark }: { k: string; v: string | null; dark: boolean }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        dark ? 'border-slate-800 bg-slate-950/40' : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div
        className={`text-[10px] font-semibold uppercase tracking-wider ${
          dark ? 'text-slate-500' : 'text-gray-500'
        }`}
      >
        {k}
      </div>
      <div
        className={`mt-0.5 text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}
      >
        {v ?? '—'}
      </div>
    </div>
  )
}
