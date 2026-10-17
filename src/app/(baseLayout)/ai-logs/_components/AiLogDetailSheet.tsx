'use client'

import { Sheet } from '@/app/_components'
import { useAdminTheme } from '@/app/_hooks'
import { formatAbsoluteTime, formatRelativeTime } from '@/app/_utils/dateUtils'
import type { AiUsageLog } from '@/app/_services/ai-logs.services'

interface Props {
  log: AiUsageLog | null
  isOpen: boolean
  onClose: () => void
}

export function AiLogDetailSheet({ log, isOpen, onClose }: Readonly<Props>) {
  const { isDarkMode } = useAdminTheme()

  if (!log) {
    return (
      <Sheet isOpen={isOpen} onClose={onClose} title="AI Kullanım Detayı">
        <p
          className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
        >
          Kayıt seçili değil.
        </p>
      </Sheet>
    )
  }

  const isSuccess = log.status === 'SUCCESS'

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span>
          AI Çağrısı #{log.id} · {log.action}
        </span>
      }
      description={`${log.endpoint} (Adım #${log.stepOrder})`}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isSuccess
                ? isDarkMode
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-emerald-100 text-emerald-700'
                : isDarkMode
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-rose-100 text-rose-700'
            }`}
          >
            {isSuccess ? 'BAŞARILI' : 'HATA'}
          </span>
          <span
            className={`rounded-md px-2 py-0.5 font-mono text-xs ${
              isDarkMode
                ? 'bg-slate-800 text-violet-300'
                : 'bg-violet-50 text-violet-700'
            }`}
          >
            {log.model}
          </span>
          <span
            className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
          >
            Süre: <strong>{log.durationMs} ms</strong>
            {log.httpStatus ? ` · HTTP ${log.httpStatus}` : ''}
          </span>
        </div>

        {/* Token Kırılımı */}
        <section
          className={`grid grid-cols-2 gap-2 rounded-xl border p-3 sm:grid-cols-5 ${
            isDarkMode
              ? 'border-slate-800 bg-slate-900/60'
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          <TokenBox
            label="Input Token"
            value={log.inputTokens}
            dark={isDarkMode}
          />
          <TokenBox
            label="Output Token"
            value={log.outputTokens}
            dark={isDarkMode}
          />
          <TokenBox
            label="Thought Token"
            value={log.thoughtTokens}
            dark={isDarkMode}
          />
          <TokenBox
            label="Cached Token"
            value={log.cachedTokens}
            dark={isDarkMode}
          />
          <TokenBox
            label="Toplam Token"
            value={log.totalTokens}
            dark={isDarkMode}
            highlight
          />
        </section>

        {/* Meta Bilgiler */}
        <section className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <KV k="Endpoint" v={log.endpoint} dark={isDarkMode} mono />
          <KV
            k="İşlem / Adım"
            v={`${log.action} (Adım ${log.stepOrder})`}
            dark={isDarkMode}
            mono
          />
          <KV k="Kullanıcı" v={log.username || 'Sistem'} dark={isDarkMode} />
          <KV k="Tenant" v={log.tenantId || '-'} dark={isDarkMode} mono />
          <KV k="Request ID" v={log.requestId} dark={isDarkMode} mono />
          <KV
            k="Tarih"
            v={`${formatAbsoluteTime(log.createdAt)} (${formatRelativeTime(log.createdAt)})`}
            dark={isDarkMode}
          />
        </section>

        {log.errorMessage && (
          <CodeSection
            title={`Hata (${log.errorCode || 'ERROR'})`}
            content={log.errorMessage}
            dark={isDarkMode}
            error
          />
        )}

        {log.userInput && (
          <CodeSection
            title="Kullanıcı İsteği (User Input)"
            content={log.userInput}
            dark={isDarkMode}
          />
        )}

        {log.promptText && (
          <CodeSection
            title={`Gönderilen Prompt (${log.promptChars} karakter)`}
            content={log.promptText}
            dark={isDarkMode}
          />
        )}

        {log.responseText && (
          <CodeSection
            title={`AI Ham Yanıtı (${log.responseChars} karakter)`}
            content={log.responseText}
            dark={isDarkMode}
          />
        )}

        {log.parsedOutput && log.parsedOutput !== log.responseText && (
          <CodeSection
            title="Ayrıştırılmış Çıktı (Parsed Output)"
            content={log.parsedOutput}
            dark={isDarkMode}
          />
        )}
      </div>
    </Sheet>
  )
}

function TokenBox({
  label,
  value,
  dark,
  highlight = false,
}: Readonly<{
  label: string
  value: number
  dark: boolean
  highlight?: boolean
}>) {
  let valueColor = dark ? 'text-white' : 'text-gray-900'
  if (highlight) {
    valueColor = dark ? 'text-violet-300' : 'text-violet-700'
  }
  return (
    <div className="flex flex-col">
      <span
        className={`text-[10px] font-semibold uppercase tracking-wider ${
          dark ? 'text-slate-400' : 'text-gray-500'
        }`}
      >
        {label}
      </span>
      <span
        className={`font-mono text-sm font-bold tabular-nums ${valueColor}`}
      >
        {(value ?? 0).toLocaleString('tr-TR')}
      </span>
    </div>
  )
}

function CodeSection({
  title,
  content,
  dark,
  error = false,
}: Readonly<{
  title: string
  content: string
  dark: boolean
  error?: boolean
}>) {
  let boxClass = dark
    ? 'bg-slate-900 text-slate-200 border border-slate-800'
    : 'bg-gray-50 text-gray-800 border border-gray-200'
  if (error) {
    boxClass = dark
      ? 'bg-rose-500/10 text-rose-200 border border-rose-500/30'
      : 'bg-rose-50 text-rose-700 border border-rose-200'
  }
  return (
    <section>
      <h3
        className={`mb-1.5 text-xs font-semibold uppercase tracking-wider ${
          error
            ? dark
              ? 'text-rose-300'
              : 'text-rose-700'
            : dark
              ? 'text-slate-400'
              : 'text-gray-500'
        }`}
      >
        {title}
      </h3>
      <pre
        className={`max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg p-3 font-mono text-xs ${boxClass}`}
      >
        {content}
      </pre>
    </section>
  )
}

function KV({
  k,
  v,
  dark,
  mono = false,
}: Readonly<{
  k: string
  v: string
  dark: boolean
  mono?: boolean
}>) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={`text-[10px] font-semibold uppercase tracking-wider ${
          dark ? 'text-slate-500' : 'text-gray-500'
        }`}
      >
        {k}
      </span>
      <span
        className={`break-all ${mono ? 'font-mono text-xs' : 'text-sm'} ${
          dark ? 'text-white' : 'text-gray-900'
        }`}
      >
        {v}
      </span>
    </div>
  )
}
