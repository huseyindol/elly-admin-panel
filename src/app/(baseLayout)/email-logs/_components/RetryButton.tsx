'use client'

import { usePermission } from '@/app/_hooks'
import { useRetryEmail } from '@/app/_hooks/useEmailLogs'
import { Permissions, type EmailLog } from '@/types/cms'

interface RetryButtonProps {
  log: EmailLog
  size?: 'sm' | 'md'
  onAfterRetry?: () => void
}

export function RetryButton({
  log,
  size = 'sm',
  onAfterRetry,
}: RetryButtonProps) {
  const canRetry = usePermission(Permissions.EMAILS_RETRY)
  const retry = useRetryEmail()

  const disabled = !canRetry || log.status === 'SENT' || retry.isPending
  const padding = size === 'md' ? 'px-4 py-2 text-sm' : 'px-2.5 py-1.5 text-xs'

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    retry.mutate(log.id, {
      onSuccess: () => onAfterRetry?.(),
    })
  }

  const title = !canRetry
    ? 'Yetki yok (emails:retry)'
    : log.status === 'SENT'
      ? 'Gönderilmiş mail retry edilemez'
      : 'Yeniden kuyruğa al'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={title}
      className={`rounded-lg bg-violet-500/10 font-medium text-violet-500 transition-colors hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-40 ${padding}`}
    >
      {retry.isPending ? 'Retry…' : 'Retry'}
    </button>
  )
}
