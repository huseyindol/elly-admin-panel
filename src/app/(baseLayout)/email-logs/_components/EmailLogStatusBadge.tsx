'use client'

import { useAdminTheme } from '@/app/_hooks'
import type { EmailLogStatus } from '@/types/cms'

interface Props {
  status: EmailLogStatus
  size?: 'sm' | 'md'
}

export function EmailLogStatusBadge({ status, size = 'sm' }: Props) {
  const { isDarkMode } = useAdminTheme()

  const palette: Record<
    EmailLogStatus,
    { dark: string; light: string; label: string }
  > = {
    PENDING: {
      dark: 'bg-amber-500/20 text-amber-300',
      light: 'bg-amber-50 text-amber-700',
      label: 'Pending',
    },
    SENT: {
      dark: 'bg-emerald-500/20 text-emerald-300',
      light: 'bg-emerald-50 text-emerald-700',
      label: 'Sent',
    },
    FAILED: {
      dark: 'bg-rose-500/20 text-rose-300',
      light: 'bg-rose-50 text-rose-700',
      label: 'Failed',
    },
  }

  const p = palette[status]
  const classes = isDarkMode ? p.dark : p.light
  const padding = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${padding} ${classes}`}
    >
      {p.label}
    </span>
  )
}
