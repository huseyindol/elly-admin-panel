'use client'

import { Sheet } from '@/app/_components'
import { useAdminTheme } from '@/app/_hooks'
import { formatAbsoluteTime, formatRelativeTime } from '@/app/_utils/dateUtils'
import type { EmailLog } from '@/types/cms'
import { EmailLogStatusBadge } from './EmailLogStatusBadge'
import { RetryButton } from './RetryButton'

interface Props {
  log: EmailLog | null
  isOpen: boolean
  onClose: () => void
}

export function EmailLogDetailSheet({ log, isOpen, onClose }: Props) {
  const { isDarkMode } = useAdminTheme()

  if (!log) {
    return (
      <Sheet isOpen={isOpen} onClose={onClose} title="Email Log">
        <p
          className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
        >
          Kayıt seçili değil.
        </p>
      </Sheet>
    )
  }

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={<span>Mail #{log.id}</span>}
      description={log.recipient}
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <EmailLogStatusBadge status={log.status} size="md" />
          <span
            className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
          >
            Retry sayısı: <strong>{log.retryCount}</strong>
          </span>
        </div>

        <section className="space-y-2 text-sm">
          <KV k="Alıcı" v={log.recipient} dark={isDarkMode} mono />
          <KV k="Konu" v={log.subject} dark={isDarkMode} />
          <KV k="Template" v={log.templateName} dark={isDarkMode} mono />
          <KV
            k="Oluşturulma"
            v={`${formatAbsoluteTime(log.createdAt)} (${formatRelativeTime(log.createdAt)})`}
            dark={isDarkMode}
          />
          <KV
            k="Gönderim"
            v={
              log.sentAt
                ? `${formatAbsoluteTime(log.sentAt)} (${formatRelativeTime(log.sentAt)})`
                : 'Henüz gönderilmedi'
            }
            dark={isDarkMode}
          />
        </section>

        {log.errorMessage && (
          <section>
            <h3
              className={`mb-1 text-xs font-semibold uppercase tracking-wider ${
                isDarkMode ? 'text-rose-300' : 'text-rose-700'
              }`}
            >
              Hata Mesajı
            </h3>
            <pre
              className={`max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-lg p-3 font-mono text-xs ${
                isDarkMode
                  ? 'bg-rose-500/10 text-rose-200'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {log.errorMessage}
            </pre>
          </section>
        )}

        <div
          className={`flex items-center justify-end border-t pt-4 ${
            isDarkMode ? 'border-slate-800' : 'border-gray-200'
          }`}
        >
          <RetryButton log={log} size="md" onAfterRetry={onClose} />
        </div>
      </div>
    </Sheet>
  )
}

function KV({
  k,
  v,
  dark,
  mono = false,
}: {
  k: string
  v: string
  dark: boolean
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-gray-500'}`}
      >
        {k}
      </span>
      <span
        className={`${mono ? 'font-mono text-xs' : 'text-sm'} ${dark ? 'text-white' : 'text-gray-900'}`}
      >
        {v}
      </span>
    </div>
  )
}
