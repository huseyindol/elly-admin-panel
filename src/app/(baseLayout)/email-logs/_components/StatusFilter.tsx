'use client'

import { useAdminTheme } from '@/app/_hooks'
import type { EmailLogStatus } from '@/types/cms'

interface StatusFilterProps {
  value: EmailLogStatus | 'ALL'
  onChange: (status: EmailLogStatus | 'ALL') => void
}

const OPTIONS: Array<{ label: string; value: EmailLogStatus | 'ALL' }> = [
  { label: 'Tümü', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Sent', value: 'SENT' },
  { label: 'Failed', value: 'FAILED' },
]

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  const { isDarkMode } = useAdminTheme()
  return (
    <div
      className={`inline-flex rounded-xl border p-1 ${
        isDarkMode
          ? 'border-slate-800 bg-slate-900/60'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      {OPTIONS.map(opt => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? isDarkMode
                  ? 'bg-violet-500/20 text-violet-300'
                  : 'bg-white text-violet-700 shadow-sm'
                : isDarkMode
                  ? 'text-slate-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
